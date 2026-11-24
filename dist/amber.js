(() => {
  const byId = id => document.getElementById(id);
  byId('saved-open').onclick=()=>{
    const list=byId('saved-list'), dialog=byId('saved-builds');
    list.replaceChildren();
    for(const pc of featured.filter(pc=>favorites.has(pc.model))) {
      const button=document.createElement('button'),photo=new Image();
      photo.src='catalog-'+pc.model.toLowerCase()+'.webp';photo.alt='';
      button.append(photo,'Power '+pc.model+' · '+money(pc.price));
      button.onclick=()=>{ dialog.close();openProduct(pc); };list.append(button);
    }
    if(!list.children.length) list.textContent='Нажмите на сердце у сборки, чтобы сохранить её здесь.';
    dialog.showModal();
  };
  byId('catalog-search').oninput = render;
  byId('cpu-filter').onchange = byId('gpu-filter').onchange = render;
  const model = byId('show-model'), first = byId('pair-a'), second = byId('pair-b');
  for (const select of [model, first, second]) {
    for (const pc of featured) select.add(new Option('Power ' + pc.model, pc.model));
  }
  function selected(select) { return featured.find(pc => pc.model === select.value); }
  function drawProduct() {
    const pc = selected(model);
    byId('show-name').textContent = 'Power ' + pc.model;
    byId('show-price').textContent = money(pc.price);
    byId('show-stock').onclick = () => askStock(pc);
    fillSpecs(byId('show-specs'),pc,true);
    const angles = byId('show-angles'), image = byId('show-image');
    angles.replaceChildren();
    const views = [['Корпус', 'catalog-'+pc.model.toLowerCase()+'.webp'], ['Внутри',pc.model.toLowerCase()+'-inside.webp'], ['Сзади',pc.model.toLowerCase()+'-rear.webp']];
    for (const [label,src] of views) {
      const button = document.createElement('button'), thumb = new Image();
      thumb.src=src; thumb.alt=''; button.append(thumb, label); button.setAttribute('aria-label',label);
      button.onclick=()=>{
        image.src=src; image.alt='Power '+pc.model+' — '+label;
        for(const angle of angles.children) angle.setAttribute('aria-pressed',String(angle===button));
      };
      angles.append(button);
    }
    angles.firstElementChild.click();
  }
  model.onchange=drawProduct;
  if(featured.length) drawProduct();
  else model.closest('section').hidden=true;
  function compare(changed) {
    const other = changed===first ? second : first;
    if(other.value===changed.value) other.value=featured.find(pc=>pc.model!==changed.value).model;
    const a=selected(first), b=selected(second), table=byId('pair-table');
    table.replaceChildren();
    for(const [label,key] of [...specRows,['Цена','price']]) {
      const row=table.insertRow(), heading=document.createElement('th');
      heading.scope='row';heading.textContent=label;row.append(heading);
      for(const pc of [a,b]) row.insertCell().textContent=key==='price' ? money(pc.price) : pc[key];
    }
    byId('pair-open').onclick=()=>openComparison(a,b);
  }
  if(featured.length>1) {
    second.selectedIndex=1; compare(first);
    first.onchange=()=>compare(first); second.onchange=()=>compare(second);
  } else first.closest('section').hidden=true;
  function showGames() {
    const games=byId('show-games'); games.replaceChildren();
    for(const [name,test] of Object.entries(fpsTests)) {
      const row=document.createElement('article'), art=new Image(), details=document.createElement('div');
      art.alt=''; art.src=name==='Counter-Strike 2'?'bench-cs2.webp':'bench-cyber.webp';
      const title=document.createElement('h3');title.textContent=name;details.append(title);
      for(const pc of featured) {
        const fps=test.scores[pc.gpu]?.[Number(byId('show-resolution').value)];
        if(fps===undefined) continue;
        const line=document.createElement('div'), bar=document.createElement('i'), score=document.createElement('b');
        line.className='mini-bar';bar.style.setProperty('--score',100*fps/fpsCeiling+'%');
        score.textContent=Math.round(fps)+' FPS';line.append('Power '+pc.model,bar,score);details.append(line);
      }
      const source=document.createElement('a');source.href=test.url;source.textContent=test.source;source.title=test.settings;
      details.append('Замеры видеокарт · ', source);row.append(art,details);games.append(row);
    }
  }
  byId('show-resolution').onchange=showGames;showGames();
})();
