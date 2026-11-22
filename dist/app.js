const money = value => new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
const budget = document.querySelector('#budget');
const products = document.querySelector('#products');
const chat = document.querySelector('#chat');
function render() {
  products.replaceChildren();
  const visible = catalog.filter(pc => pc.available && (!Number(budget.value) || pc.price <= Number(budget.value)));
  for (const pc of visible) {
    const card = document.querySelector('#card').content.cloneNode(true);
    card.querySelector('h3').textContent = 'Power ' + pc.model;
    const specs = card.querySelector('dl');
    for (const [label, value] of Object.entries({'Видеокарта': pc.gpu, 'Процессор': pc.cpu, 'Память': pc.ram, 'SSD': pc.ssd})) {
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
