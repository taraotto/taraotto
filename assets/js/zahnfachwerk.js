/* ------------ Zahnfachwerk case (Redesign 2026) ------------
   Interaction and motion for /work/zahnfachwerk/: the signet explained beam by beam, colours to copy and the
   website scrolling along. The hero lines, the colour fields, the timber lines and the circles around the wordmark's soft corners draw
   themselves with GSAP; without it (or with reduced motion) everything simply stands in its final state. */

(function () {
  var rd = window.rd;

  // ------------ Signet: light up the beams that form the tooth, the frame or a letter ------------
  var logoSection = document.querySelector('[data-zfw-logo]');
  if (logoSection) {
    var shows = [].slice.call(logoSection.querySelectorAll('[data-zfw-show]'));
    var lit = [].slice.call(logoSection.querySelectorAll('[data-zfw-highlight] [data-beam]'));
    var light = function (btn) {
      var beams = btn ? btn.dataset.zfwShow.split(' ') : [];
      shows.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
      lit.forEach(function (p) { p.classList.toggle('opacity-0', beams.indexOf(p.dataset.beam) < 0); });
    };
    // Hovering (or focusing) a button lights its beams; on touch screens a tap toggles them instead
    var pointer = 'mouse';
    shows.forEach(function (b) {
      b.addEventListener('pointerdown', function (e) { pointer = e.pointerType; });
      b.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') light(b); });
      b.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') light(null); });
      b.addEventListener('focus', function () { if (b.matches(':focus-visible')) light(b); });
      b.addEventListener('blur', function () { light(null); });
      b.addEventListener('click', function () {
        if (pointer !== 'mouse') light(b.getAttribute('aria-pressed') === 'true' ? null : b);
      });
    });
  }

  // ------------ Colours: click to copy the hex code ------------
  [].slice.call(document.querySelectorAll('[data-zfw-copy]')).forEach(function (btn) {
    btn.addEventListener('click', function () {
      var label = btn.querySelector('[data-zfw-copy-label]');
      var hex = btn.dataset.zfwCopy;
      var done = function () { label.textContent = 'Copied ' + hex; setTimeout(function () { label.textContent = hex; }, 1400); };
      if (navigator.clipboard) navigator.clipboard.writeText(hex).then(done, function () {}); else done();
    });
  });

  // ------------ Website: the pages scroll inside their screens while the section sticks ------------
  var web = document.querySelector('[data-zfw-web]');
  if (web) {
    var screens = [].slice.call(web.querySelectorAll('[data-zfw-screen]'));
    var scrollPages = function () {
      var box = web.getBoundingClientRect();
      var progress = Math.min(Math.max(-box.top / (box.height - window.innerHeight), 0), 1);
      screens.forEach(function (s) {
        var page = s.querySelector('img');
        page.style.transform = 'translateY(' + -(page.offsetHeight - s.offsetHeight) * progress + 'px)';
      });
    };
    window.addEventListener('scroll', scrollPages, { passive: true });
    window.addEventListener('resize', scrollPages);
    scrollPages();
  }

  if (!rd || !rd.enabled) return;

  // ------------ Drawing: lines and circles appear like strokes of a pen ------------
  var prepare = function (els) {
    els.forEach(function (el) { var len = el.getTotalLength(); gsap.set(el, { strokeDasharray: len, strokeDashoffset: len }); });
    return els;
  };

  // Hero: the timber lines draw across the page, posts and beams first, then the 45 degree braces
  var heroTl = gsap.timeline({ paused: true })
    .to(prepare([].slice.call(document.querySelectorAll('[data-zfw-hero-lines] path'))), { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut', stagger: 0.12 });
  rd.onEnter(function () { heroTl.play(); });

  // The name: typed letter by letter when it comes into view; the letters keep their place and the caret floats
  // beside them, so nothing shifts. The caret goes once the name is complete
  var name = document.querySelector('[data-zfw-type]');
  if (name) {
    var letters = [];
    [].slice.call(name.children).forEach(function (part) {
      var text = part.textContent;
      part.textContent = '';
      part.style.position = 'relative';
      text.split('').forEach(function (c) {
        var l = document.createElement('span');
        l.textContent = c;
        l.style.visibility = 'hidden';
        part.appendChild(l);
        letters.push(l);
      });
    });
    var nameCaret = document.createElement('span');
    nameCaret.className = 'rd-caret rd-caret--typing';
    nameCaret.style.position = 'absolute';
    letters[0].parentNode.insertBefore(nameCaret, letters[0]);
    ScrollTrigger.create({
      trigger: name, start: 'top 80%', once: true,
      onEnter: function () {
        (function step(i) {
          if (i === letters.length) return nameCaret.remove();
          letters[i].style.visibility = '';
          letters[i].parentNode.insertBefore(nameCaret, letters[i].nextSibling);
          setTimeout(function () { step(i + 1); }, 90 + Math.random() * 60);
        })(0);
      }
    });
  }

  // Round logo: the ring of type turns with the scroll, from when it appears until the end of the page;
  // the signet in the middle stays upright
  gsap.to('[data-zfw-ring]', {
    rotation: 720, svgOrigin: '280 280', ease: 'none',
    scrollTrigger: { trigger: '[data-zfw-ring]', start: 'top bottom', end: 'max', scrub: true }
  });

  // Wordmark: thin circles around its soft corners
  var roundings = prepare([].slice.call(document.querySelectorAll('[data-zfw-roundings] circle')));
  gsap.to(roundings, {
    strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut', stagger: 0.4,
    scrollTrigger: { trigger: '[data-zfw-wordmark]', start: 'top 90%' }
  });

  // Colours: the fields rise one after another, like paint filling a frame, then their names fade in
  var fields = [].slice.call(document.querySelectorAll('[data-zfw-copy]'));
  if (fields.length) {
    gsap.timeline({ scrollTrigger: { trigger: fields[0].parentElement, start: 'top 75%' } })
      .fromTo(fields, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'expo.inOut', stagger: 0.15 })
      .fromTo([].concat.apply([], fields.map(function (f) { return [].slice.call(f.children); })), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.08 }, 0.7);
  }

  // Design language: the timber lines draw in one after another; once drawn, the dash is dropped so the
  // braces render as one clean line
  var frameLines = prepare([].slice.call(document.querySelectorAll('[data-zfw-lines] path')));
  gsap.to(frameLines, {
    strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut', stagger: 0.15,
    onComplete: function () { gsap.set(frameLines, { strokeDasharray: 'none' }); },
    scrollTrigger: { trigger: '[data-zfw-lines]', start: 'top 70%' }
  });
})();
