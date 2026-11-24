(() => {
  const workshop = document.querySelector('.workshop');
  const tabs = [...workshop.querySelectorAll('.service-frame')];
  if (!tabs.length) return;

  const shots = {
    upgrade: ['Установка комплектующих', 'Рабочее место мастера во время установки комплектующих'],
    custom: ['Кабели и отделка корпуса', 'Крупный план уложенных кабелей внутри корпуса'],
    design: ['Деталь в 3D', 'Трёхмерный чертёж детали на экране'],
    rent: ['Рабочие станции', 'Ряд компьютеров на оборудованных рабочих местах']
  };
  const stage = document.createElement('figure');
  stage.className = 'workshop-gallery';
  stage.innerHTML = '<div class="workshop-photos"></div><figcaption><span class="workshop-frame-number" aria-hidden="true"></span><strong></strong></figcaption>';
  const photos = stage.querySelector('.workshop-photos');
  const caption = stage.querySelector('strong');
  const number = stage.querySelector('.workshop-frame-number');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false;
  let timer;

  const images = tabs.map(tab => {
    const key = tab.id.slice(4);
    const image = new Image();
    image.loading = 'lazy';
    image.src = 'service-' + key + '.webp';
    image.alt = shots[key][1];
    photos.append(image);
    return image;
  });

  workshop.querySelector('.workshop-heading').after(stage);
  workshop.classList.add('has-workshop-gallery');
  const selected = () => tabs.findIndex(tab => tab.getAttribute('aria-selected') === 'true');
  function schedule() {
    clearTimeout(timer);
    if (!motion.matches && visible && !document.hidden) {
      timer = setTimeout(() => tabs[(selected() + 1) % tabs.length].click(), 8000);
    }
  }
  function draw() {
    const index = selected();
    if (index < 0) return;
    images.forEach((image, i) => {
      image.classList.toggle('is-current', i === index);
      image.setAttribute('aria-hidden', String(i !== index));
    });
    number.textContent = (index + 1) + ' / ' + tabs.length;
    caption.textContent = shots[tabs[index].id.slice(4)][0];
    schedule();
  }
  new MutationObserver(draw).observe(workshop.querySelector('.service-strip'), {
    subtree:true, attributes:true, attributeFilter:['aria-selected']
  });
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; schedule(); }).observe(stage);
  motion.addEventListener("change", schedule);
  document.addEventListener('visibilitychange', schedule);
  draw();
})();
