/* ------------ TRO case (Redesign 2026) ------------
   Motion for /work/tro/: the logo as the page's progress bar, one large sphere that changes its
   colour version while you scroll, a sphere that grows with the scroll, the touchpoints as a
   horizontal strip and the icons appearing one by one. Builds on /assets/js/site.js; without GSAP
   (or with reduced motion) the page simply stands still. */

(function () {
  var rd = window.rd;

  // ------------ Sphere versions ------------
  // Runs on plain scroll, so it also works without GSAP
  var variants = document.querySelector('[data-tro-variants]');
  if (variants) {
    var images = [].slice.call(variants.querySelectorAll('[data-tro-variant]'));
    var dots = [].slice.call(variants.querySelectorAll('[data-tro-variant-dots] span'));
    var name = variants.querySelector('[data-tro-variant-name]');
    var shown = 0;
    var update = function () {
      var box = variants.getBoundingClientRect();
      var progress = Math.min(Math.max(-box.top / (box.height - window.innerHeight), 0), 0.999);
      var index = Math.floor(progress * images.length);
      if (index === shown) return;
      shown = index;
      images.forEach(function (img, i) { img.style.opacity = i === index ? 1 : 0; });
      dots.forEach(function (dot, i) { dot.style.opacity = i === index ? 1 : 0.25; });
      name.textContent = images[index].dataset.troVariant;
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  if (!rd || !rd.enabled) return;

  // ------------ Progress bar ------------
  // The circle travels from left to right as you scroll, like the logo on a play bar.
  // It appears after the hero and fades out at the end of the page.
  var bar = document.querySelector('[data-tro-progress]');
  if (bar) {
    var dot = bar.querySelector('[data-tro-progress-dot]');
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: function (self) {
        // From the 5px padding to just before the wordmark (10px padding + 46px wordmark + 10px gap + 24px circle)
        dot.style.left = 'calc(5px + ' + self.progress + ' * (100% - 95px))';
        var visible = window.scrollY > window.innerHeight * 0.6 && self.progress < 0.97;
        // Sit above the cookie notice while it is still showing
        var notice = document.querySelector('.cookie-notice');
        var noticeHeight = notice && notice.offsetParent ? notice.offsetHeight : 0;
        bar.style.bottom = noticeHeight ? noticeHeight + 16 + 'px' : '';
        gsap.to(bar, { opacity: visible ? 1 : 0, duration: 0.4, overwrite: 'auto' });
      }
    });
  }

  // ------------ Hero sphere drifts up and grows a little ------------
  gsap.to('[data-tro-hero-sphere]', {
    yPercent: -12, scale: 1.15, ease: 'none',
    scrollTrigger: { trigger: '[data-tro-hero-sphere]', start: 'top top', end: 'bottom top', scrub: true }
  });

  // ------------ Design concept: the sphere grows into the page ------------
  var grow = document.querySelector('[data-tro-grow]');
  if (grow) {
    gsap.fromTo('[data-tro-grow-sphere]', { scale: 0.55, xPercent: 20 }, {
      scale: 1.15, xPercent: -10, ease: 'none',
      scrollTrigger: { trigger: grow, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  }

  // ------------ Sphere palette: an endless row drifting sideways, a little faster while you scroll ------------
  var palette = document.querySelector('[data-tro-palette]');
  if (palette) {
    var drift = gsap.to(palette, { xPercent: -50, duration: 40, ease: 'none', repeat: -1 });
    ScrollTrigger.create({
      trigger: palette, start: 'top bottom', end: 'bottom top',
      onUpdate: function (self) { drift.timeScale(1 + Math.min(Math.abs(self.getVelocity()) / 300, 4)); },
      onLeave: function () { drift.timeScale(1); }, onLeaveBack: function () { drift.timeScale(1); }
    });
  }

  // ------------ Touchpoints: scroll sideways through the mockups (desktop) ------------
  var strip = document.querySelector('[data-tro-strip]');
  var track = document.querySelector('[data-tro-track]');
  if (strip && track && window.matchMedia('(min-width: 768px)').matches) {
    gsap.to(track, {
      x: function () { return -(track.scrollWidth - window.innerWidth); },
      ease: 'none',
      scrollTrigger: {
        trigger: track, start: 'center center', pin: strip, scrub: 1,
        end: function () { return '+=' + (track.scrollWidth - window.innerWidth); },
        invalidateOnRefresh: true
      }
    });
  }

  // ------------ Infographics ------------
  // Each one starts when it scrolls into view; the continuous parts only run while it is on screen
  var whileVisible = function (el, fn) {
    var on = false;
    var tick = function () { fn(performance.now() / 1000); };
    ScrollTrigger.create({
      trigger: el, start: 'top bottom', end: 'bottom top',
      onToggle: function (self) {
        if (self.isActive && !on) { gsap.ticker.add(tick); on = true; }
        if (!self.isActive && on) { gsap.ticker.remove(tick); on = false; }
      }
    });
  };

  // Sphere annotation: the sphere pulses at the 113 BPM it is labelled with, the leader lines draw in,
  // the anchor points pop and the labels type themselves
  var annotate = document.querySelector('[data-tro-info-annotate]');
  if (annotate) {
    var sphere = annotate.querySelector('image');
    var leaders = annotate.querySelectorAll('[data-tro-info-leaders] polyline');
    var anchors = annotate.querySelectorAll('[data-tro-info-anchors] circle');
    var labels = [].slice.call(annotate.querySelectorAll('[data-tro-info-labels] text'));
    var texts = labels.map(function (t) { return t.textContent; });
    leaders.forEach(function (l) { var len = l.getTotalLength(); l.style.strokeDasharray = len; l.style.strokeDashoffset = len; });
    labels.forEach(function (t) { t.textContent = ''; });
    // The sphere's size is kept in one place, so the intro and the beat don't fight over it
    var sp = { size: 0.6, beat: 0 };
    var sizeSphere = function () { gsap.set(sphere, { scale: sp.size * (1 + sp.beat), svgOrigin: '450 280' }); };
    gsap.set(sphere, { opacity: 0 });
    sizeSphere();
    gsap.set(anchors, { transformOrigin: '50% 50%', scale: 0 });

    var typed = { n: 0 };
    gsap.timeline({ scrollTrigger: { trigger: annotate, start: 'top 70%' } })
      .to(sphere, { opacity: 1, duration: 1, ease: 'power2.out' })
      .to(sp, { size: 1, duration: 1.6, ease: 'expo.out', onUpdate: sizeSphere }, 0)
      .to(anchors, { scale: 1, duration: 0.5, ease: 'back.out(3)', stagger: 0.2 }, 0.8)
      .to(leaders, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut', stagger: 0.2 }, 0.9)
      .to(typed, {
        n: 1, duration: 1, ease: 'none', delay: 0.2,
        onUpdate: function () { labels.forEach(function (t, i) { t.textContent = texts[i].slice(0, Math.round(texts[i].length * typed.n)); }); }
      }, 1.6);

    // 113 beats per minute: a short swell on every beat
    // One swell every two beats keeps the pulse calm, still in time with 113 BPM
    var beat = 60 / 113 * 2;
    whileVisible(annotate, function (t) {
      var phase = (t % beat) / beat;
      // A soft attack instead of a jump, then a long, round decay, like a bass note
      var swell = phase < 0.25 ? Math.sin(phase / 0.25 * Math.PI / 2) : Math.exp(-(phase - 0.25) * 2.8);
      sp.beat = 0.03 * swell * swell;
      sizeSphere();
    });
  }

  // Faders: vertical logo bars. The circles start at the bottom, rise one after the other to their levels,
  // hold, and move on to the next set of levels, in a calm loop like a mix that keeps changing
  var chart = document.querySelector('[data-tro-info-bars]');
  if (chart) {
    var TOP = 79, BOTTOM = 421;
    var faderDots = [].slice.call(chart.querySelectorAll('[data-tro-fader] circle'));
    var levels = [[0.3, 0.6, 0.85, 0.5, 0.35], [0.7, 0.4, 0.55, 0.9, 0.6], [0.45, 0.8, 0.35, 0.6, 0.75], [0, 0, 0, 0, 0]];
    var toY = function (level) { return BOTTOM - (BOTTOM - TOP) * level; };
    var loop = gsap.timeline({ paused: true, repeat: -1 });
    levels.forEach(function (set) {
      loop.to(faderDots, { attr: { cy: function (i) { return toY(set[i]); } }, duration: 1.4, ease: 'expo.inOut', stagger: 0.1 })
          .to({}, { duration: 0.4 });
    });
    ScrollTrigger.create({
      trigger: chart, start: 'top 70%', end: 'bottom top',
      onToggle: function (self) { self.isActive ? loop.play() : loop.pause(); }
    });
  }

  // Pie chart: the share sweeps from 0 to 40% while the number counts up; the sphere inside turns slowly
  var pie = document.querySelector('[data-tro-info-pie]');
  if (pie) {
    var slice = pie.querySelector('[data-tro-pie-slice]');
    var edge = pie.querySelector('[data-tro-pie-edge]');
    var value = pie.querySelector('[data-tro-pie-value]');
    var ring = pie.querySelector('circle');
    var fill = pie.querySelector('image');
    var share = { p: 0 };
    var drawPie = function () {
      var a = share.p / 100 * Math.PI * 2, r = 178;
      var x = 200 + r * Math.sin(a), y = 200 - r * Math.cos(a);
      // The dimmed rest runs from the end of the share clockwise back to the top
      var rest = 100 - share.p;
      slice.setAttribute('d', rest >= 99.99
        ? 'M200,22 A' + r + ',' + r + ' 0 1 1 199.99,22 Z'
        : 'M200,200 L' + x + ',' + y + ' A' + r + ',' + r + ' 0 ' + (rest > 50 ? 1 : 0) + ' 1 200,22 Z');
      edge.setAttribute('x2', x); edge.setAttribute('y2', y);
      value.textContent = Math.round(share.p) + '%';
    };
    drawPie();
    // Further segment borders, at their share of the circle, appear once the main share has filled
    var rests = [].slice.call(pie.querySelectorAll('[data-tro-pie-rest]'));
    rests.forEach(function (line) {
      var a = +line.dataset.troPieRest / 100 * Math.PI * 2;
      line.setAttribute('x2', 200 + 178 * Math.sin(a));
      line.setAttribute('y2', 200 - 178 * Math.cos(a));
    });
    var ringLength = 2 * Math.PI * 178;
    gsap.set(ring, { strokeDasharray: ringLength, strokeDashoffset: ringLength, rotation: -90, transformOrigin: '50% 50%' });
    // Plays again every time the chart comes back into view, from above or below
    var pieIntro = gsap.timeline({ paused: true })
      .to(ring, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut' })
      .to(share, { p: 40, duration: 1.8, ease: 'power3.out', onUpdate: drawPie }, 0.5)
      .to(rests, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 1.8);
    ScrollTrigger.create({
      trigger: pie, start: 'top 75%', end: 'bottom 25%',
      onEnter: function () { pieIntro.restart(); },
      onEnterBack: function () { pieIntro.restart(); },
      onLeave: function () { pieIntro.pause(0); },
      onLeaveBack: function () { pieIntro.pause(0); }
    });
    gsap.to(fill, { rotation: 360, svgOrigin: '200 200', duration: 40, ease: 'none', repeat: -1 });
  }

  // ------------ Icons appear one by one ------------
  gsap.fromTo('[data-tro-icon] img', { opacity: 0, scale: 0.6 }, {
    opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.6)', stagger: 0.08,
    scrollTrigger: { trigger: '[data-tro-icons]', start: 'top 75%' }
  });
})();
