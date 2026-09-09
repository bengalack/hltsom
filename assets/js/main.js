/* HLT Søm — the only JavaScript on this site.
   Three jobs: the splash carousel, the burger menu, and deferring the map.
   See docs/decisions/0001-map-loads-without-click.md. */

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
   The map loads automatically, with no click. But it is deferred until the
   contact block approaches the viewport.

   Why not just loading="lazy"? Because measured on this page it does nothing:
   Chromium requested Google at ~60ms, before the load event, on both mobile and
   desktop. The attribute is a hint, and its distance threshold on a fast
   connection is effectively "load it now". An IntersectionObserver actually
   defers, which is what keeps a ~600KB third-party embed from competing with
   the splash image for bandwidth.

   Visitors without JavaScript get the iframe directly from the <noscript>
   block in the markup, so the map never depends on this script to exist. */
function initMap() {
  const holder = document.querySelector('.map[data-map-src]');
  if (!holder) return;

  const insert = () => {
    if (holder.querySelector('iframe')) return;
    const iframe = document.createElement('iframe');
    iframe.src = holder.dataset.mapSrc;
    iframe.title = 'Kart som viser hvor HLT Søm holder til';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.allowFullscreen = true;
    holder.appendChild(iframe);
  };

  if (!('IntersectionObserver' in window)) { insert(); return; }

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) { insert(); io.disconnect(); return; }
    }
  }, { rootMargin: '400px' });

  io.observe(holder);
}

initMap();
