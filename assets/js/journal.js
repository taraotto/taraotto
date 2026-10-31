/* ------------ Journal (Redesign 2026) ------------
   Continent and country filter: picking a continent unfolds its
   countries below it. The matching entries are laid out again in the
   same five-image pattern as journal.html renders it, so the grid
   stays staggered whatever is shown. Works without GSAP; uses it
   for the fade when available. */

(function () {
  var grid = document.querySelector('[data-journal-grid]');
  if (!grid) return;

  var entries = [].slice.call(grid.querySelectorAll('[data-entry]'));
  var intro = grid.querySelector('[data-journal-intro]');
  // The filter is rendered twice (desktop and small screens), so every lookup covers both copies
  var links = [].slice.call(document.querySelectorAll('[data-journal-filter] button[data-continent]'));
  var countryLinks = [].slice.call(document.querySelectorAll('[data-journal-filter] [data-country]'));
  var countryLists = [].slice.call(document.querySelectorAll('[data-journal-filter] [data-countries]'));

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
      // Posts with a landscape photo (featured-image-wide) show it in the landscape slot
      var img = entry.querySelector('img[data-src]');
      if (img) img.src = s.landscape ? img.dataset.srcWide : img.dataset.src;
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
    clearFilter();
  };

  // On desktop the filter hangs above the third image. It sits high enough (journal.html) for an open
  // country line; only if that line ever runs longer does the image move down, while the grid is faded out
  var desktopFilter = document.querySelector('[data-journal-filter-desktop]');
  var desktop = window.matchMedia('(min-width: 768px)');
  var GAP = 32;
  var pageTop = function (el) {
    var top = 0;
    for (; el; el = el.offsetParent) top += el.offsetTop;
    return top;
  };
  var clearFilter = function () {
    var first = grid.firstElementChild;
    var third = first && first.children[2];
    if (!third || !desktopFilter) return;
    third.style.marginTop = '';
    if (!desktop.matches) return;
    // Measured from the layout, not the screen, so fades and reveals in progress don't skew it
    var overlap = pageTop(desktopFilter) + desktopFilter.offsetHeight + GAP - pageTop(third);
    if (overlap > 0) third.style.marginTop = parseFloat(getComputedStyle(third).marginTop) + overlap + 'px';
  };
  window.addEventListener('resize', clearFilter);
  window.addEventListener('load', clearFilter);

  var mark = function (list, key, value) {
    list.forEach(function (link) {
      if (link.dataset[key] === value) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  };

  var apply = function (continent, country) {
    mark(links, 'continent', continent);
    mark(countryLinks, 'country', country);
    countryLists.forEach(function (list) { list.hidden = list.dataset.countries !== continent; });

    var list = entries.filter(function (entry) {
      if (continent !== 'all' && entry.dataset.continent !== continent) return false;
      return !country || entry.dataset.country === country;
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

  var select = function (continent, country) {
    apply(continent, country);
    var hash = continent === 'all' ? '' : '#' + continent + (country ? '/' + country : '');
    history.replaceState(null, '', location.pathname + hash);
  };

  links.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      select(link.dataset.continent);
    });
  });

  countryLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var continent = link.closest('[data-countries]').dataset.countries;
      // Picking the active country again shows the whole continent
      select(continent, link.hasAttribute('aria-current') ? null : link.dataset.country);
    });
  });

  // Open with a filter from the URL, e.g. /journal/#europe or /journal/#asia/japan
  var initial = location.hash.slice(1).split('/');
  if (initial[0] && links.some(function (link) { return link.dataset.continent === initial[0]; })) {
    var known = countryLinks.some(function (link) { return link.dataset.country === initial[1]; });
    apply(initial[0], known ? initial[1] : null);
  }
})();
