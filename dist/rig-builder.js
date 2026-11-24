(() => {
  const form = document.querySelector('#rig-options');
  const list = document.querySelector('#rig-list');
  const platforms = {
    'Intel Core i5-12400F': {boards:['B660M DDR4','B760M DDR4'],memory:'DDR4'},
    'AMD Ryzen 5 5600': {boards:['B550M','B550 ATX'],memory:'DDR4'},
    'AMD Ryzen 7 7700': {boards:['B650M','B650 ATX'],memory:'DDR5'}
  };
  const none = 'Не добавлять';
  const groups = [
    ['Комплектующие',[
      ['cpu','Процессор',Object.keys(platforms)],
      ['board','Материнская плата'], ['ram','Оперативная память'],
      ['gpu','Видеокарта',['GeForce RTX 4060','Radeon RX 6600','GeForce RTX 4070 SUPER']],
      ['ssd','Накопитель',['1 ТБ NVMe','512 ГБ NVMe','2 ТБ NVMe']],
      ['cooler','Охлаждение',['Башенный кулер 120 мм','Двухбашенный кулер 120 мм']],
      ['case','Корпус',['ATX Mid Tower · белый','ATX Mid Tower · графит']]
    ]],
    ['Блок питания',[['power','Блок питания']]],
    ['Периферия',[
      ['monitor','Монитор',[none,'24″ · Full HD · 144 Гц','27″ · QHD · 165 Гц']],
      ['keyboard','Клавиатура',[none,'Полноразмерная механическая','Компактная механическая TKL']],
      ['mouse','Мышь',[none,'Проводная игровая','Беспроводная игровая']],
      ['audio','Звук',[none,'Гарнитура USB','Настольные колонки']]
    ]]
  ];
  let saved;
  try { saved = JSON.parse(localStorage.getItem('powertech-rig-v1')); } catch {}
  const state = {...saved};
  const fields = new Map();
  const optionsFor = {
    board: () => platforms[state.cpu].boards,
    ram: () => [16,32,64].map(size => size+' ГБ '+platforms[state.cpu].memory),
    power: () => (state.gpu==='GeForce RTX 4070 SUPER' ? [650,750,850] : [550,650,750,850]).map(w=>w+' Вт')
  };
  const presets = document.querySelector('.rig-presets');
  const baseParts = pc => ({cpu:pc.cpu, gpu:pc.gpu, ram:pc.ram, ssd:pc.ssd+' NVMe'});
  for (const pc of catalog.filter(entry => entry.available && platforms[entry.cpu])) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.model = pc.model;
    const photo = new Image();
    photo.src = 'catalog-'+pc.model.toLowerCase()+'.webp';
    photo.loading = 'lazy';
    photo.alt = '';
    const name = document.createElement('strong');
    name.textContent = 'Power '+pc.model;
    const gpu = document.createElement('small');
    gpu.textContent = pc.gpu;
    button.append(photo,name,gpu);
    button.onclick = () => {
      Object.assign(state, baseParts(pc));
      update();
      steps.firstElementChild.click();
    };
    presets.append(button);
  }
  function update() {
    list.replaceChildren();
    for (const [id,{select,label,options}] of fields) {
      const allowed = options || optionsFor[id]();
      let selected = state[id];
      if (id==='ram' && !allowed.includes(selected)) {
        selected = allowed.find(value=>parseInt(value)===parseInt(state.ram));
      }
      state[id] = allowed.includes(selected) ? selected : allowed[0];
      select.replaceChildren(...allowed.map(value=>new Option(value,value)));
      select.value = state[id];
      if (select.value===none) continue;
      const term = document.createElement('dt'), value = document.createElement('dd');
      term.textContent=label; value.textContent=select.value; list.append(term,value);
    }
    for (const button of presets.children) {
      const pc = catalog.find(entry => entry.model === button.dataset.model);
      button.setAttribute('aria-pressed', String(Object.entries(baseParts(pc)).every(([key,value]) => state[key] === value)));
    }
    try { localStorage.setItem('powertech-rig-v1',JSON.stringify(state)); } catch {}
  }
  for (const [name,items] of groups) {
    const group=document.createElement('fieldset'), legend=document.createElement('legend');
    legend.textContent=name; group.append(legend);
    for (const [id,label,options] of items) {
      const wrapper=document.createElement('label'), select=document.createElement('select');
      select.name=id; wrapper.append(label,select); group.append(wrapper);
      fields.set(id,{select,label,options});
      select.onchange=()=>{ state[id]=select.value; update(); };
    }
    form.append(group);
  }
  const steps=document.createElement('div');
  steps.className='rig-steps'; steps.setAttribute('role','group');steps.setAttribute('aria-label','Раздел конфигуратора');
  const sections=[...form.querySelectorAll('fieldset')];
  const summary=document.querySelector('.rig-summary');
  for (const [i,name] of [...groups.map(([name])=>name),'Итог'].entries()) {
    const button=document.createElement('button');button.type='button';button.textContent=name;
    button.onclick=()=>{
      for(const [n,step] of [...steps.children].entries()) step.setAttribute('aria-pressed',String(n===i));
      sections.forEach((field,n)=>field.hidden=n!==i);
      summary.classList.toggle('rig-final',i===sections.length);
      form.closest('.rig-layout').classList.toggle('summary-only',i===sections.length);
    };
    steps.append(button);
  }
  document.querySelector('.rig-heading').after(steps);
  steps.firstElementChild.click();
  update();
  document.querySelector('.configure-model').addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const model = document.querySelector('#show-model').value;
    [...presets.children].find(button => button.dataset.model === model)?.click();
  });
  document.querySelector('#rig-save').onclick=()=>{
    const lines=['Моя конфигурация ПК',''];
    for (const [key,{label}] of fields) if(state[key]!==none) lines.push(label+' — '+state[key]);
    const url=URL.createObjectURL(new Blob(['\uFEFF'+lines.join('\r\n')],{type:'text/plain;charset=utf-8'}));
    const link=document.createElement('a');
    link.href=url; link.download='powertech-pc.txt'; link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
})();
