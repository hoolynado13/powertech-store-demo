const money = value => new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
const prices = document.querySelector('#prices');
const categoryNames = {gaming: 'Игровые ПК', exclusive: 'Эксклюзивные ПК', professional: 'Профессиональные ПК'};
let category = '';
let minimum = 0;
let maximum = Infinity;
const products = document.querySelector('#products');
const chat = document.querySelector('#chat');
const images = {A1: 'a1.webp', S2: 's2.webp', X3: 'x3.webp'};
function setPhoto(img, pc) {
  img.onload = () => img.classList.add('ready');
  img.classList.remove('ready');
  img.src = images[pc.model] || 'tower.webp';
  img.alt = 'Иллюстрация игрового ПК Power ' + pc.model;
}
const featured = catalog.filter(pc => pc.available);
const switches = document.querySelector('.switcher');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
function reveal(element) {
  if (reducedMotion.matches) return;
  element.getAnimations().forEach(animation => animation.cancel());
  element.animate([{opacity: .4, transform: 'translateY(5px)'}, {opacity: 1, transform: 'none'}],
    {duration: 260, easing: 'ease-out'});
}
function feature(pc, animate = false) {
  document.querySelector('#hero-more').onclick = () => openProduct(pc);
  if (animate) {
    reveal(document.querySelector('.portrait'));
    reveal(document.querySelector('.intro'));
  }
  document.querySelector('#hero-name strong').textContent = pc.model;
  document.querySelector('#hero-spec').textContent = pc.gpu;
  document.querySelector('#hero-cpu').textContent = pc.cpu;
  document.querySelector('#hero-price').textContent = money(pc.price);
  const heroImage = document.querySelector('#hero-img');
  heroImage.src = pc.model === 'A1' ? 'hero-a1.webp' : images[pc.model] || 'tower.webp';
  heroImage.alt = 'Игровой ПК Power ' + pc.model;
  heroImage.closest('.stage').dataset.model = pc.model;
  for (const button of switches.children) {
    button.setAttribute('aria-pressed', String(button.dataset.model === pc.model));
  }
}
for (const pc of featured) {
  const button = document.createElement('button');
  button.dataset.model = pc.model;
  button.textContent = pc.model;
  button.setAttribute('aria-label', 'Показать Power ' + pc.model);
  button.onclick = () => feature(pc, true);
  switches.append(button);
}
if (featured.length) feature(featured[0]);
else document.querySelector('.stage').hidden = true;
const product = document.querySelector('#product');
const selection = new Set();
const tray = document.querySelector('.compare-tray');
const comparison = document.querySelector('#comparison');
function syncComparison() {
  const count = selection.size;
  tray.hidden = count === 0;
  document.querySelector('#compare-open').disabled = count !== 2;
  document.querySelector('#compare-status').textContent =
    [...selection].map(pc => 'Power ' + pc.model).join(' и ') + (count === 1 ? ' · Выберите ещё одну сборку' : '');
  for (const button of products.querySelectorAll('.compare-pick')) {
    const picked = [...selection].some(pc => pc.model === button.dataset.model);
    button.disabled = !picked && count === 2;
    button.setAttribute('aria-pressed', String(picked));
    button.textContent = picked ? '✓ В сравнении' : '+ В сравнение';
  }
}
document.querySelector('#compare-clear').onclick = () => {
  selection.clear();
  syncComparison();
  (products.querySelector('.compare-pick') || prices.elements.minimum).focus({preventScroll: true});
};
document.querySelector('#compare-open').onclick = () => {
  if (selection.size !== 2) return;
  const [first, second] = selection;
  const gap = Math.abs(first.price - second.price);
  const higher = first.price > second.price ? first : second;
  document.querySelector('#compare-gap').textContent = gap
    ? 'Power ' + higher.model + ' дороже на ' + money(gap) : 'Обе сборки стоят одинаково.';
  const header = comparison.querySelector('thead');
  const body = comparison.querySelector('tbody');
  header.replaceChildren();
  body.replaceChildren();
  const heading = header.insertRow();
  for (const label of ['Параметр', 'Power ' + first.model, 'Power ' + second.model]) {
    const cell = document.createElement('th');
    cell.scope = 'col';
    cell.textContent = label;
    heading.append(cell);
  }
  for (const [label, key] of [['Цена','price'],['Видеокарта','gpu'],['Процессор','cpu'],['Память','ram'],['SSD','ssd']]) {
    const row = body.insertRow();
    const title = document.createElement('th');
    title.scope = 'row';
    title.textContent = label;
    row.append(title);
    for (const pc of selection) row.insertCell().textContent = key === 'price' ? money(pc.price) : pc[key];
  }
  document.querySelector('#share-status').textContent = '';
  document.querySelector('#share-link').hidden = true;
  comparison.showModal();
};

