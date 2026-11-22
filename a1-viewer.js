import {createStudio} from './a1-studio.js';

export function mountViewer(section, pins, onLoss) {
  const lens = section.querySelector('.cutaway-lens');
  const canvas = document.createElement('canvas');
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label','3D-превью корпуса. Вращайте мышью или стрелками клавиатуры.');
  lens.prepend(canvas);
  let studio;
  try { studio = createStudio(canvas); }
  catch (error) { canvas.remove(); throw error; }
  const home = {yaw:.53,pitch:.19,zoom:1,target:[0,-.05,0]};
  let view = {...home}, frame = 0;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  section.classList.add('has-studio');
  let running=false, visible=false, animation=0, elapsed=0, previous=0;
  function tick(now) {
    if(!running) return;
    const delta=now-previous;
    if(delta>=1000/30) {
      elapsed+=Math.min(delta,90)/1000;
      previous=now;
      render();
    }
    animation=requestAnimationFrame(tick);
  }
  function syncAnimation() {
    running=visible && !document.hidden && !motion.matches;
    cancelAnimationFrame(animation);
    if(running) { previous=performance.now(); animation=requestAnimationFrame(tick); }
  }
  const visibility=new IntersectionObserver(([entry])=>{
    visible=entry.isIntersecting;
    syncAnimation();
  });
  visibility.observe(lens);
  document.addEventListener('visibilitychange',syncAnimation);
  motion.addEventListener('change',syncAnimation);
  function render() {
    const points = studio.draw(view,elapsed);
    points.forEach((point,i) => {
      const button = pins.children[i];
      button.style.left = (point.x+1)*50+'%';
      button.style.top = (1-point.y)*50+'%';
      button.style.visibility = Math.cos(view.yaw)<.52 ? 'hidden' : '';
    });
  }
  canvas.addEventListener('materialready',render);
  function focus(index) {
    cancelAnimationFrame(frame);
    const start = view;
    const end = index === null ? home : {
      yaw:[.12,-.15,.23,.61,.14,-1.87][index],pitch:.12,zoom:[2.35,2.35,2.35,2.35,1.72,2.45][index],
      target:index===4 ? [-.35,canvas.clientWidth<520 ? .49 : .35,-.67] : index===5 ? [-1.94,-1.47,0] : studio.anchors[index]
    };
    const angle = Math.atan2(Math.sin(end.yaw-start.yaw),Math.cos(end.yaw-start.yaw));
    const then = performance.now();
    function step(now) {
      const t = motion.matches ? 1 : 1-Math.pow(1-Math.min(1,(now-then)/680),3);
      const mix = (a,b) => a+(b-a)*t;
      view = {inspecting:index!==null,boardOnly:index===4,yaw:start.yaw+angle*t,pitch:mix(start.pitch,end.pitch),zoom:mix(start.zoom,end.zoom),
        target:start.target.map((a,i)=>mix(a,end.target[i]))};
      render();
      if(t<1) frame=requestAnimationFrame(step);
    }
    frame=requestAnimationFrame(step);
  }
  function orbit(dx,dy) {
    cancelAnimationFrame(frame);
    view={...view,yaw:view.yaw+dx,pitch:Math.max(-.15,Math.min(1.1,view.pitch+dy))};
    render();
  }
  let drag;
  canvas.onpointerdown = event => {
    if(!event.isPrimary || event.button!==0) return;
    canvas.setPointerCapture(event.pointerId);
    drag=[event.clientX,event.clientY];
  };
  canvas.onpointermove = event => {
    if(!drag || !canvas.hasPointerCapture(event.pointerId)) return;
    orbit((drag[0]-event.clientX)*.009,(event.clientY-drag[1])*.007);
    drag=[event.clientX,event.clientY];
  };
  canvas.onlostpointercapture = () => { drag=null; };
  canvas.onkeydown = event => {
    const delta={ArrowLeft:[-.16,0],ArrowRight:[.16,0],ArrowUp:[0,.1],ArrowDown:[0,-.1]}[event.key];
    if(delta) {event.preventDefault(); orbit(...delta);}
  };
  const resize=new ResizeObserver(render);
  resize.observe(lens);
  canvas.addEventListener('webglcontextlost',()=>{
    canvas.removeEventListener('materialready',render);
    running=false; cancelAnimationFrame(animation); visibility.disconnect();
    document.removeEventListener('visibilitychange',syncAnimation);
    motion.removeEventListener('change',syncAnimation);
    resize.disconnect(); cancelAnimationFrame(frame);
    section.classList.remove('has-studio'); canvas.remove(); onLoss();
  },{once:true});
  render();
  return {focus};
}
