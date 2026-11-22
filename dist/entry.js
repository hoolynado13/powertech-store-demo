const money = value => new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
const images = {A1: 'a1.webp', S2: 's2.webp', X3: 'x3.webp'};
function setPhoto(img, pc) {
  img.onload = () => img.classList.add('ready');
  img.classList.remove('ready');
  img.src = images[pc.model] || 'tower.webp';
  img.alt = 'Иллюстрация игрового ПК Power ' + pc.model;
}
const featured = catalog.filter(pc => pc.available);
const orbit = document.querySelector('.orbit');
const positions = featured.map((pc, index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'orbit-pc';
  button.dataset.model = pc.model;
  button.setAttribute('aria-label', 'Показать Power ' + pc.model);
  const photo = new Image();
  photo.draggable = false;
  if (index === 0) photo.fetchPriority = 'high';
  setPhoto(photo, pc);
  const name = document.createElement('span');
  name.textContent = pc.model;
  button.append(photo, name);
  orbit.append(button);
  button.onclick = () => { if (!suppressClick) selectBuild(index); };
  return button;
});
let position = 0;
let selected = -1;
let suppressClick = false;
let displayed = 0;
let animation = 0;
function placeBuilds(value) {
  displayed = value;
  const count = featured.length;
  positions.forEach((button, index) => {
    const relative = index - value;
    const slot = relative - count * Math.floor(relative / count + .5);
    const angle = Math.max(-1, Math.min(1, slot)) * Math.PI / 2;
    const depth = Math.cos(angle);
    button.style.left = (26 + 39 * depth) + '%';
    button.style.top = (50 + 35 * Math.sin(angle)) + '%';
    const opacity = Math.max(0, 1 - 2 * Math.max(0, Math.abs(slot) - 1));
    button.style.opacity = opacity;
    button.style.visibility = opacity ? 'visible' : 'hidden';
    button.style.setProperty('--size', .64 + .36 * depth);
    button.style.setProperty('--light', .86 + .14 * depth);
    button.style.zIndex = Math.round(depth * 100);
  });
}
function selectBuild(step) {
  position = step;
  const count = featured.length;
  const index = ((step % count) + count) % count;
  const pc = featured[index];
  if (selected >= 0) positions[selected].firstChild.removeAttribute('id');
  selected = index;
  positions[index].firstChild.id = 'hero-img';
  document.querySelector('#hero-name').textContent = 'Power ' + pc.model;
  document.querySelector('#hero-spec').textContent = pc.description || '';
  document.querySelector('#hero-gpu').textContent = pc.gpu;
  document.querySelector('#hero-cpu').textContent = pc.cpu;
  document.querySelector('#hero-ram').textContent = pc.ram;
  document.querySelector('#hero-ssd').textContent = pc.ssd;
  document.querySelector('#hero-price').textContent = money(pc.price);
  positions.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  cancelAnimationFrame(animation);
  const start = displayed;
  const distance = step - start - count * Math.round((step - start) / count);
  if (!distance || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    placeBuilds(step);
    return;
  }
  const begin = performance.now();
  function glide(now) {
    const t = Math.min(1, (now - begin) / 360);
    placeBuilds(start + distance * (1 - (1 - t) ** 3));
    if (t < 1) animation = requestAnimationFrame(glide);
    else placeBuilds(step);
  }
  animation = requestAnimationFrame(glide);
}
if (featured.length) selectBuild(0);
if (location.hash.length > 1 || !featured.length) {
  location.replace('store.html' + (location.hash || '#catalog'));
}

if (featured.length > 1) {
  let gesture;
  orbit.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    suppressClick = false;
    gesture = {id: event.pointerId, y: event.clientY, offset: 0};
  });
  orbit.addEventListener('pointermove', event => {
    if (!gesture || event.pointerId !== gesture.id) return;
    const delta = gesture.y - event.clientY;
    if (!suppressClick && Math.abs(delta) < 7) return;
    cancelAnimationFrame(animation);
    suppressClick = true;
    orbit.setPointerCapture(event.pointerId);
    orbit.classList.add('dragging');
    gesture.offset = delta / (orbit.clientHeight * .35);
    placeBuilds(position + gesture.offset);
  });
  function endDrag(event) {
    if (!gesture || event.pointerId !== gesture.id) return;
    orbit.classList.remove('dragging');
    const step = event.type === 'pointercancel' ? 0 : Math.round(gesture.offset);
    selectBuild(position + step);
    gesture = null;
    setTimeout(() => { suppressClick = false; }, 0);
  }
  window.addEventListener('pointerup', endDrag);
  orbit.addEventListener('pointercancel', endDrag);
  let nextWheel = 0;
  orbit.addEventListener('wheel', event => {
    if (event.ctrlKey) return;
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (!delta) return;
    event.preventDefault();
    if (performance.now() < nextWheel) return;
    selectBuild(position + Math.sign(delta));
    nextWheel = performance.now() + 320;
  }, {passive: false});
  orbit.addEventListener('keydown', event => {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    selectBuild(position + (['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : -1));
    positions[selected].focus();
  });
}
const themeButton = document.querySelector('#theme');
const page = document.documentElement;

function syncThemeButton() {
  const dark = page.dataset.theme === 'dark';
  themeButton.setAttribute('aria-pressed', String(dark));
  themeButton.title = dark ? 'Включить светлую тему' : 'Включить тёмную тему';
}
themeButton.addEventListener('click', () => {
  page.dataset.theme = page.dataset.theme === 'dark' ? 'light' : 'dark';
  syncThemeButton();
  try {
    localStorage.setItem('powertech-theme', page.dataset.theme);
  } catch {}
});
syncThemeButton();