let tilePhoto;
let activeTransition;
function movePhoto(from, to, update) {
  activeTransition?.skipTransition();
  if (!from?.isConnected || !to?.isConnected || reducedMotion.matches || !document.startViewTransition) {
    update();
    return;
  }
  from.style.viewTransitionName = 'build-photo';
  const transition = document.startViewTransition(() => {
    from.style.viewTransitionName = '';
    update();
    to.style.viewTransitionName = 'build-photo';
  });
  activeTransition = transition;
  transition.finished.finally(() => {
    if (activeTransition === transition) {
      to.style.viewTransitionName = '';
      activeTransition = null;
    }
  });
}
function closeProduct(event) {
  event.preventDefault();
  movePhoto(product.querySelector('img'), tilePhoto, () => product.close());
}
product.querySelector('form').addEventListener('submit', closeProduct);
product.addEventListener('cancel', closeProduct);

function fillSpecs(list, pc, includeGpu = false) {
  const specs = {'Процессор': pc.cpu, 'Память': pc.ram, 'SSD': pc.ssd};
  if (includeGpu) specs['Видеокарта'] = pc.gpu;
  list.replaceChildren();
  for (const [label, value] of Object.entries(specs)) {
    const term = document.createElement('dt');
    const description = document.createElement('dd');
    term.textContent = label;
    description.textContent = value;
    list.append(term, description);
  }
}
const angles = product.querySelector('.angles');
const playButton = document.querySelector('#gallery-play');
const galleryImage = product.querySelector('.product-image img');
let framesForProduct = [];
let angleIndex = 0;
let autoPlay = false;
const slideDuration = 5000;
let progressAnimation;
let frameTimer;
function scheduleFrame() {
  clearTimeout(frameTimer);
  progressAnimation?.cancel();
  if (!autoPlay || !product.open || document.hidden || chat.open || document.querySelector('#lightbox').open) return;
  if (!reducedMotion.matches) {
    const progress = angles.children[angleIndex]?.querySelector('.slide-progress');
    progressAnimation = progress?.animate([{transform:'scaleX(0)'},{transform:'scaleX(1)'}],
      {duration:slideDuration, easing:'linear', fill:'forwards'});
  }
  frameTimer = setTimeout(() => showAngle((angleIndex + 1) % framesForProduct.length), slideDuration);
}
function setAutoPlay(enabled) {
  autoPlay = enabled;
  playButton.textContent = enabled ? 'Ⅱ' : '▶';
  playButton.setAttribute('aria-label', enabled ? 'Приостановить смену ракурсов' : 'Включить смену ракурсов');
  playButton.title = playButton.getAttribute('aria-label');
  scheduleFrame();
}
function showAngle(index) {
  angleIndex = index;
  const frame = framesForProduct[index];
  galleryImage.src = frame.src;
  galleryImage.alt = frame.alt;
  [...angles.children].forEach((button,i) => button.setAttribute('aria-pressed', String(i === index)));
  scheduleFrame();
}
function setupGallery(pc) {
  const views = [['Корпус', images[pc.model] || 'tower.webp']];
  if (['A1','S2','X3'].includes(pc.model)) {
    views.push(['Внутри', pc.model.toLowerCase() + '-inside.webp'], ['Сзади', pc.model.toLowerCase() + '-rear.webp']);
  }
  framesForProduct = views.map(([label,src])=>({label,src,alt:'Power ' + pc.model + ' — ' + label}));
  angles.replaceChildren();
  framesForProduct.forEach((frame,index) => {
    const button = document.createElement('button');
    const thumb = document.createElement('img');
    thumb.src = frame.src; thumb.alt = '';
    const progress = document.createElement('span');
    progress.className = 'slide-progress';
    progress.setAttribute('aria-hidden','true');
    button.append(thumb,frame.label,progress);
    button.onclick = () => { setAutoPlay(false); showAngle(index); };
    angles.append(button);
  });
  playButton.hidden = views.length < 2;
  setAutoPlay(!reducedMotion.matches && views.length > 1);
  showAngle(0);
}
playButton.onclick = () => setAutoPlay(!autoPlay);
document.addEventListener('visibilitychange',scheduleFrame);
reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) setAutoPlay(false); });
for (const overlay of [chat,document.querySelector('#lightbox')]) {
  overlay.addEventListener('close',scheduleFrame);
}
product.addEventListener('close', scheduleFrame);

