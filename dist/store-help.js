// Share the two catalog IDs so a fresh browser can reconstruct the comparison.
const shareInput = document.querySelector('#share-link');
document.querySelector('#share-compare').onclick = async () => {
  const link = new URL(location.href);
  link.searchParams.set('compare', [...selection].map(pc => pc.model).join(','));
  link.hash = 'catalog';
  shareInput.value = link.href;
  const status = document.querySelector('#share-status');
  try {
    await navigator.clipboard.writeText(link.href);
    status.textContent = 'Ссылка скопирована';
  } catch {
    shareInput.hidden = false;
    shareInput.focus();
    shareInput.select();
    status.textContent = 'Скопируйте выделенную ссылку';
  }
};
const shared = new URLSearchParams(location.search).get('compare');
if (shared) {
  const pair = shared.split(',').map(id => featured.find(pc => pc.model === id));
  if (pair.length === 2 && pair.every(Boolean) && pair[0] !== pair[1]) {
    pair.forEach(pc => selection.add(pc));
    syncComparison();
    document.querySelector('#compare-open').click();
  }
}

const finder = document.querySelector('#game-finder');
const gameName = document.querySelector('#game-name');
const resolution = document.querySelector('#game-resolution');
// Editorial shortlists for this demo catalog, in ascending order of preference cost.
const gameProfiles = {
  'Counter-Strike 2': {1080:['S2','A1','X3'],1440:['A1','X3']},
  'Dota 2': {1080:['S2','A1','X3'],1440:['S2','A1','X3']},
  'Cyberpunk 2077': {1080:['A1','X3'],1440:['X3']}
};
// Published mean FPS, indexed by the tested graphics card rather than the shop model.
const fpsTests = {
  'Counter-Strike 2': {
    source:'ComputerBase', url:'https://www.computerbase.de/artikel/gaming/counter-strike-2-benchmark-test.87904/',
    settings:'Очень высокие, MSAA 8× · Ryzen 9 7950X3D',
    scores:{'Radeon RX 6600':[103.1,66.9], 'GeForce RTX 4060':[157.4,104.6], 'GeForce RTX 4070 SUPER':[282.9,187.1]}
  },
  'Cyberpunk 2077': {
    source:'Tweakers', url:'https://tweakers.net/reviews/11834/videokaartbenchmarks-al-onze-gpu-testresultaten.html',
    settings:'Ultra, без трассировки лучей',
    scores:{'Radeon RX 6600':[61.7,34.2], 'GeForce RTX 4060':[77.8,45.6], 'GeForce RTX 4070 SUPER':[143.3,87.1]}
  }
};
function gpuFPS(game, pixels, gpu) {
  const value = fpsTests[game]?.scores[gpu]?.[String(pixels) === '1080' ? 0 : 1];
  return value === undefined ? '' : Math.round(value) + ' FPS';
}
function gamePicks(game, pixels) {
  return gameProfiles[game][pixels].map(model => featured.find(pc => pc.model === model)).filter(Boolean);
}
function renderGame() {
  const game = gameName.value;
  const candidates = gamePicks(game,resolution.value);
  const out = document.querySelector('#game-result');
  out.replaceChildren();
  const test = fpsTests[game];
  const source = document.querySelector('#fps-source');
  source.replaceChildren();
  if (test) {
    const link = document.createElement('a');
    link.href = test.url; link.textContent = test.source; link.target = '_blank'; link.rel = 'noopener';
    source.append('Средний FPS видеокарт на стенде ', link, '. ' + test.settings + '. На готовой сборке результат зависит и от процессора.');
  } else source.textContent = 'Для выбранной игры и конфигураций подтверждённых результатов пока нет.';
  if (!candidates.length) { out.textContent = 'Для этого сочетания пока нет доступных сборок.'; return; }
  const note = document.createElement('p');
  note.textContent = game === 'Cyberpunk 2077'
    ? 'Для детализированного города ориентируемся на запас видеокарты. Подбор рассчитан на обычный рендеринг без трассировки лучей.'
    : 'Для соревновательной игры начните с младшей из предложенных конфигураций. Старшие модели дают запас для более высоких настроек.';
  out.append(note);
  for (const pc of candidates) {
    const button = document.createElement('button');
    const title = document.createElement('b');
    title.textContent = 'Power ' + pc.model + ' · ' + money(pc.price);
    const specs = document.createElement('span');
    specs.textContent = pc.gpu + ' · ' + pc.cpu;
    button.append(title,specs);
    const fps = gpuFPS(game,resolution.value,pc.gpu);
    if (fps) {
      const score = document.createElement('strong');
      score.className = 'fps-score'; score.textContent = fps;
      button.append(score);
    }
    button.onclick = () => { finder.close(); openProduct(pc); };
    out.append(button);
  }
}
function openFinder() { renderGame(); finder.showModal(); }
document.querySelector('#find-game').onclick = openFinder;
gameName.onchange = resolution.onchange = renderGame;

