(() => {
  const stage = document.querySelector('.stage');
  if (!stage || stage.hidden) return;
  const strip = stage.querySelector('.switcher');
  const buttons = [...strip.querySelectorAll('button')];
  if (!buttons.length) return;

  buttons.forEach(button => {
    const pc = catalog.find(item => item.model === button.dataset.model);
    if (!pc) return;
    const photo = new Image();
    photo.alt = '';
    photo.src = 'catalog-' + pc.model.toLowerCase() + '.webp';
    const label = document.createElement('b');
    label.textContent = 'Power ' + pc.model;
    const price = document.createElement('small');
    price.textContent = money(pc.price);
    button.replaceChildren(photo, label, price);
  });
  strip.addEventListener('keydown', event => {
    const index = buttons.indexOf(event.target);
    if (index < 0 || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const next = buttons[(index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length];
    next.focus();
    next.click();
  });
  stage.querySelector('#hero-more span').textContent = 'О сборке';
  stage.classList.add('edition-hero');
})();
