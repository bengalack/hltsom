/* HLT Søm — the only JavaScript on this site.
   Three jobs: carousel, burger overlay, click-to-load map. Nothing else. */

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- splash carousel ---------- */
function initCarousel() {
  const slides = Array.from(document.querySelectorAll('.splash__slide'));
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
