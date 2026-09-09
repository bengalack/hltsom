/* HLT Søm — the only JavaScript on this site.
   Three jobs: the splash carousel, the burger menu, and upgrading the static
   map preview to Google's interactive map on click.
   See docs/decisions/ 0001 and 0002. */

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- splash carousel ---------- */
function initCarousel() {
  const slides = Array.from(document.querySelectorAll('.splash__slide'));
  if (slides.length === 0) return;

  /* Only the first slide ships with a src; the rest carry data-src. Loading
     them after the page has settled keeps ~900KB off the critical path, which
     is what protects the LCP on a phone. Assigning .src from script is a DOM
     operation, not an inline style, so the page's strict CSP does not block it. */
  const loadRemaining = () => {
    for (const slide of slides) {
      if (slide.dataset.src) {
        slide.src = slide.dataset.src;
        delete slide.dataset.src;
      }
    }
  };

  if (document.readyState === 'complete') loadRemaining();
  else window.addEventListener('load', loadRemaining, { once: true });

  if (slides.length < 2 || prefersReducedMotion()) return;

  const styles = getComputedStyle(document.documentElement);
  const seconds = parseFloat(styles.getPropertyValue('--carousel-interval')) || 5;
  const intervalMs = seconds * 1000;

  let index = 0;
  let timer = null;

  const advance = () => {
    slides[index].classList.remove('is-active');
    index = (index + 1) % slides.length;
    slides[index].classList.add('is-active');
  };

  const start = () => { if (timer === null) timer = setInterval(advance, intervalMs); };
  const stop = () => { clearInterval(timer); timer = null; };

  document.addEventListener('visibilitychange', () => {
    document.hidden ? stop() : start();
  });

  start();
}

initCarousel();

/* ---------- burger menu ----------
   One implementation for both presentations: a full-screen takeover on phones,
   a dropdown panel on desktop. The difference is entirely in CSS. */
function initNav() {
  const burger = document.querySelector('.site-nav__burger');
  const overlay = document.getElementById('meny');
  if (!burger || !overlay) return;

  const focusables = () =>
    Array.from(overlay.querySelectorAll('a[href], button:not([disabled])'));

  const open = () => {
    overlay.hidden = false;
    burger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('nav-open');
    focusables()[0]?.focus();
  };

  const close = ({ restoreFocus = true } = {}) => {
    overlay.hidden = true;
    burger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
    if (restoreFocus) burger.focus();
  };

  const isOpen = () => !overlay.hidden;

  burger.addEventListener('click', (e) => {
    e.stopPropagation();
    isOpen() ? close() : open();
  });

  /* Closing on an outside click has to cover both presentations:
       - takeover: the backdrop IS the overlay element, so a click on the
         overlay itself (rather than on a link) counts as outside
       - dropdown: the panel is small, so an outside click lands on the page
         and never reaches the overlay at all
     Both cases reduce to "the click was not inside the panel content". */
  document.addEventListener('click', (e) => {
    if (!isOpen()) return;
    if (burger.contains(e.target)) return;          // handled by the button itself
    const onLink = e.target.closest('#meny a');
    const insidePanel = overlay.contains(e.target) && e.target !== overlay;
    if (onLink || !insidePanel) close({ restoreFocus: false });
  });

  document.addEventListener('keydown', (e) => {
    if (!isOpen()) return;

    if (e.key === 'Escape') { close(); return; }

    if (e.key === 'Tab') {
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
  });
}

initNav();

/* ---------- map ----------
   The page ships a static OpenStreetMap image, which sets no cookies. Clicking
   swaps it for Google's interactive embed — that click is the visitor's consent,
   so no banner is required.

   The visitor is not asked to click in order to SEE where the workshop is: the
   static map already shows that. Only interactivity costs a click.

   Without JavaScript the element stays an ordinary link and opens Google Maps
   in a new tab, so the map is never unreachable.

   Do NOT "optimise" this by loading the iframe on page load or on scroll.
   Doing so lets Google set cookies without consent, which is a legal problem
   rather than a performance one. See docs/decisions/0002-static-map-preview.md. */
function initMap() {
  const link = document.querySelector('.map__load[data-map-src]');
  if (!link) return;

  link.addEventListener('click', (e) => {
    e.preventDefault();
    const iframe = document.createElement('iframe');
    iframe.src = link.dataset.mapSrc;
    iframe.title = 'Kart som viser hvor HLT Søm holder til';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.allowFullscreen = true;
    link.replaceWith(iframe);
  });
}

initMap();
