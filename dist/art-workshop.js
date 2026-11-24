(() => {
  const workshop = document.querySelector('#services');
  const helper = document.querySelector('#support');
  const brief = workshop.querySelector('.service-notes');
  for (const panel of brief.querySelectorAll('[role="tabpanel"]')) {
    const service = document.getElementById(panel.getAttribute('aria-labelledby')).textContent.trim();
    const heading = document.createElement('h3');
    heading.textContent = service;
    panel.prepend(heading);
    const contact = document.createElement('button');
    contact.type = 'button';
    contact.className = 'workshop-consult';
    contact.textContent = 'Спросить Чипа об услуге';
    panel.append(contact);
    contact.onclick = () => {
      helper.showPopover();
      ask(service);
      helper.querySelector('input').focus({preventScroll:true});
    };
  }
  const footer = document.querySelector('.store-footer');
  const signature = footer.querySelector('.footer-brand');
  const note = footer.querySelector('.footer-note');
  note.before(signature);
  const top = document.createElement('a');
  top.href = '#';
  top.className = 'return-storefront';
  top.textContent = 'В начало ↑';
  note.append(top);
})();
