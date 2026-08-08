// netlify/edge-functions/angebot-gate.ts
//
// Passwortschutz für Angebotsseiten unter /angebot/*
//
// Ein Passwort pro Angebot, gesetzt als Environment-Variable in Netlify:
//   /angebot/studio-barz/  →  PW_STUDIO_BARZ
//   /angebot/muster-gmbh/  →  PW_MUSTER_GMBH
//
// Ist für einen Slug keine Variable gesetzt, bleibt die Seite offen.
// Praktisch für Entwürfe, die noch niemand sehen soll — einfach keine
// Variable anlegen und die Seite ist noch nicht verlinkt.

import type { Context } from "@netlify/edge-functions";

const MAX_AGE = 60 * 60 * 24 * 30; // 30 Tage

// ---------------------------------------------------------------------------
// Gestaltung der Passwortseite
//
// Diese Seite liegt VOR dem Gate und kann /dist/main.css nicht laden, weil
// der Request die eigentliche Jekyll-Seite nie erreicht. Schriften und
// Farben sind deshalb hier dupliziert — Canela Web wird als Web-Font direkt
// von /assets/fonts geladen (funktioniert, weil /assets/* nicht hinter dem
// Gate liegt), Montserrat kommt wie im Rest der Seite von Google Fonts.
// ---------------------------------------------------------------------------
const THEME = {
  bg: "#e3e8dd", // sage-200
  ink: "#000000",
  border: "#000000",
  display: "'Canela Web', 'EB Garamond', serif",
  sans: "'Montserrat', sans-serif",
  fontUrl:
    "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600&display=swap",
  studio: "Tara Otto",
  hint: "Dieses Angebot ist passwortgeschützt.",
};

function slugFromPath(pathname: string): string | null {
  // /angebot/studio-barz/  →  studio-barz
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "angebot" || !parts[1]) return null;
  return parts[1];
}

function envKeyFor(slug: string): string {
  // studio-barz  →  PW_STUDIO_BARZ
  return "PW_" + slug.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
}

async function tokenFor(slug: string, secret: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`angebot:${slug}:${secret}`),
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
  .tinytitle {
    display: block;
    font-size: .75rem; text-transform: uppercase;
    letter-spacing: .3em; font-weight: 600;
    margin-bottom: .5rem;
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
    <span class="tinytitle">Angebot</span>
    <h1>${THEME.studio}</h1>
    <p class="hint">${THEME.hint}</p>
    <form method="POST">
      <label for="pw">Passwort</label>
      <input id="pw" type="password" name="password"
             autocomplete="current-password" autofocus required>
      <button type="submit">Angebot ansehen</button>
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

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const slug = slugFromPath(url.pathname);
  if (!slug) return context.next();

  const password = Netlify.env.get(envKeyFor(slug));
  if (!password) return context.next(); // kein Passwort gesetzt → offen

  const cookieName = `angebot_${slug.replace(/[^a-zA-Z0-9]+/g, "_")}`;
  const expected = await tokenFor(slug, password);
  const cookies = request.headers.get("cookie") ?? "";

  if (cookies.includes(`${cookieName}=${expected}`)) {
    return context.next();
  }

  if (request.method === "POST") {
    const form = await request.formData();
    if (form.get("password") === password) {
      return new Response(null, {
        status: 303,
        headers: {
          location: url.pathname,
          "set-cookie":
            `${cookieName}=${expected}; Path=/angebot/${slug}; HttpOnly; ` +
            `Secure; SameSite=Lax; Max-Age=${MAX_AGE}`,
        },
      });
    }
    return htmlResponse(loginPage(true), 401);
  }

  return htmlResponse(loginPage(false), 401);
};

export const config = { path: "/angebot/*" };
