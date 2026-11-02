/* ------------ Bloxley case (Redesign 2026) ------------
   Card switch: point at a colour (or tap or focus it). The card stays in place and shows that colour, while the
   section takes on a matching background, like on the Bloxley website. Plain JS. */

(function () {
  var section = document.querySelector('[data-blx-cards]');
  if (!section) return;
  var chips = [].slice.call(section.querySelectorAll('[data-blx-card]'));
  var cards = [].slice.call(section.querySelectorAll('.blx-card'));
  var show = function (i) {
    section.style.background = chips[i].dataset.bg;
    section.style.color = chips[i].dataset.fg;
    section.style.setProperty('--blx-chip-bg', chips[i].dataset.bg);
    chips.forEach(function (c, k) { c.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
    cards.forEach(function (c, k) { c.setAttribute('aria-hidden', k === i ? 'false' : 'true'); });
  };
  chips.forEach(function (c, i) {
    c.addEventListener('pointerenter', function () { show(i); });
    c.addEventListener('focus', function () { show(i); });
    c.addEventListener('click', function () { show(i); });
  });
  section.style.setProperty('--blx-chip-bg', chips[0].dataset.bg);
})();
