/* ------------ Zahnfachwerk case (Redesign 2026) ------------
   Interaction and motion for /work/zahnfachwerk/: the signet explained beam by beam, colours to copy and the
   website scrolling along. The hero lines, the timber lines and the circles around the wordmark's soft corners draw
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
    shows.forEach(function (b) {
      b.addEventListener('click', function () { light(b.getAttribute('aria-pressed') === 'true' ? null : b); });
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

  // Round logo: the ring of type turns with the scroll, from when it appears until the end of the page;
  // the signet in the middle stays upright
  gsap.to('[data-zfw-ring]', {
    rotation: 720, svgOrigin: '280 280', ease: 'none',
    scrollTrigger: { trigger: '[data-zfw-ring]', start: 'top bottom', end: 'max', scrub: true }
  });

  // Wordmark: thin circles around its soft corners
  var roundings = prepare([].slice.call(document.querySelectorAll('[data-zfw-roundings] circle')));
  gsap.to(roundings, {
    strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut', stagger: 0.4, delay: 0.3,
    scrollTrigger: { trigger: '[data-zfw-wordmark]', start: 'top 60%' }
  });

  // Design language: the timber lines draw in one after another; once drawn, the dash is dropped so the
  // braces render as one clean line
  var frameLines = prepare([].slice.call(document.querySelectorAll('[data-zfw-lines] path')));
  gsap.to(frameLines, {
    strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut', stagger: 0.15,
    onComplete: function () { gsap.set(frameLines, { strokeDasharray: 'none' }); },
    scrollTrigger: { trigger: '[data-zfw-lines]', start: 'top 70%' }
  });
})();
