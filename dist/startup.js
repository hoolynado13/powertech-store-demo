// Reveal the first loaded product in place; navigation is usable throughout.
(() => {
  const hero = document.querySelector('#hero-img');
  if (location.hash || !hero.getAttribute('src') ||
      matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function reveal() {
    hero.classList.add('ignition');
    hero.addEventListener('animationend', () => hero.classList.remove('ignition'), {once: true});
  }

  if (hero.complete && hero.naturalWidth) reveal();
  else hero.addEventListener('load', reveal, {once: true});
})();
