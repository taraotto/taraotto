// netlify/edge-functions/suite-life-gate.ts
//
// Passwortschutz für die gesamte Subdomain thesuitelifeof.taraotto.com
//
// Ein Passwort, gesetzt als Environment-Variable in Netlify: PW_THESUITELIFEOF
// Ist die Variable nicht gesetzt, bleibt die Subdomain offen.
//
// Läuft vor dem Host-Rewrite in netlify.toml (Edge Functions werden vor
// Redirects ausgeführt), daher wird hier noch der ursprüngliche Pfad
// gesehen, nicht /suite-life-of/*.

import type { Context } from "@netlify/edge-functions";

const HOST = "thesuitelifeof.taraotto.com";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 Tage
const COOKIE_NAME = "suitelife_gate";

// Statische Assets müssen ungegated bleiben, sonst lädt weder die Login-
// Seite selbst noch die eigentliche Seite danach Schrift/Styles/Favicon.
const ASSET_PREFIXES = ["/assets/", "/dist/", "/favicon/"];

const THEME = {
  bg: "#e3e8dd", // sage-200
  ink: "#000000",
  border: "#000000",
  display: "'Canela Web', 'EB Garamond', serif",
  sans: "'Montserrat', sans-serif",
  fontUrl:
    "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600&display=swap",
  studio: "The Suite Life Of",
  hint: "Diese Seite ist passwortgeschützt.",
};

async function tokenFor(secret: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`suitelife:${secret}`),
  );
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function loginPage(failed: boolean): string {
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow, noarchive">
<title>${THEME.studio}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${THEME.fontUrl}">
<style>
  @font-face {
    font-family: 'Canela Web';
    src: url('/assets/fonts/Canela-Thin-Web.woff2') format('woff2'),
    url('/assets/fonts/Canela-Thin-Web.woff') format('woff');
    font-weight: 300;
    font-style: normal;
  }
  @font-face {
    font-family: 'Canela Web';
    src: url('/assets/fonts/Canela-ThinItalic-Web.woff2') format('woff2'),
    url('/assets/fonts/Canela-ThinItalic-Web.woff') format('woff');
    font-weight: 300;
    font-style: italic;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100dvh;
    display: grid; place-items: center;
    background: ${THEME.bg}; color: ${THEME.ink};
    font-family: ${THEME.sans};
    padding: 1.5rem;
  }
  main { width: 100%; max-width: 22rem; text-align: center; }
  h1 {
    font-family: ${THEME.display};
    font-weight: 300; font-style: italic;
    font-size: 2.5rem; line-height: 1.1;
    margin: 0 0 1.5rem; letter-spacing: .01em;
  }
  p.hint {
    font-size: .8rem; letter-spacing: .02em; opacity: .7;
    margin: 0 0 2.5rem; line-height: 1.5;
  }
  label {
    display: block; text-align: left;
    font-size: .75rem; text-transform: uppercase;
    letter-spacing: .2em; font-weight: 600;
    margin-bottom: .5rem;
  }
  input {
    width: 100%; font-family: inherit; font-size: 1rem;
    padding: .75rem; border: 1px solid ${THEME.border};
    background: ${THEME.bg}; color: inherit;
    margin-bottom: 1.5rem;
  }
  input:focus { outline: none; border-color: ${THEME.ink}; }
  button {
    width: 100%; font-family: inherit;
    padding: .75rem 1.5rem; border-radius: 9999px;
    border: 1px solid ${THEME.border};
    background: transparent; color: ${THEME.ink};
    cursor: pointer; letter-spacing: .2em;
    font-size: .75rem; font-weight: 600; text-transform: uppercase;
    transition: background .2s ease;
  }
  button:hover { background: rgba(0, 0, 0, .06); }
  .error {
    color: #8a2c1c; font-size: .8rem;
    margin: 1rem 0 0;
  }
</style>
</head>
<body>
  <main>
    <h1>${THEME.studio}</h1>
    <p class="hint">${THEME.hint}</p>
    <form method="POST">
      <label for="pw">Passwort</label>
      <input id="pw" type="password" name="password"
             autocomplete="current-password" autofocus required>
      <button type="submit">Ansehen</button>
      ${failed ? '<p class="error">Das Passwort stimmt nicht.</p>' : ""}
    </form>
  </main>
</body>
</html>`;
}

const htmlResponse = (body: string, status: number) =>
  new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });

// Netlify-Redirects unterstützen kein Host-basiertes "conditions" — das
// Routing auf /suite-life-of/* passiert deshalb hier per context.rewrite(),
// nicht über netlify.toml.
function rewriteToSuiteLife(url: URL, context: Context) {
  const target = "/suite-life-of" + url.pathname + url.search;
  return context.rewrite(target);
}

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);

  if (url.hostname !== HOST) return context.next();
  if (ASSET_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
    return context.next();
  }

  const password = Netlify.env.get("PW_THESUITELIFEOF");
  if (!password) return rewriteToSuiteLife(url, context); // kein Passwort gesetzt → offen

  const expected = await tokenFor(password);
  const cookies = request.headers.get("cookie") ?? "";

  if (cookies.includes(`${COOKIE_NAME}=${expected}`)) {
    return rewriteToSuiteLife(url, context);
  }

  if (request.method === "POST") {
    const form = await request.formData();
    if (form.get("password") === password) {
      return new Response(null, {
        status: 303,
        headers: {
          location: url.pathname,
          "set-cookie":
            `${COOKIE_NAME}=${expected}; Path=/; HttpOnly; ` +
            `Secure; SameSite=Lax; Max-Age=${MAX_AGE}`,
        },
      });
    }
    return htmlResponse(loginPage(true), 401);
  }

  return htmlResponse(loginPage(false), 401);
};

export const config = { path: "/*" };
