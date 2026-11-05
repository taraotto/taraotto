/* ------------ GVV case (Redesign 2026) ------------
   Interaction for /work/gvv/: before and after sliders, the logo's steps, the umbrella brand splitting into its two
   brands while you scroll, colours to copy, the colour rings before and after, and the imagery switch.
   Without GSAP (or with reduced motion) everything stands in its final state and the controls still work. */

(function () {
  var rd = window.rd;
  var all = function (sel, root) { return [].slice.call((root || document).querySelectorAll(sel)); };

  // ------------ Before and after: drag, tap or use the arrow keys ------------
  all('[data-gvv-compare]').forEach(function (box) {
    var range = box.querySelector('input');
    var set = function (v) { box.style.setProperty('--pos', v + '%'); range.value = v; };
    range.addEventListener('input', function () { set(range.value); });
    // The field covers the whole picture: pointing anywhere moves the divider, vertical swipes still scroll the page
    var dragging = false;
    var move = function (e) {
      var r = box.getBoundingClientRect();
      set(Math.min(Math.max((e.clientX - r.left) / r.width * 100, 0), 100));
    };
    box.addEventListener('pointerdown', function (e) { dragging = true; box.setPointerCapture(e.pointerId); move(e); });
    box.addEventListener('pointermove', function (e) { if (dragging) move(e); });
    box.addEventListener('pointerup', function () { dragging = false; });
    box.addEventListener('pointercancel', function () { dragging = false; });
    // Once, when it comes into view, the divider sweeps across to show what it does
    if (rd && rd.enabled) {
      var sweep = { v: 82 };
      set(82);
      gsap.to(sweep, {
        v: 50, duration: 1.6, ease: 'power3.inOut',
        onUpdate: function () { if (!dragging) set(sweep.v); },
        scrollTrigger: { trigger: box, start: 'top 65%', once: true }
      });
    }
  });

  // ------------ Switches: a row of buttons, one picture showing at a time (logo steps, imagery) ------------
  all('[data-gvv-switch]').forEach(function (group) {
    var buttons = all('[data-gvv-pick]', group);
    var views = all('[data-gvv-view]', group);
    var show = function (i) {
      buttons.forEach(function (b, k) { b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
      views.forEach(function (v, k) { v.classList.toggle('opacity-0', k !== i); });
    };
    buttons.forEach(function (b, i) {
      b.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') show(i); });
      b.addEventListener('focus', function () { show(i); });
      b.addEventListener('click', function () { show(i); });
    });
  });

  // ------------ Colours: click to copy the hex code ------------
  all('[data-gvv-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var label = btn.querySelector('[data-gvv-copy-label]');
      var hex = btn.dataset.gvvCopy;
      var done = function () { label.textContent = 'Copied ' + hex; setTimeout(function () { label.textContent = hex; }, 1400); };
      if (navigator.clipboard) navigator.clipboard.writeText(hex).then(done, function () {}); else done();
    });
  });

  // ------------ Colour rings: each segment knows its colour and length before and after ------------
  var rings = document.querySelector('[data-gvv-rings]');
  if (rings) {
    var chips = all('[data-gvv-state]', rings);
    var state = function (name) {
      chips.forEach(function (c) { c.setAttribute('aria-pressed', c.dataset.gvvState === name ? 'true' : 'false'); });
      all('svg', rings).forEach(function (svg) {
        var start = 0;
        all('circle', svg).forEach(function (seg) {
          var p = seg.dataset[name].split(' ');
          var len = parseFloat(p[1]);
          seg.style.stroke = p[0];
          seg.style.strokeDasharray = len + ' ' + (100 - len);
          seg.style.strokeDashoffset = -start;
          start += len;
        });
      });
    };
    chips.forEach(function (c) { c.addEventListener('click', function () { state(c.dataset.gvvState); }); });
    state('after');
    // Coming into view, the rings start as they were and turn into what they became
    if (rd && rd.enabled) {
      state('before');
      ScrollTrigger.create({
        trigger: rings, start: 'top 60%', once: true,
        onEnter: function () { setTimeout(function () { state('after'); }, 900); }
      });
    }
  }

  // ------------ Brand architecture: while the section sticks, one brand becomes three ------------
  var arch = document.querySelector('[data-gvv-arch]');
  if (arch && rd && rd.enabled) {
    arch.classList.add('is-live');
    var stage = arch.querySelector('[data-gvv-stage]');
    var parent = arch.querySelector('[data-gvv-parent]');
    var kids = all('[data-gvv-child]', arch);
    var late = all('[data-gvv-late]', arch);
    var hex = function (h) { return [1, 3, 5].map(function (i) { return parseInt(h.substr(i, 2), 16); }); };
    var mix = function (a, b, t) { return 'rgb(' + hex(a).map(function (c, i) { return Math.round(c + (hex(b)[i] - c) * t); }).join(',') + ')'; };
    var ease = function (t) { return t * t * (3 - 2 * t); };
    var clamp = function (v) { return Math.min(Math.max(v, 0), 1); };
    var draw = function () {
      var box = arch.getBoundingClientRect();
      var p = clamp(-box.top / (box.height - window.innerHeight));
      var split = ease(clamp((p - 0.12) / 0.6));
      var w = stage.offsetWidth, h = stage.offsetHeight;
      // The parent starts large in the middle of the stage and rises to its place above the other two
      var py = parent.offsetTop;
      var parentMoveY = (h / 2 - py) * (1 - split);
      parent.style.transform = 'translate(-50%,-50%) translateY(' + parentMoveY + 'px) scale(' + (1 + 0.4 * (1 - split)) + ')';
      // The children come out from behind it, in its teal, and take on their own colour on the way
      kids.forEach(function (k) {
        var dx = (w / 2 - k.offsetLeft) * (1 - split);
        var dy = (h / 2 - k.offsetTop) * (1 - split);
        k.style.transform = 'translate(-50%,-50%) translate(' + dx + 'px,' + dy + 'px)';
        k.style.opacity = clamp(split * 5);
        k.style.setProperty('--gvv-bright', mix('#00a0a0', k.dataset.bright, split));
        k.style.setProperty('--gvv-dark', mix('#004b5a', k.dataset.dark, split));
      });
      var after = clamp((p - 0.72) / 0.18);
      late.forEach(function (el) { el.style.opacity = after; });
    };
    window.addEventListener('scroll', draw, { passive: true });
    window.addEventListener('resize', draw);
    draw();
  }

})();
