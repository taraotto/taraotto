/* ------------ Shared animations (Redesign 2026) ------------
   Runs on every page with the redesign layout. Uses GSAP +
   ScrollTrigger and Lenis (loaded in the layout). Without them, or
   with reduced motion, the page stays static.

   Markup hooks:
   data-intro="fade"     fades in on load (above the fold)
   data-intro="reveal"   is uncovered from the bottom on load
   data-intro-zoom       slowly zooms out on load (images)
   data-reveal           fades up when scrolled into view
   data-reveal-image     is uncovered from the bottom when scrolled into view (wraps an img or video)
   data-split            headline rises word by word on load
   data-parallax="0.15"  moves against the scroll by that share of its height
   data-bg / data-fg     colours the [data-page] wrapper while this section is in view
   data-hover-image      shows that image next to the cursor on hover
   data-type             typed claim, see data-endings
   data-clock            live local time, see data-city / data-timezone

   Page scripts can build on window.rd (ease, clip states, intro timeline). */

(function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var rd = window.rd = { enabled: false };

  // ------------ Inline form fields ------------
  // As wide as their placeholder, growing with the text. Browsers without
  // CSS field-sizing (Safari, Firefox) get the width measured here instead.
  if (!(window.CSS && CSS.supports('field-sizing', 'content'))) {
    var measure = document.createElement('span');
    measure.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;';
    document.body.appendChild(measure);

    document.querySelectorAll('.rd-inline-field').forEach(function (field) {
      var fit = function () {
        measure.style.font = getComputedStyle(field).font;
        measure.textContent = field.value || field.placeholder;
        field.style.width = Math.min(Math.ceil(measure.offsetWidth) + 8, field.parentElement.clientWidth - 12) + 'px';
        // Textareas also grow in height once the text wraps
        if (field.tagName === 'TEXTAREA') {
          field.style.height = 'auto';
          field.style.height = field.scrollHeight + 'px';
        }
      };
      field.addEventListener('input', fit);
      fit();
      if (document.fonts) document.fonts.ready.then(fit);
    });
  }

  // ------------ Live local time ------------
  // "Currently in Düsseldorf / 22:41 CET", the colon blinks with the seconds.
  var clock = document.querySelector('[data-clock]');

  if (clock) {
    var format = function (options) {
      return new Intl.DateTimeFormat('en-GB', Object.assign({ timeZone: clock.dataset.timezone }, options)).format(new Date());
    };
    var tick = function () {
      var time = format({ hour: '2-digit', minute: '2-digit', hour12: false }).split(':');
      var zone = format({ timeZoneName: 'short' }).split(' ').pop();
      var colon = new Date().getSeconds() % 2 ? '<span style="opacity:0">:</span>' : ':';
      clock.innerHTML = 'Currently in ' + clock.dataset.city + '<br>' + time[0] + colon + time[1] + ' ' + zone;
    };
    tick();
    setInterval(tick, 1000);
  }

  if (reduceMotion || !window.gsap || !window.ScrollTrigger) {
    root.classList.remove('rd-js');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  rd.enabled = true;
  rd.ease = 'expo.out';
  rd.hidden = 'inset(100% 0% 0% 0%)';
  rd.shown = 'inset(0% 0% 0% 0%)';

  // ------------ Smooth scrolling ------------
  if (window.Lenis) {
    var lenis = new Lenis({ lerp: 0.09, anchors: true }); // anchors: in-page links scroll smoothly
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  // ------------ Loading screen ------------
  // The stamp appears and each sentence is typed around its "TO", then deleted for the next one; the
  // last one stays. Clicking the stamp wipes the screen up. Anything that should wait for the page to
  // be revealed (the intro, the typed claim) goes through rd.onEnter.
  var loader = document.querySelector('[data-loader]');
  var entered = !(loader && root.classList.contains('rd-loading'));
  var waiting = [];
  rd.onEnter = function (fn) { entered ? fn() : waiting.push(fn); };

  if (!entered) {
    var left = loader.querySelector('[data-loader-left]');
    var right = loader.querySelector('[data-loader-right]');
    var stamp = loader.querySelector('[data-loader-stamp]');
    var lines = loader.dataset.lines.split('\n').map(function (line) { return line.split('|'); });
    var caret = document.createElement('span');
    caret.className = 'rd-caret';
    var timer;

    var wait = function (ms, next) { timer = setTimeout(next, ms); };
    // Types (or deletes) one side, keeping the caret at the end of the text
    var type = function (el, text, deleting, next) {
      el.appendChild(caret);
      caret.classList.add('rd-caret--typing');
      (function step() {
        var now = el.firstChild && el.firstChild.nodeType === 3 ? el.firstChild.textContent : '';
        if (now === (deleting ? '' : text)) { caret.classList.remove('rd-caret--typing'); return next(); }
        var value = deleting ? now.slice(0, -1) : text.slice(0, now.length + 1);
        if (el.firstChild && el.firstChild.nodeType === 3) el.firstChild.textContent = value;
        else el.insertBefore(document.createTextNode(value), caret);
        wait(deleting ? 28 : 60 + Math.random() * 40, step);
      })();
    };
    var play = function (i) {
      var line = lines[i];
      type(left, line[0] || '', false, function () {
        type(right, line[1] || '', false, function () {
          if (i === lines.length - 1) return;
          wait(1400, function () {
            type(right, '', true, function () {
              type(left, '', true, function () { wait(300, function () { play(i + 1); }); });
            });
          });
        });
      });
    };

    if (lenis) lenis.stop();
    gsap.fromTo(stamp, { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 1.2, ease: rd.ease, delay: 0.1 });
    wait(900, function () { play(0); });

    var enter = function () {
      if (entered) return;
      entered = true;
      clearTimeout(timer);
      try { sessionStorage.setItem('rd-loaded', '1'); } catch (e) {}
      gsap.to(loader, {
        clipPath: 'inset(0% 0% 100% 0%)', duration: 1.3, ease: 'expo.inOut',
        onComplete: function () {
          root.classList.remove('rd-loading');
          loader.remove();
          if (lenis) lenis.start();
        }
      });
      // The page intro starts while the screen is still wiping up
      gsap.delayedCall(0.7, function () { waiting.forEach(function (fn) { fn(); }); });
    };
    stamp.addEventListener('click', enter);
  }

  // ------------ Split headlines ------------
  // Wraps every word in a clipping mask (keeping <em> etc.) so it can rise into view.
  var splitWords = function (node) {
    Array.prototype.slice.call(node.childNodes).forEach(function (child) {
      if (child.nodeType === 1) return splitWords(child);
      if (child.nodeType !== 3 || !child.textContent.trim()) return;
      var fragment = document.createDocumentFragment();
      child.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) return fragment.appendChild(document.createTextNode(part));
        var mask = document.createElement('span');
        mask.className = 'rd-word';
        mask.innerHTML = '<span></span>';
        mask.firstChild.textContent = part;
        fragment.appendChild(mask);
      });
      child.replaceWith(fragment);
    });
  };

  var splits = document.querySelectorAll('[data-split]');
  splits.forEach(function (el) {
    el.setAttribute('aria-label', el.innerHTML.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').trim());
    splitWords(el);
    gsap.set(el, { opacity: 1 });
  });

  // ------------ Intro ------------
  rd.intro = gsap.timeline({ defaults: { ease: rd.ease }, paused: true })
    .fromTo('[data-split] .rd-word > span', { yPercent: 110 }, { yPercent: 0, duration: 1.4, stagger: 0.07 }, 0.2)
    .fromTo('[data-intro="reveal"]', { clipPath: rd.hidden }, { clipPath: rd.shown, duration: 1.6, stagger: 0.25 }, 0)
    .fromTo('[data-intro-zoom]', { scale: 1.18 }, { scale: 1, duration: 2.2 }, 0)
    .fromTo('[data-intro="fade"]',
      { opacity: 0, y: 14, filter: 'blur(6px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.4, stagger: 0.12, clearProps: 'filter,transform' }, 0.6);

  rd.onEnter(function () { rd.intro.play(); });

  // ------------ Reveal on scroll ------------
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 85%',
    once: true,
    onEnter: function (batch) {
      gsap.fromTo(batch, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.2, ease: rd.ease, stagger: 0.1 });
    }
  });

  ScrollTrigger.batch('[data-reveal-image]', {
    start: 'top 85%',
    once: true,
    onEnter: function (batch) {
      gsap.fromTo(batch, { clipPath: rd.hidden }, { clipPath: rd.shown, duration: 1.6, ease: rd.ease, stagger: 0.15 });
      gsap.fromTo(batch.map(function (el) { return el.querySelector('img, video'); }), { scale: 1.2 }, { scale: 1, duration: 2, ease: rd.ease, stagger: 0.15 });
    }
  });

  // ------------ Parallax ------------
  gsap.utils.toArray('[data-parallax]').forEach(function (el) {
    var amount = parseFloat(el.dataset.parallax) * 100;
    gsap.fromTo(el, { yPercent: amount }, {
      yPercent: -amount, ease: 'none',
      scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  // ------------ Page colour per section ------------
  // While a [data-bg] section fills the middle of the screen the page wrapper takes its colours.
  var page = document.querySelector('[data-page]');

  if (page) {
    var base = { backgroundColor: getComputedStyle(page).backgroundColor, color: getComputedStyle(page).color };
    var paint = function (colors) { gsap.to(page, Object.assign({ duration: 0.8, ease: 'power2.out', overwrite: true }, colors)); };

    gsap.utils.toArray('[data-bg]').forEach(function (section) {
      ScrollTrigger.create({
        trigger: section,
        start: 'top 55%',
        end: 'bottom 45%',
        onToggle: function (self) {
          paint(self.isActive ? { backgroundColor: section.dataset.bg, color: section.dataset.fg || base.color } : base);
        }
      });
    });
  }

  // ------------ Hover images ------------
  // A floating preview that follows the cursor; mouse and trackpad only.
  var hoverItems = document.querySelectorAll('[data-hover-image]');

  if (hoverItems.length && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var preview = document.createElement('div');
    preview.className = 'rd-hover-preview';
    preview.innerHTML = '<img alt="">';
    document.body.appendChild(preview);

    var previewImg = preview.firstChild;
    var moveX = gsap.quickTo(preview, 'x', { duration: 0.6, ease: 'power3.out' });
    var moveY = gsap.quickTo(preview, 'y', { duration: 0.6, ease: 'power3.out' });

    window.addEventListener('mousemove', function (e) { moveX(e.clientX + 24); moveY(e.clientY - 120); });

    hoverItems.forEach(function (item) {
      new Image().src = item.dataset.hoverImage; // preload
      item.addEventListener('mouseenter', function () {
        previewImg.src = item.dataset.hoverImage;
        gsap.to(preview, { opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
      });
      item.addEventListener('mouseleave', function () {
        gsap.to(preview, { opacity: 0, scale: 0.85, duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
      });
    });
  }

  // ------------ Booking band ------------
  gsap.fromTo('.rd-booking-img', { yPercent: -12, scale: 1.25 }, {
    yPercent: 12, ease: 'none',
    scrollTrigger: { trigger: '.rd-booking', start: 'top bottom', end: 'bottom top', scrub: true }
  });

  // ------------ Typed claim ------------
  // Types the claim after the intro. On hover the last words are deleted and
  // replaced by the next ending from data-endings ("intention.|care.|…").
  var claim = document.querySelector('[data-type]');

  if (claim) {
    var text = claim.innerHTML.split(/<br\s*\/?>/i).map(function (line) { return line.trim(); }).join('\n');
    var endings = (claim.dataset.endings || '').split('|').filter(Boolean);
    var prefix = endings.length ? text.slice(0, text.length - endings[0].length) : text;
    var current = 0;
    var typed = '';
    var typing = false;

    claim.setAttribute('aria-label', text.replace('\n', ' '));
    // Keep the claim's footprint so nothing shifts while it is typed
    claim.style.minWidth = claim.offsetWidth + 'px';
    claim.style.minHeight = claim.offsetHeight + 'px';

    // Built once: only the text node changes per letter, so the caret keeps its blink
    var textEl = document.createElement('span');
    var caretEl = document.createElement('span');
    textEl.setAttribute('aria-hidden', 'true');
    textEl.style.whiteSpace = 'pre-line';
    caretEl.className = 'rd-caret';
    claim.textContent = '';
    claim.appendChild(textEl);
    claim.appendChild(caretEl);

    // Moves the visible text towards target: deletes back to the shared part, then types the rest.
    // Runs on animation frames with an even rhythm instead of chained timeouts.
    var typeTo = function (target, speed, done) {
      typing = true;
      caretEl.classList.add('rd-caret--typing');
      var due = 0;

      (function frame(now) {
        if (!due) due = now;
        while (now >= due) {
          var deleting = target.indexOf(typed) !== 0;
          if (deleting) {
            typed = typed.slice(0, -1);
          } else if (typed.length < target.length) {
            typed = target.slice(0, typed.length + 1);
          } else {
            textEl.textContent = typed;
            typing = false;
            caretEl.classList.remove('rd-caret--typing');
            return done && done();
          }
          // Faster when deleting, a short pause at the line break, a little variation elsewhere
          due += deleting ? speed * 0.5
            : typed.slice(-1) === '\n' ? speed * 5
            : speed * (0.85 + Math.random() * 0.3);
        }
        textEl.textContent = typed;
        requestAnimationFrame(frame);
      })(performance.now());
    };

    rd.onEnter(function () {
      gsap.set(claim, { opacity: 1, delay: 0.8, onComplete: function () { typeTo(text, 55); } });
    });

    claim.addEventListener('mouseenter', function () {
      if (typing || endings.length < 2) return;
      current = (current + 1) % endings.length;
      var next = prefix + endings[current];
      typeTo(next, 45, function () { claim.setAttribute('aria-label', next.replace('\n', ' ')); });
    });
  }

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
