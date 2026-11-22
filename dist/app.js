const money = value => new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
const budget = document.querySelector('#budget');
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
function feature(pc) {
  document.querySelector('#hero-name').textContent = 'Power ' + pc.model;
  document.querySelector('#hero-spec').textContent = pc.gpu + ' · ' + money(pc.price);
  setPhoto(document.querySelector('#hero-img'), pc);
  for (const button of switches.children) {
    button.setAttribute('aria-pressed', String(button.textContent === pc.model));
  }
}
for (const pc of featured) {
  const button = document.createElement('button');
  button.textContent = pc.model;
  button.setAttribute('aria-label', 'Показать Power ' + pc.model);
  button.onclick = () => feature(pc);
  switches.append(button);
}
if (featured.length) feature(featured[0]);
else document.querySelector('.stage').hidden = true;
function render() {
  products.replaceChildren();
  const visible = catalog.filter(pc => pc.available && (!Number(budget.value) || pc.price <= Number(budget.value)));
  for (const pc of visible) {
    const card = document.querySelector('#card').content.cloneNode(true);
    card.querySelector('h3').textContent = 'Power ' + pc.model;
    setPhoto(card.querySelector('img'), pc);
    card.querySelector('.gpu').textContent = pc.gpu;
    const specs = card.querySelector('dl');
    for (const [label, value] of Object.entries({'Процессор': pc.cpu, 'Память': pc.ram, 'SSD': pc.ssd})) {
      const term = document.createElement('dt');
      const description = document.createElement('dd');
      term.textContent = label;
      description.textContent = value;
      specs.append(term, description);
    }
    card.querySelector('.price').textContent = money(pc.price);
    card.querySelector('button').onclick = () => {
      document.querySelector('#draft').textContent = 'Здравствуйте! Есть в наличии Power ' + pc.model + ' за ' + money(pc.price) + '?';
      chat.showModal();
    };
    products.append(card);
  }
  if (!visible.length) products.textContent = 'В этом бюджете пока нет доступных сборок.';
}
budget.addEventListener('change', render);
render();

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