function openProduct(pc, sourcePhoto) {
  tilePhoto = sourcePhoto;
  product.querySelector('h2').textContent = 'Power ' + pc.model;
  setPhoto(product.querySelector('img'), pc);
  const lightbox = document.querySelector('#lightbox');
  product.querySelector('.product-image').onclick = () => {
    lightbox.querySelector('img').src = product.querySelector('img').src;
    lightbox.querySelector('img').alt = product.querySelector('img').alt;
    lightbox.showModal();
    scheduleFrame();
  };
  setupGallery(pc);
  fillSpecs(product.querySelector('dl'), pc, true);
  product.querySelector('.price').textContent = money(pc.price);
  product.querySelector('#check-stock').onclick = () => {
    document.querySelector('#draft').textContent = 'Здравствуйте! Есть в наличии Power ' + pc.model + ' за ' + money(pc.price) + '?';
    chat.showModal();
    scheduleFrame();
  };
  movePhoto(tilePhoto, product.querySelector('img'), () => { product.showModal(); scheduleFrame(); });
}
function render() {
  products.replaceChildren();
  const visible = featured.filter(pc => (!category || (pc.categories || ['gaming']).includes(category))
    && pc.price >= minimum && pc.price <= maximum);
  document.querySelector('#result-count').textContent = String(visible.length);
  for (const pc of visible) {
    const card = document.querySelector('#card').content.cloneNode(true);
    card.querySelector('.ask').textContent = 'Power ' + pc.model;
    const thumbnail = card.querySelector('img');
    thumbnail.src = images[pc.model] ? 'catalog-' + pc.model.toLowerCase() + '.webp' : 'tower.webp';
    thumbnail.alt = 'Power ' + pc.model;
    card.querySelector('.gpu').textContent = pc.gpu;
    card.querySelector('.card-cpu').textContent = pc.cpu;
    card.querySelector('.price').textContent = money(pc.price);
    const more = card.querySelector('.ask');
    more.setAttribute('aria-label', 'Подробнее о сборке Power ' + pc.model);
    const tile = card.querySelector('.photo img');
    more.onclick = () => openProduct(pc, tile);
    const pick = card.querySelector('.compare-pick');
    pick.dataset.model = pc.model;
    pick.setAttribute('aria-label', 'В сравнение: Power ' + pc.model);
    pick.onclick = () => {
      if (selection.has(pc)) selection.delete(pc);
      else if (selection.size < 2) selection.add(pc);
      syncComparison();
    };
    products.append(card);
  }
  syncComparison();
  if (!visible.length) products.textContent = 'По этим условиям сборок нет. Измените цену или выберите другую категорию.';
}
function syncCategory() {
  const target = location.hash.slice(1);
  if (Object.hasOwn(categoryNames, target)) category = target;
  else if (!target || target === 'catalog') category = '';
  for (const link of document.querySelectorAll('.series a')) {
    if (link.hash === '#' + (category || 'catalog')) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  }
  render();
}
window.addEventListener('hashchange', syncCategory);
for (const link of document.querySelectorAll('.series a')) {
  link.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (location.hash === link.hash) return;
    history.pushState(null, '', link.hash);
    syncCategory();
  });
}
syncCategory();
// Direct category links should land at the catalog on entry.
if (Object.hasOwn(categoryNames, location.hash.slice(1))) document.querySelector('#catalog').scrollIntoView();

const menu = document.querySelector('.menu-toggle');
menu.onclick = () => menu.setAttribute('aria-expanded', String(menu.getAttribute('aria-expanded') !== 'true'));
document.querySelector('#store-nav').addEventListener('click', () => menu.setAttribute('aria-expanded', 'false'));
menu.parentElement.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
    menu.setAttribute('aria-expanded', 'false');
    menu.focus();
  }
});
const lower = prices.elements.minimum;
const upper = prices.elements.maximum;
const rail = prices.querySelector('.price-rail');
const priceStep = 1000;
const floorPrice = featured.length ? Math.floor(Math.min(...featured.map(pc => pc.price)) / 10000) * 10000 : 0;
const ceilPrice = Math.max(floorPrice + priceStep, Math.ceil(Math.max(0, ...featured.map(pc => pc.price)) / 10000) * 10000);
for (const input of [lower, upper]) {
  input.min = floorPrice;
  input.max = ceilPrice;
  input.step = priceStep;
  input.defaultValue = input === lower ? floorPrice : ceilPrice;
}

