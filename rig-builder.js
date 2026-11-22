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
      ['power','Блок питания'], ['case','Корпус',['ATX Mid Tower · белый','ATX Mid Tower · графит']]
    ]],
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
  update();
  document.querySelector('#rig-save').onclick=()=>{
    const lines=['Моя конфигурация ПК',''];
    for (const [key,{label}] of fields) if(state[key]!==none) lines.push(label+' — '+state[key]);
    const url=URL.createObjectURL(new Blob(['\uFEFF'+lines.join('\r\n')],{type:'text/plain;charset=utf-8'}));
    const link=document.createElement('a');
    link.href=url; link.download='powertech-pc.txt'; link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
})();
