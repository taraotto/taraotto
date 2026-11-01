/* ------------ Galeria case (Redesign 2026) ------------
   Motion for /work/galeria/: the construction lines draw themselves over the signet before its meanings appear, one large signet runs through the
   brand's colour pairs, and the snapshots flick through like a GIF. The signet is always shown whole and never rotated.
   Builds on /assets/js/site.js; without GSAP (or with reduced motion) it stands still. */

(function () {
  var rd = window.rd;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var logo = function (id) { return document.querySelector('[data-galeria-logo="' + id + '"]'); };
  var progressOf = function (section) {
    var box = section.getBoundingClientRect();
    return Math.min(Math.max(-box.top / (box.height - window.innerHeight), 0), 0.999);
  };

  // ------------ Colour pairs: background, signet and logotype from the brand's combinations ------------
  var pairs = document.querySelector('[data-galeria-pairs]');
  if (pairs) {
    var combos = [
      // background, signet, logotype, light background (eyebrow turns anthracite)
      ['#145a5a', '#e6781e', '#c8e6cd'], ['#c3e6f5', '#2d4669', '#87005f', true], ['#5f64be', '#f0eb73', '#d2d7f0'],
      ['#ebdceb', '#5f64be', '#05c3dc', true], ['#87005f', '#c8e6cd', '#ebdceb']
    ];
    var pairBg = pairs.querySelector('[data-galeria-pair-bg]');
    var pairTitle = pairs.querySelector('[data-galeria-pair-title]');
    var pairWord = pairs.querySelector('[data-galeria-pair-word]');
    var pairSignet = logo('pairs').querySelector('g[stroke-width="114"]');
    var shownPair = 0;
    var showPair = function () {
      var index = Math.floor(progressOf(pairs) * combos.length);
      if (index === shownPair) return;
      shownPair = index;
      var c = combos[index];
      pairBg.style.background = c[0];
      pairSignet.style.transition = 'stroke 0.7s';
      pairSignet.setAttribute('stroke', c[1]);
      pairTitle.style.color = c[3] ? '#52545a' : '#ffffff';
      pairWord.style.color = c[2];
    };
    window.addEventListener('scroll', showPair, { passive: true });
  }

  // ------------ Snapshots: flick through like a GIF while on screen ------------
  var snaps = document.querySelector('[data-galeria-snapshots]');
  if (snaps && !reduce) {
    var frames = [].slice.call(snaps.querySelectorAll('img'));
    var frame = 0, timer = null;
    var next = function () {
      frames[frame].style.opacity = 0;
      frame = (frame + 1) % frames.length;
      frames[frame].style.opacity = 1;
    };
    frames.forEach(function (f) { f.loading = 'eager'; });
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { if (!timer) timer = setInterval(next, 450); }
      else { clearInterval(timer); timer = null; }
    }, { threshold: 0.3 }).observe(snaps);
  }

  if (!rd || !rd.enabled) return;

  // ------------ Sketch: the light signet is there from the start, the thin construction lines draw over it; replays on return ------------
  var sketch = logo('sketch');
  if (sketch) {
    // Real lengths instead of pathLength, so the lines draw smoothly in every browser
    var guides = [].slice.call(sketch.querySelectorAll('[data-sketch] circle, [data-sketch] rect'));
    guides.forEach(function (el) {
      var len = el.getTotalLength();
      gsap.set(el, { strokeDasharray: len, strokeDashoffset: len });
    });
    // Calm, like drawing with a compass, with several lines on the way at once
    // Then the meanings appear, one line after the other, rising out of their own line
    var meaningLines = [].slice.call(document.querySelectorAll('[data-galeria-sketch] [data-meaning]'));
    // Loops while on screen: draw, hold, then the lines retract the way they came (last drawn first)
    // while the meanings sink away, and it starts again
    var sketchTl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 0.6 })
      .to(guides, { strokeDashoffset: 0, duration: 2.2, ease: 'sine.inOut', stagger: 0.12 })
      .fromTo(meaningLines, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.35 }, 1.6)
      .addLabel('undo', '+=2.5')
      .to(guides, { strokeDashoffset: function (i, el) { return el.getTotalLength(); }, duration: 2, ease: 'sine.inOut', stagger: { each: 0.12, from: 'end' } }, 'undo')
      .to(meaningLines, { opacity: 0, y: 24, duration: 0.6, ease: 'power2.in', stagger: { each: 0.15, from: 'end' } }, 'undo');
    ScrollTrigger.create({
      trigger: sketch, start: 'top 75%', end: 'bottom 15%',
      onEnter: function () { sketchTl.restart(); },
      onEnterBack: function () { sketchTl.restart(); },
      onLeave: function () { sketchTl.pause(0); },
      onLeaveBack: function () { sketchTl.pause(0); }
    });
  }

  // ------------ Campaign: scroll sideways through the motifs (desktop; small screens swipe) ------------
  var strip = document.querySelector('[data-galeria-strip]');
  var track = document.querySelector('[data-galeria-track]');
  if (strip && track && window.matchMedia('(min-width: 768px)').matches) {
    gsap.to(track, {
      x: function () { return -(track.scrollWidth - window.innerWidth); },
      ease: 'none',
      scrollTrigger: {
        trigger: strip, start: 'center center', pin: strip, scrub: 1,
        end: function () { return '+=' + (track.scrollWidth - window.innerWidth); },
        invalidateOnRefresh: true
      }
    });
  }

  // ------------ Greeting cards: a loose stack that fans out in an arc as you scroll ------------
  var fan = document.querySelector('[data-galeria-cards]');
  if (fan) {
    var cardEls = [].slice.call(fan.querySelectorAll('[data-galeria-card]'));
    var mid = (cardEls.length - 1) / 2;
    // Angle between two cards: a little tighter on small screens
    var arc = window.matchMedia('(min-width: 768px)').matches ? 14 : 11;
    cardEls.forEach(function (card, i) {
      var k = i - mid;
      // A round fan, like a hand of cards: every card turns around the same point far below the stack
      gsap.fromTo(card,
        { rotation: k * 2, transformOrigin: '50% 260%' },
        { rotation: k * arc, ease: 'none',
          scrollTrigger: { trigger: fan, start: 'top 85%', end: 'center 45%', scrub: 1 } });
    });
  }
})();