function updatePrices(changed) {
  if (lower.valueAsNumber > upper.valueAsNumber) {
    changed.value = changed === lower ? upper.value : lower.value;
  }
  minimum = lower.valueAsNumber;
  maximum = upper.valueAsNumber;
  const span = ceilPrice - floorPrice;
  rail.style.setProperty('--from', (minimum - floorPrice) / span * 100 + '%');
  rail.style.setProperty('--to', (maximum - floorPrice) / span * 100 + '%');
  lower.setAttribute('aria-valuetext', money(minimum));
  upper.setAttribute('aria-valuetext', money(maximum));
  document.querySelector('#price-values').textContent = money(minimum) + ' — ' + money(maximum);
  prices.querySelector('[type=reset]').disabled = minimum === floorPrice && maximum === ceilPrice;
  render();
}
prices.addEventListener('input', event => updatePrices(event.target));
prices.addEventListener('reset', event => {
  event.preventDefault();
  lower.value = lower.defaultValue;
  upper.value = upper.defaultValue;
  updatePrices();
  lower.focus({preventScroll:true});
});
let dragHandle;
function valueAt(clientX) {
  const line = rail.querySelector('.rail-line').getBoundingClientRect();
  const ratio = Math.min(1, Math.max(0, (clientX - line.left) / line.width));
  return floorPrice + Math.round(ratio * (ceilPrice - floorPrice) / priceStep) * priceStep;
}
function dragPrice(event) {
  const value = valueAt(event.clientX);
  if (!dragHandle) {
    if (minimum === maximum && value === minimum) return;
    dragHandle = Math.abs(value - minimum) < Math.abs(value - maximum) ||
      (minimum === maximum && value < minimum) ? lower : upper;
    dragHandle.focus({preventScroll:true});
  }
  const next = dragHandle === lower ? Math.min(value, maximum) : Math.max(value, minimum);
  if (dragHandle.valueAsNumber !== next) {
    dragHandle.value = next;
    updatePrices(dragHandle);
  }
}
rail.addEventListener('pointerdown', event => {
  if (!event.isPrimary || event.button !== 0) return;
  dragHandle = null;
  rail.setPointerCapture(event.pointerId);
  dragPrice(event);
});
rail.addEventListener('pointermove', event => {
  if (rail.hasPointerCapture(event.pointerId)) dragPrice(event);
});
rail.addEventListener('lostpointercapture', () => { dragHandle = null; });
updatePrices();
const support = document.querySelector('#support');
document.querySelector('[data-support]').addEventListener('click', () => {
  support.showPopover();
  support.querySelector('button').focus();
});


const strip = document.querySelector('.service-strip');
const frames = [...strip.querySelectorAll('.service-frame')];
const narrowWorkshop = matchMedia('(max-width: 760px)');
const [previousService, nextService] = document.querySelectorAll('.workshop-arrows button');
let serviceIndex = 0;

function alignFrame(index, smooth) {
  if (!narrowWorkshop.matches) return;
  const left = strip.scrollLeft + frames[index].getBoundingClientRect().left - strip.getBoundingClientRect().left;
  strip.scrollTo({left, behavior: smooth && !reducedMotion.matches ? 'smooth' : 'instant'});
}
function selectService(index, scroll = true) {
  serviceIndex = index;
  frames.forEach((frame, i) => {
    frame.setAttribute('aria-selected', String(index === i));
    frame.tabIndex = index === i ? 0 : -1;
    document.getElementById(frame.getAttribute('aria-controls')).hidden = index !== i;
  });
  const scene = document.querySelector('.workshop-heading');
  const slug = frames[index].id.slice(4);
  scene.style.setProperty('--workshop-scene', index === 0 ? "url('workshop.webp')" : "url('service-" + slug + ".webp')");
  previousService.disabled = index === 0;
  nextService.disabled = index === frames.length - 1;
  if (scroll) alignFrame(index, true);
}
frames.forEach((frame, index) => {
  frame.onclick = () => selectService(index);
  frame.onkeydown = event => {
    const positions = {ArrowLeft: (index + frames.length - 1) % frames.length,
      ArrowRight: (index + 1) % frames.length, Home: 0, End: frames.length - 1};
    if (!Object.hasOwn(positions, event.key)) return;
    event.preventDefault();
    selectService(positions[event.key]);
    frames[serviceIndex].focus({preventScroll:true});
  };
});
previousService.onclick = () => selectService(Math.max(0,serviceIndex - 1));
nextService.onclick = () => selectService(Math.min(frames.length - 1,serviceIndex + 1));
strip.addEventListener('scrollend', () => {
  if (!narrowWorkshop.matches) return;
  const left = strip.getBoundingClientRect().left;
  const distances = frames.map(frame => Math.abs(frame.getBoundingClientRect().left - left));
  selectService(distances.indexOf(Math.min(...distances)), false);
});
new ResizeObserver(() => alignFrame(serviceIndex, false)).observe(strip);
selectService(0, false);
