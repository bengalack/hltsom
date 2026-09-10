/* HLT Søm — the only JavaScript on this site.
   Three jobs: the splash carousel, the burger menu, and upgrading the static
   map preview to Google's interactive map on click.
   See documentation/decisions/ 0001 and 0002. */

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
   rather than a performance one. See documentation/decisions/0002-static-map-preview.md. */
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

    /* The OpenStreetMap credit belongs to the preview only. Once Google's map
       is on screen the line is both wrong and confusing — Google carries its
       own attribution inside the iframe. The ODbL obligation ends with the
       tiles it describes.

       It is HIDDEN, not removed. Removing the element removes its box, and
       everything below it shifts up the moment the visitor clicks — the page
       visibly resettles. `visibility: hidden` keeps the exact same space,
       and unlike `opacity: 0` it also takes the stale credit out of the
       accessibility tree. */
    document.querySelector('.map__attribution')?.classList.add('is-spent');
  });
}

initMap();

/* ---------- parallax ----------
   Outgoing blocks travel at roughly half scroll speed; incoming blocks at 1x.

   Why JavaScript, when CSS scroll-driven animations are smoother? Because
   `animation-timeline: view()` measures progress against the scrollport, and a
   mobile browser resizes the scrollport as its toolbar hides mid-drag. That
   remaps the timeline and moves the block independently of the scroll: measured
   at a 58px jump at an unchanged scroll position, and reported from a real
   phone as cards that shiver while the ones at 1x sit still.

   Everything below is computed from DOCUMENT coordinates — scrollY, offsetTop,
   offsetHeight. None of them change when the toolbar hides, so the toolbar
   cannot move a block relative to its neighbours. offsetTop and offsetHeight
   are layout values and are unaffected by the transforms applied here, so this
   cannot feed back on itself.

   Do not reintroduce innerHeight, clientHeight or visualViewport in this
   function — a test forbids it, because that is precisely the bug.
   See documentation/decisions/0004-parallax-in-javascript.md. */
function initParallax() {
  /* EVERY block, the last one included, at full strength and with no cap.

     Three "improvements" were tried here and all three were rejected:
     excluding the last block to hold the footer still, clamping the lag to the
     space under each block's content, and easing out of the target speed. Each
     protected something secondary and cost the effect itself. See spec §5. */
  const blocks = Array.from(
    document.querySelectorAll('#splash, #tjenester, #kontakt, #om')
  );
  if (blocks.length === 0) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  let ticking = false;

  const clear = () => {
    for (const el of blocks) el.style.transform = '';
  };

  const update = () => {
    ticking = false;
    if (reduce.matches) { clear(); return; }

    const styles = getComputedStyle(document.documentElement);
    const factor = parseFloat(styles.getPropertyValue('--parallax-factor'));
    /* The maths is exact here, unlike the CSS version this replaced. A block
       exits over exactly its own height of scrolling, so displacing it by
       (height x factor) leaves it travelling at (1 - factor) of scroll speed.
       --parallax-factor: .5 therefore means literally half speed. */
    const travel = Number.isFinite(factor) ? factor : 0.5;
    const y = window.scrollY;

    for (const el of blocks) {
      const height = el.offsetHeight;
      if (height === 0) continue;
      // 0 while the block is fully in view, 1 once it has completely left the top
      let progress = (y - el.offsetTop) / height;
      progress = progress < 0 ? 0 : progress > 1 ? 1 : progress;

      /* Linear, with no cap: the block travels at exactly the target speed for
         its whole exit. It WILL eventually slide far enough that the arriving
         block covers its text, and that is fine — by then the visitor is well
         past it. What is not fine is covering text early, and that is governed
         by --parallax-runway (the empty space below each block's content), not
         by slowing the effect down.

         Two earlier attempts capped this, and both were rejected: a hard clamp
         snapped from half speed to normal in one frame, and an eased version
         never held the target speed at all. */
      const offset = progress * height * travel;
      el.style.transform =
        offset === 0 ? '' : `translate3d(0, ${offset.toFixed(2)}px, 0)`;
    }
  };

  const request = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  };

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  reduce.addEventListener('change', update);

  update();
}

initParallax();

/* ---------- in-page navigation ----------
   The blocks are transformed by the parallax, and a browser resolves an anchor
   against the element's RENDERED position. A plain href="#splash" therefore
   lands short by however much the target happens to be displaced, and the
   visitor converges on it by clicking repeatedly — which is exactly how the
   logo behaved before this existed.

   offsetTop is a layout value and ignores transforms, so one click lands. */
function initAnchors() {
  for (const link of document.querySelectorAll('a[href^="#"]')) {
    link.addEventListener('click', (event) => {
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      window.scrollTo({
        top: target.offsetTop,
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      });
    });
  }
}

initAnchors();