const messages = document.querySelector('#messages');
const suggestions = document.querySelector('#suggestions');
const questionForm = document.querySelector('#ask-chip');
const startQuestions = ['ПК для игр', 'Подбор по бюджету', 'Сравнение ПК', 'Услуги мастерской'];
const modelQuestions = ['Цена модели', 'Какая видеокарта?', 'Сколько памяти?', 'Как уточнить наличие?'];
let currentModel = null;
function bubble(text, who) {
  const line = document.createElement('p');
  line.className = 'bubble ' + who;
  line.textContent = text;
  messages.append(line);
  messages.scrollTop = messages.scrollHeight;
}
function reply(text, options = startQuestions) {
  bubble(text,'chip');
  suggestions.replaceChildren();
  for (const label of options) {
    const button = document.createElement('button');
    button.textContent = label;
    button.onclick = () => ask(label);
    suggestions.append(button);
  }
  messages.scrollTop = messages.scrollHeight;
}
const topics = [
  [/аренд|прокат/, 'Для аренды пригодятся даты, количество компьютеров и список игр или программ. Стоимость аренды в демокаталоге не указана.', ['Открыть мастерскую','Контакты']],
  [/апгрейд|обновить пк|улучшить|модернизац/, 'Для апгрейда подготовьте текущую сборку, бюджет и задачи, где не хватает мощности. Для проверки совместимости особенно важны модель платы и блока питания.', ['Открыть мастерскую','Кастомизация']],
  [/кастом|подсветк|оформлен/, 'Кастомизация включает корпус, укладку кабелей и подсветку. Подготовьте фото вашего ПК и пример оформления.', ['Открыть мастерскую','3D-моделирование']],
  [/3d|3д|моделирован/, 'Для модели детали нужны эскиз, размеры и точки крепления. Фото места установки поможет оценить зазоры.', ['Открыть мастерскую','Апгрейд']],
  [/мастерск|услуг/, 'В мастерской четыре направления. О каком рассказать?', ['Апгрейд','Кастомизация','3D-моделирование','Аренда ПК']],
  [/поделиться|ссылк/, 'Выберите две сборки и откройте сравнение. Кнопка «Скопировать ссылку» сохраняет адрес именно этой пары.', ['Сравнение ПК','К каталогу']],
  [/сравн|разниц/, 'Нажмите «+ В сравнение» у двух ПК. В таблице будут разница в цене, видеокарты, процессоры, память и SSD.', ['Как поделиться?','К каталогу']],
  [/налич|купить|заказ|телеграм|telegram/, 'Откройте карточку и нажмите «Уточнить наличие». В демоверсии появится черновик с моделью и ценой. Актуальный остаток уточняет продавец.', ['К каталогу','Контакты']],
  [/достав|самовывоз|оплат|рассроч|гаранти|возврат/, 'Условия доставки, оплаты и гарантии в демокаталоге не опубликованы. Их нужно согласовать с продавцом до заказа.', ['Контакты','Как уточнить наличие?']],
  [/контакт|адрес|уфа|оператор|человек|график|телефон/, 'Магазин указан в Уфе. Телефон, точный адрес и часы работы пока не опубликованы. Здесь отвечает локальный помощник Чип.', ['Услуги мастерской','К каталогу']],
  [/фото|галере|ракурс|разъем/, 'В карточке доступны корпус, комплектующие внутри и задняя панель. Нажмите на изображение для увеличения. Это иллюстрации, точный набор портов уточняет продавец.', ['К каталогу','Характеристики']],
  [/fps|фпс|кадр/, 'Выберите CS2 или Cyberpunk и разрешение — покажу средний FPS видеокарт в независимых тестах. Например: «FPS CS2 1440p». Фактический результат готовой сборки может отличаться.', ['Открыть подбор игр','Сравнение ПК']],
  [/игр|игра|геймер|1080|1440|разрешени/, 'Какая игра вас интересует? В подборе также можно выбрать разрешение монитора.', [...Object.keys(gameProfiles),'Открыть подбор игр']],
  [/бюджет|дешев|стоим|цен[ауые]|сколько стоит/, 'Напишите верхнюю границу, например «до 90 тысяч». В каталоге её также можно задать правым ползунком.', ['До 70 тысяч','До 100 тысяч','До 150 тысяч']],
  [/привет|здравств|добрый|помо[гщ]|умеешь/, 'Привет! Я Чип. Помогу выбрать ПК, найти характеристики или разобраться с услугами. Что интересует?', startQuestions],
  [/спасибо|благодар/, 'Пожалуйста! Если захотите посмотреть другую сборку, просто напишите её название.', startQuestions]
];
function ask(raw) {
  const text = raw.trim();
  if (text) bubble(text,'visitor');
  const q = text.toLowerCase().replaceAll('ё','е');
  if (!/[a-zа-я0-9]/i.test(q)) {
    reply('Пока не вижу вопроса. Напишите, например, «что внутри A1?» или выберите тему ниже.', ['Что внутри A1?','До 90 тысяч','Аренда ПК']);
    return;
  }
  if (['к каталогу','открыть мастерскую','открыть подбор игр'].includes(q)) {
    support.hidePopover();
    if (q === 'открыть подбор игр') openFinder();
    else document.querySelector(q === 'к каталогу' ? '#catalog' : '#services').scrollIntoView();
    return;
  }
  const game = /counter|cs.?2|кс.?2/.test(q) ? 'Counter-Strike 2' : /dota|дот/.test(q) ? 'Dota 2' : /cyberpunk|киберпанк/.test(q) ? 'Cyberpunk 2077' : null;
  if (game) {
    const pixels = /1440|qhd|2к/.test(q) ? '1440' : '1080';
    gameName.value = game; resolution.value = pixels;
    const picks = gamePicks(game,pixels);
    if (/fps|фпс|кадр/.test(q)) {
      const named = featured.filter(pc => q.includes(pc.model.toLowerCase()));
      const results = (named.length ? named : picks).map(pc => [pc,gpuFPS(game,pixels,pc.gpu)]).filter(([,fps])=>fps);
      const test = fpsTests[game];
      reply(results.length ? game + ', ' + pixels + 'p, ' + test.settings + '. Средний FPS на стенде ' + test.source + ': ' + results.map(([pc,fps])=>pc.gpu+' — '+fps).join(', ') + '. Ссылка на тест — в подборе.' : 'Для этой игры подтверждённых замеров в подборе пока нет.', ['Открыть подбор игр','Сравнение ПК']);
      return;
    }
    reply(game + ', ' + pixels + 'p. ' + (picks.length ? 'В подборке: ' + picks.map(pc => 'Power ' + pc.model + ' (' + pc.gpu + ')').join(', ') + '.' : 'Подходящих доступных сборок пока нет.'), ['Открыть подбор игр','Есть замеры FPS?']);
    return;
  }
  const budgetQuery = /^\d[\d ]*(?:тыс.*|[kк]|руб.*|₽)?$/.test(q) ? 'до ' + q : q;
  const limit = budgetQuery.match(/(?:до\s*|бюджет\s*)(\d[\d ]*)(?:\s*(тыс|к|k))?/i);
  if (limit) {
    const budget = Number(limit[1].replaceAll(' ','')) * (limit[2] ? 1000 : 1);
    const picks = featured.filter(pc => pc.price <= budget).sort((a,b)=>a.price-b.price);
    reply(picks.length ? 'До ' + money(budget) + ' подходят: ' + picks.map(pc=>'Power '+pc.model+' — '+money(pc.price)).join(', ') + '.' : 'До ' + money(budget) + ' в каталоге сейчас нет сборок.', [...picks.map(pc=>'Power '+pc.model),'К каталогу']);
    return;
  }
  const mentioned = featured.filter(pc => q.includes(pc.model.toLowerCase()));
  if (mentioned.length === 2) {
    selection.clear(); mentioned.forEach(pc=>selection.add(pc)); syncComparison();
    const diff = Math.abs(mentioned[0].price-mentioned[1].price);
    reply('Разница — ' + money(diff) + '. Я выбрал обе модели для таблицы.', ['Открыть сравнение','Как поделиться?']);
    return;
  }
  if (q === 'открыть сравнение' && selection.size === 2) { support.hidePopover(); document.querySelector('#compare-open').click(); return; }
  if (mentioned.length) currentModel = mentioned[0];
  if (mentioned.length || /процессор|видеокарт|памят|оперативк|ssd|накопител|характеристик|цена модели/.test(q)) {
    if (!currentModel) { reply('О какой сборке рассказать?', featured.map(pc=>'Power '+pc.model)); return; }
    if (!/налич|гаранти|достав|заказ/.test(q)) {
      const pc = currentModel;
      const component = [
        [/видеокарт|график/, 'Видеокарта — ' + pc.gpu],
        [/процессор/, 'Процессор — ' + pc.cpu],
        [/ssd|накопител/, 'SSD — ' + pc.ssd],
        [/памят|оперативк/, 'Оперативная память — ' + pc.ram],
        [/цена|стоит|стоим/, 'Цена в каталоге — ' + money(pc.price)]
      ].find(([pattern]) => pattern.test(q));
      const answer = component ? component[1] : money(pc.price) + '. Процессор ' + pc.cpu + ', видеокарта ' + pc.gpu + ', память ' + pc.ram + ', SSD ' + pc.ssd;
      reply('Power ' + pc.model + '. ' + answer + '.', modelQuestions);
      return;
    }
  }
  const topic = topics.find(([pattern])=>pattern.test(q));
  if (topic) reply(topic[1],topic[2]);
  else reply('Не разобрал вопрос. Попробуйте назвать игру, модель или бюджет — например, «CS2 в 1440p» или «до 100 тысяч».', startQuestions);
}
questionForm.onsubmit = event => {
  event.preventDefault();
  const input = questionForm.elements.question;
  const text = input.value; input.value = '';
  ask(text);
  input.focus({preventScroll:true});
};
reply('Привет! Я Чип, помощник мастерской. Спросите о сборке, игре или бюджете — или выберите вопрос.', startQuestions);
