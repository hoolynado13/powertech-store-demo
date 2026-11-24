(() => {
  const film = document.querySelector('.film-screen video');
  const gallery = document.querySelector('.show-gallery');
  const angles = document.querySelector('#show-angles');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let filmVisible = false;
  let galleryVisible = false;
  let timer;
  function syncFilm() {
    if (!filmVisible || document.hidden || motion.matches) { film.pause(); return; }
    if (!film.hasAttribute('src')) film.src = film.dataset.src;
    film.play().catch(() => {});
  }
  function cycle() {
    clearTimeout(timer);
    if (!galleryVisible || document.hidden || motion.matches) return;
    timer = setTimeout(() => {
      const current = angles.querySelector('[aria-pressed=true]');
      (current?.nextElementSibling || angles.firstElementChild)?.click();
      cycle();
    }, 5000);
  }
  angles.addEventListener('click', event => {
    if (event.isTrusted) { cycle(); }
  });
  document.querySelector('#show-model').addEventListener('change', () => { cycle(); });
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.target === film) { filmVisible = entry.intersectionRatio >= .22; syncFilm(); }
      else { galleryVisible = entry.intersectionRatio >= .22; cycle(); }
    }
  }, {threshold:[0,.22]});
  observer.observe(film);
  observer.observe(gallery);
  document.addEventListener('visibilitychange', () => { syncFilm(); cycle(); });
  motion.addEventListener('change', () => {
    syncFilm(); cycle();
  });
})();
