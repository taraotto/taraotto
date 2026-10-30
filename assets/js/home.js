/* ------------ Homepage animations (Redesign 2026) ------------
   A pinned hero in which the small card swaps its image three
   times while scrolling (on mobile it cycles on a timer).
   Builds on /assets/js/site.js. */

(function () {
  var rd = window.rd;
  if (!rd || !rd.enabled) return;

  var images = gsap.utils.toArray('.rd-card-img');

  // Slow zoom-out of the first card image, alongside the shared intro (the portrait uses data-intro-zoom)
  rd.intro.fromTo(images[0], { scale: 1.25 }, { scale: 1, duration: 1.8 }, 0.25);

  // ------------ Card sequence ------------
  // Each further image wipes up over the previous one at the same size; the scroll snaps to every image.
  function cardSequence(trigger) {
    var tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: trigger });

    images.slice(1).forEach(function (img) {
      tl.fromTo(img, { clipPath: rd.hidden }, { clipPath: rd.shown, duration: 1 })
        .to({}, { duration: 0.35 }); // short hold before the next image
    });

    return tl;
  }

  function addLabels(tl) {
    // One snap point per image: start, after each wipe, end
    var step = tl.duration() / (images.length - 1);
    for (var i = 0; i < images.length; i++) tl.addLabel('image' + i, Math.min(i * step, tl.duration()));
  }

  var mm = gsap.matchMedia();

  mm.add('(min-width: 768px)', function () {
    // Desktop: the whole hero stays in place while the card changes
    var tl = cardSequence({
      trigger: '.rd-hero',
      start: 'top top',
      end: '+=' + images.length * 55 + '%',
      pin: true,
      scrub: 0.8,
      snap: { snapTo: 'labelsDirectional', duration: { min: 0.3, max: 0.8 }, ease: 'power2.inOut' }
    });
    addLabels(tl);
    // Explicit start value: the intro zoom is still running when this timeline is created
    tl.fromTo('.rd-portrait', { scale: 1 }, { scale: 1.06, duration: tl.duration(), ease: 'none', immediateRender: false }, 0);
  });

  mm.add('(max-width: 767px)', function () {
    // Mobile: no pinning, the card cycles through its images on its own
    var current = 0;
    var timer = setInterval(function () {
      var prev = images[current];
      current = (current + 1) % images.length;
      var next = images[current];

      gsap.set(next, { zIndex: 2, clipPath: rd.hidden });
      gsap.set(prev, { zIndex: 1 });
      gsap.timeline()
        .to(next, { clipPath: rd.shown, duration: 1.4, ease: 'expo.inOut' })
        .set(prev, { zIndex: 0, clipPath: rd.hidden });
    }, 3200);

    return function () { clearInterval(timer); };
  });
})();
