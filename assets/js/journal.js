/* ------------ Journal (Redesign 2026) ------------
   Continent filter. The matching entries are laid out again in the
   same five-image pattern as journal.html renders it, so the grid
   stays staggered whatever is shown. Works without GSAP; uses it
   for the fade when available. */

(function () {
  var grid = document.querySelector('[data-journal-grid]');
  if (!grid) return;

  var entries = [].slice.call(grid.querySelectorAll('[data-entry]'));
  var intro = grid.querySelector('[data-journal-intro]');
  var links = [].slice.call(document.querySelectorAll('[data-journal-filter] [data-continent]'));

  // Keep in sync with the classes in journal.html
  var SLOTS = [
    { wrap: '', card: 'aspect-[498/622]' },
    { wrap: 'relative md:pt-[400px]', card: 'aspect-[498/622]' },
    { wrap: 'md:mt-[252px]', card: 'aspect-[498/622]' },
    { wrap: 'w-full md:w-[617px]', card: 'aspect-[617/497]', landscape: true },
    { wrap: 'w-full md:w-[497px] md:mt-[200px]', card: 'aspect-[497/621]' }
  ];
  var TONES = ['', 'rd-journal-stamp--cream', 'rd-journal-stamp--bark'];
  var GROUP_A = 'relative grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-[63px] max-w-[1620px] mx-auto items-start';
  var GROUP_A_LATER = ' mt-12 md:-mt-[60px]';
  var GROUP_B = 'flex flex-col md:flex-row justify-center items-start gap-12 md:gap-[58px] mt-12 md:mt-[120px]';

  var group = function (className) {
    var el = document.createElement('div');
    el.className = className;
    grid.appendChild(el);
    return el;
  };

  var layout = function (list) {
    grid.innerHTML = '';
    var current;

    list.forEach(function (entry, i) {
      var slot = i % 5;
      var s = SLOTS[slot];
      if (slot === 0) current = group(GROUP_A + (i ? GROUP_A_LATER : ''));
      if (slot === 3) current = group(GROUP_B);

      entry.className = s.wrap;
      entry.querySelector('[data-card]').className = 'group relative block overflow-hidden ' + s.card;
      entry.querySelector('[data-stamp]').className = 'rd-journal-stamp ' + TONES[i % 3] + (s.landscape ? ' rd-journal-stamp--landscape' : '');
      current.appendChild(entry);
    });

    // The intro always sits in the middle column of the first group
    var first = grid.firstElementChild || group(GROUP_A);
    var middle = first.children[1];
    if (!middle) {
      middle = document.createElement('div');
      middle.className = SLOTS[1].wrap;
      first.appendChild(middle);
    }
    if (intro) middle.insertBefore(intro, middle.firstChild);
  };

  var apply = function (continent) {
    links.forEach(function (link) {
      if (link.dataset.continent === continent) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });

    var list = entries.filter(function (entry) {
      return continent === 'all' || entry.dataset.continent === continent;
    });

    if (!(window.rd && window.rd.enabled)) return layout(list);

    gsap.to(grid, {
      opacity: 0, y: 12, duration: 0.3, ease: 'power2.in',
      onComplete: function () {
        layout(list);
        ScrollTrigger.refresh();
        gsap.to(grid, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' });
      }
    });
  };

  links.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      apply(link.dataset.continent);
      history.replaceState(null, '', link.dataset.continent === 'all' ? location.pathname : '#' + link.dataset.continent);
    });
  });

  // Open with a filter from the URL, e.g. /journal/#europe
  var initial = location.hash.slice(1);
  if (initial && links.some(function (link) { return link.dataset.continent === initial; })) apply(initial);
})();
