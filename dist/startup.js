// Draw the enclosure as separate plates so each component has its own exit path.
(() => {
  const overlay = document.querySelector('#startup');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches || !overlay.showModal) return;
  try {
    if (sessionStorage.getItem('powertech-intro-seen')) return;
  } catch {}
  const canvas = overlay.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const scale = Math.min(devicePixelRatio || 1, 2);
  canvas.width = 640 * scale;
  canvas.height = 560 * scale;
  ctx.scale(scale, scale);
  const parts = [];
  function plate(dx, dy, turn, draw) { parts.push({dx, dy, turn, draw}); }
  function polygon(points, fill, edge = '#575064') {
    ctx.beginPath();
    points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = edge;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  function disk(x, y, r, fill) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = fill;
    ctx.fill();
  }
  function fan(x, y, radius, front, angle, light) {
    ctx.save();
    ctx.translate(x, y);
    ctx.transform(front ? .76 : .91, front ? -.35 : .16, 0, 1, 0, 0);
    disk(0, 0, radius, '#100f17');
    ctx.shadowColor = '#b685ff';
    ctx.shadowBlur = light * 16;
    ctx.strokeStyle = 'rgba(195,152,255,' + (.15 + .85 * light) + ')';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.arc(0, 0, radius - 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.rotate(angle);
    ctx.fillStyle = 'rgb(' + [69+76*light,63+49*light,83+90*light].map(Math.round).join(',') + ')';
    for (let blade = 0; blade < 7; blade++) {
      ctx.beginPath();
      ctx.moveTo(3, 0);
      ctx.quadraticCurveTo(radius*.48, -radius*.64, radius*.8, -radius*.23);
      ctx.quadraticCurveTo(radius*.64, radius*.08, 3, 4);
      ctx.fill();
      ctx.rotate(Math.PI * 2 / 7);
    }
    disk(0, 0, radius*.21, '#35313e');
    ctx.restore();
  }

  plate(0,0,0, () => polygon([[184,159],[362,191],[362,414],[184,382]], '#16151e'));
  plate(0,0,0, () => {
    polygon([[198,179],[316,201],[316,340],[198,318]], '#302936');
    for (let i=0;i<4;i++) polygon([[282+i*7,210],[286+i*7,211],[286+i*7,260],[282+i*7,259]], '#897e9a');
  });
  plate(0,0,0,(angle,light) => fan(245,238,34,false,angle,light));
  plate(0,0,0, () => {
    polygon([[197,281],[332,306],[357,292],[222,268]], '#706878');
    polygon([[197,281],[332,306],[332,325],[197,300]], '#37323f');
    for(let i=0;i<14;i++) {
      ctx.fillStyle='#99909e';
      ctx.fillRect(205+i*8,288+i*1.47,3,6);
    }
  });
  plate(0,0,0, () => polygon([[184,344],[362,377],[362,415],[184,382]], '#312c3a'));
  plate(68,-28,0, () => polygon([[362,191],[450,150],[450,374],[362,415]], '#28232f'));
  [211,275,339].forEach(y => plate(68,-28,0,(angle,light) => fan(406,y,32,true,angle,light)));
  plate(0,-52,0, () => {
    polygon([[184,159],[272,118],[450,150],[362,191]], '#48424e');
    for(let i=0;i<11;i++) polygon([[222+i*11,156+i*2],[260+i*11,138+i*2],[264+i*11,139+i*2],[226+i*11,157+i*2]], '#28252e');
  });
  plate(-82,35,-.035, () => {
    polygon([[184,159],[362,191],[362,415],[184,382]], 'rgba(183,162,222,.09)', '#aaa1bb');
    [[192,171],[354,199],[354,402],[192,374]].forEach(([x,y])=>disk(x,y,2,'#b9b2c4'));
  });

  let frame = 0;
  let timer;
  function finish() {
    cancelAnimationFrame(frame);
    clearTimeout(timer);
    motion.removeEventListener('change', finish);
    if (overlay.open) overlay.close();
  }
  function render(now) {
    const t = Math.max(0, now-start);
    const light = Math.min(1, Math.max(0,(t-200)/640));
    // Ease into a short exploded view; the fans stay mounted on the fascia.
    const progress = Math.min(1, Math.max(0, (t - 1370) / 920));
    const split = progress * progress * (3 - 2 * progress);
    const speedUp = Math.min(t/1000,1);
    const angle = (t/1000)*speedUp*9;
    ctx.clearRect(0,0,640,560);
    for (const part of parts) {
      ctx.save();
      ctx.translate(320 + part.dx*split,280 + part.dy*split);
      ctx.rotate(part.turn*split);
      ctx.translate(-320,-280);
      part.draw(angle,light);
      ctx.restore();
    }
    if (t < 2660) frame=requestAnimationFrame(render);
    else finish();
  }
  overlay.querySelector('button').addEventListener('click',finish);
  overlay.addEventListener('cancel',finish);
  motion.addEventListener('change',finish);
  const start = performance.now();
  overlay.showModal();
  try { sessionStorage.setItem('powertech-intro-seen', '1'); } catch {}
  timer = setTimeout(finish, 2800);
  render(start);
})();
