(() => {
  const intro = document.querySelector('#startup');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let timer;

  function openIntro() {
    if (!intro.showModal || intro.open) return;
    intro.showModal();
    timer = setTimeout(() => intro.close(), 3200);
  }

  intro.addEventListener('close', () => clearTimeout(timer));
  reduced.addEventListener('change', () => {
    if (reduced.matches && intro.open) intro.close();
  });
  document.querySelector('#replay').addEventListener('click', openIntro);
  if (reduced.matches || document.querySelector('#comparison').open) return;
  try {
    if (sessionStorage.getItem('powertech-workshop-intro')) return;
    sessionStorage.setItem('powertech-workshop-intro', 'seen');
  } catch {}
  openIntro();
})();
