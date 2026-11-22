import * as T from './vendor/three.module.min.js';

// The graphics card is mounted vertically so its cooling assembly faces the open panel.
export function createStudio(canvas) {
  const renderer = new T.WebGLRenderer({canvas, antialias: true, alpha: true, powerPreference: 'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.toneMapping = T.ACESFilmicToneMapping;
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(32, 1, .05, 70);
  const lighting = new T.Scene();
  lighting.background = new T.Color('#343b46');
  function softbox(x,y,z,w,h,intensity) {
    const panel = new T.Mesh(new T.PlaneGeometry(w,h), new T.MeshBasicMaterial({color:new T.Color().setScalar(intensity), side:T.DoubleSide}));
    panel.position.set(x,y,z); panel.lookAt(0,0,0); lighting.add(panel);
  }
  softbox(-3,4,4,4,6,6); softbox(4,3,-2,1.4,6,8);
  softbox(1,-1,5,4,.8,1.6); softbox(0,5,0,5,2,4.2);
  const pmrem = new T.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(lighting,.04).texture;
  pmrem.dispose();
  lighting.traverse(node=>{node.geometry?.dispose(); node.material?.dispose();});
  const key = new T.DirectionalLight('#ffebd5',1.75);
  key.position.set(-3,5,4); scene.add(key,new T.HemisphereLight('#eaf4ff','#473e36',.54));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  key.castShadow = true;
  key.shadow.mapSize.set(2048,2048);
  Object.assign(key.shadow.camera,{left:-3.8,right:3.8,top:3.8,bottom:-3.8,near:.1,far:16});
  key.shadow.normalBias = .013;
  const rim = new T.DirectionalLight('#c2d9ff',1.65);
  rim.position.set(4,2,-3); scene.add(rim);
  const caseLights=new T.Group();
  scene.add(caseLights);
  for(const [x,y,z,color,power] of [
    [1.66,1.26,.62,'#49cfff',2.4],
    [1.65,-.78,.60,'#558dff',2.2],
    [-.66,-1.11,.77,'#ae79ff',2.0]
  ]) {
    const glow=new T.PointLight(color,power,3.4);
    glow.position.set(x,y,z); caseLights.add(glow);
  }
  const floor = new T.Mesh(new T.PlaneGeometry(100,100), new T.ShadowMaterial({opacity:.13}));
  floor.rotation.x=-Math.PI/2; floor.position.y=-2.075; floor.receiveShadow=true; scene.add(floor);
  const chassis = new T.Group(), card = new T.Group(), replaceable = new T.Group();
  scene.add(chassis,card,replaceable);
  const palette = new Map();
  function metal(color,roughness=.36,metalness=.72) {
    const id=[color,roughness,metalness].join('/');
    if(!palette.has(id)) palette.set(id,new T.MeshStandardMaterial({color,roughness,metalness}));
    return palette.get(id);
  }
  // Anisotropic grain catches the softbox reflections along machined metal.
  const grainCanvas=document.createElement('canvas');
  grainCanvas.width=512; grainCanvas.height=256;
  const grainPen=grainCanvas.getContext('2d');
  grainPen.fillStyle='#dedede'; grainPen.fillRect(0,0,512,256);
  for(let i=0;i<2700;i++) {
    const value=120+(i*71%125);
    grainPen.fillStyle='rgba('+[value,value,value,.45].join(',')+')';
    grainPen.fillRect((i*179)%511,(i*137)%255,5+(i*17)%112,.8);
  }
  const grain=new T.CanvasTexture(grainCanvas);
  function brushed(color) {
    const material=metal(color,.34,.83);
    material.map=grain; material.roughnessMap=grain; material.bumpMap=grain; material.bumpScale=.009;
    return material;
  }
  const alloy=brushed('#7b8590'), graphite=metal('#353b43'), black=metal('#181d24',.48,.46);
  const pcb=metal('#263231',.63,.22), silver=brushed('#bec2c1'), rubber=metal('#15181b',.8,.04);
  const amber=new T.MeshStandardMaterial({color:'#ffa661',emissive:'#ff7718',emissiveIntensity:1.25,roughness:.35});
  const geometries=new Map();
  function geometry(key,make) {
    if(!geometries.has(key)) geometries.set(key,make());
    return geometries.get(key);
  }
  function mesh(parent,g,m,x,y,z) {
    const part=new T.Mesh(g,m); part.position.set(x,y,z); parent.add(part); return part;
  }
  const loader=new T.TextureLoader();
  const loadMap=file=>{
    const texture=loader.load(new URL(file,import.meta.url).href,()=>canvas.dispatchEvent(new Event('materialready')));
    texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
    return texture;
  };
  function finish(name, physical) {
    const map=loadMap(name+'-color.webp');
    const relief=loadMap(name+'-surface.webp');
    map.colorSpace=T.SRGBColorSpace;
    if(name==='preview-graphite') {
      for(const texture of [map,relief]) {
        texture.wrapS=texture.wrapT=T.MirroredRepeatWrapping;
        texture.repeat.set(.65,1.3);
      }
    }
    return new T.MeshStandardMaterial({...physical,map,bumpMap:relief,roughnessMap:relief});
  }
  const enamel=finish('preview-graphite',{roughness:.72,metalness:.32,bumpScale:.008});
  const shroud=finish('a1-shroud',{roughness:.77,metalness:.72,bumpScale:.0038});
  // Project the paint at a constant physical scale, including on narrow frame edges.
  function panelUV(g,faceWidth=1,faceHeight=1) {
    const {position,normal,uv}=g.attributes;
    for(let i=0;i<position.count;i++) {
      const x=position.getX(i), y=position.getY(i), z=position.getZ(i);
      const nx=Math.abs(normal.getX(i)), ny=Math.abs(normal.getY(i)), nz=Math.abs(normal.getZ(i));
      const u=nx>ny && nx>nz ? z : x;
      const v=ny>nx && ny>nz ? z : y;
      uv.setXY(i,.5+u/faceWidth,.5+v/faceHeight);
    }
    return g;
  }
  const cube=geometry('cube',()=>new T.BoxGeometry());
  function box(parent,x,y,z,w,h,d,m) {
    if(m===enamel) {
      const g=geometry(['panel',w,h,d].join('/'),()=>panelUV(new T.BoxGeometry(w,h,d)));
      return mesh(parent,g,m,x,y,z);
    }
    const part=mesh(parent,cube,m,x,y,z); part.scale.set(w,h,d); return part;
  }
  function disk(parent,x,y,z,r,depth,m) {
    const g=geometry('cylinder',()=>new T.CylinderGeometry(1,1,1,32));
    const part=mesh(parent,g,m,x,y,z); part.scale.set(r,depth,r); part.rotation.x=Math.PI/2; return part;
  }
  function ring(parent,x,y,z,r,t,m) {
    return mesh(parent,geometry('ring'+r+'/'+t,()=>new T.TorusGeometry(r,t,7,64)),m,x,y,z);
  }
  function screw(parent,x,y,z) {
    disk(parent,x,y,z,.031,.018,silver);
    box(parent,x,y,z+.011,.04,.008,.004,black).rotation.z=.5;
  }
  function shell(parent,x,y,z,w,h,d,cut,m) {
    const key=['shell',w,h,d,cut,m===shroud?'shroud':m===enamel?'paint':'plain'].join('/');
    const shape=geometry(key,()=>{
      const s=new T.Shape(), a=w/2,b=h/2;
      s.moveTo(-a+cut,-b); s.lineTo(a-cut,-b); s.lineTo(a,-b+cut); s.lineTo(a,b-cut);
      s.lineTo(a-cut,b); s.lineTo(-a+cut,b); s.lineTo(-a,b-cut); s.lineTo(-a,-b+cut); s.closePath();
      const extruded=new T.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelSegments:2,bevelThickness:.012,bevelSize:.013,bevelOffset:0,steps:1});
      if(m===shroud) return panelUV(extruded,w,h);
      if(m===enamel) return panelUV(extruded);
      return extruded;
    });
    return mesh(parent,shape,m,x,y,z);
  }
  const prints=new Map();
  function print(parent,text,x,y,z,w,h,ink='#eff1ef') {
    const key=text+ink;
    if(!prints.has(key)) {
      const sheet=document.createElement('canvas'); sheet.width=768; sheet.height=96;
      const pen=sheet.getContext('2d'); pen.font='bold 62px Arial'; pen.fillStyle=ink; pen.textAlign='center'; pen.textBaseline='middle'; pen.fillText(text,384,49,735);
      const texture=new T.CanvasTexture(sheet); texture.colorSpace=T.SRGBColorSpace;
      prints.set(key,new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));
    }
    const label=mesh(parent,geometry('plane',()=>new T.PlaneGeometry()),prints.get(key),x,y,z);
    label.scale.set(w,h,1);
  }
  const bladeShape=new T.Shape();
  bladeShape.moveTo(.16,.01); bladeShape.bezierCurveTo(.34,.02,.6,.19,.82,.48);
  bladeShape.quadraticCurveTo(.78,.61,.62,.66); bladeShape.quadraticCurveTo(.54,.39,.16,.13); bladeShape.closePath();
  const blade=new T.ExtrudeGeometry(bladeShape,{depth:.035,bevelEnabled:false,curveSegments:8});
  const positions=blade.attributes.position;
  for(let i=0;i<positions.count;i++) {
    const x=positions.getX(i), y=positions.getY(i);
    positions.setZ(i,positions.getZ(i)+.13*Math.sin(3*x-1.7*y)+.14*y);
  }
  blade.computeVertexNormals();
  const rotors=[];
  function fan(parent,x,y,z,r,trim,bladeCount=11) {
    disk(parent,x,y,z,r,.07,black);
    ring(parent,x,y,z+.044,r*.96,r*.024,trim);
    const rotor=new T.InstancedMesh(blade,metal('#33383b',.38,.22),bladeCount);
    rotor.position.set(x,y,z+.055);
    const vane=new T.Object3D();
    vane.scale.setScalar(r*.91);
    for(let i=0;i<bladeCount;i++) {
      vane.rotation.z=i*2*Math.PI/bladeCount; vane.updateMatrix();
      rotor.setMatrixAt(i,vane.matrix);
    }
    parent.add(rotor); rotors.push(rotor);
    disk(parent,x,y,z+.091,r*.218,.078,alloy);
    ring(parent,x,y,z+.132,r*.151,r*.009,silver);
  }
  function cable(parent,points,r,m) {
    const path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
    return mesh(parent,new T.TubeGeometry(path,24,r,6,false),m,0,0,0);
  }

  // Height and roughness vary independently of the base colour under the studio lights.
  function surface(material,pattern,scale,repeatX,repeatY) {
    const tile=document.createElement('canvas'); tile.width=tile.height=256;
    const ctx=tile.getContext('2d'), pixels=ctx.createImageData(256,256);
    let seed=731;
    for(let y=0;y<256;y++) for(let x=0;x<256;x++) {
      seed=(Math.imul(seed,1664525)+1013904223)>>>0;
      const noise=seed/4294967296;
      const cross=Math.cos((x+y)*Math.PI/8)*Math.cos((x-y)*Math.PI/8);
      const level=pattern==='braid' ? 164+52*cross+12*noise : 148+noise*85;
      const offset=(y*256+x)*4;
      pixels.data.set([level,level,level,255],offset);
    }
    ctx.putImageData(pixels,0,0);
    const texture=new T.CanvasTexture(tile);
    texture.wrapS=texture.wrapT=T.RepeatWrapping; texture.repeat.set(repeatX,repeatY);
    texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
    material.bumpMap=texture; material.bumpScale=scale; material.roughnessMap=texture;
    return material;
  }
  const sleeve=surface(metal('#33353a',.87,.05),'braid',.016,12,1);
  surface(graphite,'plastic',.004,2,2);
  // A longitudinally fluted aluminium insert frames the intake and carries the diffuser.
  const satin=brushed('#7c8996');
  const ice=new T.MeshStandardMaterial({color:'#168ac8',emissive:'#00aeff',emissiveIntensity:1.8,roughness:.32});
  const lilac=new T.MeshStandardMaterial({color:'#874bd2',emissive:'#9952ff',emissiveIntensity:1.8,roughness:.32});
  for(const z of [-.81,.81]) {
    box(chassis,1.972,0,z,.06,3.61,.18,satin);
    for(let i=0;i<4;i++) box(chassis,2.009,0,z-.063+i*.041,.014,3.55,.012,alloy);
    box(chassis,2.022,0,z,.035,3.49,.049,ice);
  }
  // The lower channel returns along the open side, above the feet.
  box(chassis,0,-1.84,.976,3.65,.051,.025,black);
  box(chassis,0,-1.84,.993,3.59,.034,.018,lilac);
  // Fluted side-cover insert has real relief so each ridge catches the rim light.
  for(let i=0;i<22;i++) {
    const rib=box(chassis,.46+i*.054,-.21,-1.009,.032,2.36,.052,satin);
    rib.rotation.z=-.20;
  }
  // Folded sheet-metal frame, removable side, motherboard tray and PSU enclosure.
  for(const y of [-1.85,1.85]) {
    box(chassis,0,y,0,3.94,.11,1.83,enamel);
    box(chassis,0,y,.94,3.96,.105,.065,enamel);
  }
  for(const x of [-1.92,1.92]) for(const z of [-.88,.89])
    box(chassis,x,0,z,.085,3.68,.095,enamel);
  for(const x of [-1.72,1.72]) for(const z of [-.65,.65]) box(chassis,x,-1.98,z,.36,.18,.3,rubber);
  box(chassis,0,0,-.92,3.83,3.6,.07,enamel);
  for(let i=0;i<34;i++) box(chassis,-1.66+i*.098,1.912,-.03,.044,.008,1.31,black);
  for(const x of [-1.88,1.88]) for(const y of [-1.81,1.81]) screw(chassis,x,y,.987);
  box(chassis,0,-1.50,-.01,3.68,.55,1.73,enamel);
  for(let row=0;row<3;row++) for(let i=0;i<29;i++)
    box(chassis,-1.69+i*.095,-1.62+row*.1,.858,.055,.039,.008,black);
  const board=new T.Group();
  scene.add(board);
  box(board,-.35,.35,-.80,2.84,2.56,.075,metal('#403c2a',.78,.06));
  const faceMap=loadMap('a1-pcb-color.webp');
  faceMap.colorSpace=T.SRGBColorSpace;
  const surfaceMap=loadMap('a1-pcb-surface.webp');
  const solderMask=new T.MeshStandardMaterial({
    map:faceMap, roughnessMap:surfaceMap, metalnessMap:surfaceMap,
    bumpMap:surfaceMap, bumpScale:.0026, roughness:.88, metalness:.95
  });
  mesh(board,new T.PlaneGeometry(2.84,2.56),solderMask,-.35,.35,-.761);
  // Backside solder mask with a CPU cooler mounting plate.
  box(board,-.60,.85,-.85,.77,.70,.033,graphite);
  for(const x of [-.91,-.29]) for(const y of [.60,1.12]) disk(board,x,y,-.88,.046,.04,silver);

  const gold=metal('#c2a66b',.29,.79);
  const socket=metal('#3b4043',.52,.24);
  const connector=metal('#25272a',.54,.11);
  function pinHeader(x,y,count) {
    box(board,x,y,-.725,count*.065,.12,.06,connector);
    for(let pin=0;pin<count;pin++) for(const offset of [-.031,.031])
      box(board,x+(pin-(count-1)/2)*.065,y+offset,-.64,.016,.016,.115,gold);
  }
  // An LGA retaining lever, graphite chokes and aluminium capacitors surround the socket.
  cable(board,[[-.97,.43,-.48],[-1.03,.45,-.48],[-1.03,1.13,-.48],[-.97,1.17,-.51]],.016,silver);
  for(let i=0;i<6;i++) {
    const y=.47+i*.156;
    box(board,-1.20,y,-.68,.13,.118,.15,socket);
    print(board,'R47',-1.20,y,-.60,.10,.035);
    disk(board,-1.35,y,-.69,.058,.14,silver);
    box(board,-1.35,y,-.614,.072,.008,.003,graphite);
  }
  // Rear I/O blocks have folded metal shields and dark connector inserts.
  for(const [y,h] of [[1.35,.32],[.94,.37],[.54,.28],[.19,.32]]) {
    box(board,-1.65,y,-.64,.22,h,.24,silver);
    for(const dy of [-h*.23,h*.23]) {
      box(board,-1.65,y+dy,-.511,.166,h*.24,.014,connector);
      box(board,-1.65,y+dy-.012,-.500,.122,h*.048,.008,metal('#416884',.59,.14));
    }
    for(const x of [-1.735,-1.565]) box(board,x,y,-.511,.009,h*.81,.01,alloy);
  }
  // Reinforced expansion socket, key notch, gold contacts and end latch.
  box(board,-.63,-.18,-.691,1.74,.145,.14,alloy);
  box(board,-.63,-.18,-.612,1.63,.082,.028,connector);
  for(let i=0;i<78;i++) {
    if(i===14 || i===15) continue;
    for(const dy of [-.027,.027]) box(board,-1.40+i*.020,-.18+dy,-.593,.009,.014,.007,gold);
  }
  box(board,.28,-.18,-.63,.14,.16,.15,socket);
  // Chipset heatsink, RTC cell and M.2 standoff.
  box(board,.64,-.39,-.704,.55,.55,.09,graphite);
  for(let i=0;i<10;i++) {
    const fin=box(board,.435+i*.044,-.39,-.618,.025,.46,.105,alloy);
    fin.rotation.z=-.105;
  }
  disk(board,-1.16,-.55,-.707,.175,.09,connector);
  disk(board,-1.16,-.55,-.651,.148,.026,silver);
  print(board,'CR2032',-1.16,-.55,-.634,.19,.048,'#394043');
  disk(board,-1.28,.075,-.722,.046,.075,gold);
  box(board,-.17,.075,-.708,.13,.28,.10,connector);
  pinHeader(.58,-.81,9); pinHeader(-.45,-.81,7);
  box(board,.94,.78,-.65,.19,.72,.21,connector);
  for(let i=0;i<12;i++) for(const x of [.90,.98])
    box(board,x,.475+i*.055,-.538,.044,.038,.01,black);
  for(const [x,y] of [[-1.69,1.56],[.99,1.56],[-1.69,-.84],[.99,-.84]]) {
    ring(board,x,y,-.752,.047,.012,gold); screw(board,x,y,-.735);
  }
  for(let i=0;i<3;i++) {
    const mount=new T.Group(); mount.position.set(1.72,-1.11+i*1.1,0); mount.rotation.y=Math.PI/2;
    chassis.add(mount); shell(mount,0,0,-.09,1.1,1.07,.1,.075,black); fan(mount,0,0,.035,.494,ice);
  }
  // Powder-coated air intake with perforations through the front sheet.
  const grilleCanvas=document.createElement('canvas');
  grilleCanvas.width=32; grilleCanvas.height=32;
  const grillePen=grilleCanvas.getContext('2d');
  grillePen.fillStyle='#fff'; grillePen.fillRect(0,0,32,32);
  grillePen.globalCompositeOperation='destination-out';
  for(const [x,y] of [[8,8],[24,24]]) {
    grillePen.beginPath(); grillePen.arc(x,y,9,0,Math.PI*2); grillePen.fill();
  }
  grillePen.globalCompositeOperation='destination-over';
  grillePen.fillStyle='#000'; grillePen.fillRect(0,0,32,32);
  const grilleTexture=new T.CanvasTexture(grilleCanvas);
  grilleTexture.wrapS=grilleTexture.wrapT=T.RepeatWrapping;
  grilleTexture.repeat.set(19,39);
  const grille=enamel.clone();
  grille.alphaMap=grilleTexture; grille.alphaTest=.42; grille.side=T.DoubleSide;
  for(const x of [-1.96,1.96]) {
    const panel=mesh(chassis,new T.PlaneGeometry(1.76,3.63),grille,x,0,0);
    panel.rotation.y=Math.sign(x)*Math.PI/2;
  }
  print(chassis,'POWEREDGE',.98,-1.51,.866,.69,.13,'#313944');
  const exhaust=new T.Group(); exhaust.position.set(-1.81,.93,.08);
  exhaust.rotation.y=Math.PI/2; chassis.add(exhaust);
  fan(exhaust,0,0,0,.60,amber);
  const cooler=new T.Group(); chassis.add(cooler);
  for(let i=0;i<30;i++) box(cooler,-.60,.40+i*.027,-.21,.89,.013,.79,silver);
  for(const x of [-.91,-.72,-.48,-.29]) {
    disk(cooler,x,1.21,-.20,.041,.10,alloy).rotation.x=0;
    cable(cooler,[[x,.41,-.10],[x,.30,-.12],[-.60,.30,-.52],[-.60,.69,-.6]],.035,metal('#ae7350'));
  }
  shell(cooler,-.60,.79,.19,.94,.93,.068,.07,black);
  fan(cooler,-.60,.79,.28,.435,alloy);
  for(let i=0;i<6;i++) cable(chassis,[[.97+i*.031,.58,-.69],[1.22+i*.029,.59,-.26],[1.35+i*.025,.30,-.16],[1.34+i*.027,-.50,-.5]],.016,sleeve);

  function build() {
    const cpu={brand:'Intel',mark:'i5-12400F',color:'#b9bfc6'};
    const gpu={mark:'RTX 4060',length:2.5,fans:2};
    const ram='16';
    replaceable.clear(); card.clear();
    shell(replaceable,-.60,.77,-.67,.82,.78,.07,.045,silver);
    box(replaceable,-.60,.77,-.55,.68,.65,.10,pcb);
    shell(replaceable,-.60,.77,-.49,.57,cpu.brand==='Intel'?.53:.57,.055,.038,silver);
    print(replaceable,'intel CORE i5',-.60,.84,-.416,.43,.079,'#303234');
    print(replaceable,cpu.mark,-.60,.75,-.416,.37,.061,'#303234');
    for(const x of [-.96,-.24]) for(const y of [.45,1.09]) screw(replaceable,x,y,-.58);
    for(let i=0;i<4;i++){
      const x=.10+i*.18;
      box(replaceable,x,.82,-.69,.12,1.12,.1,black);
      for(const dx of [-.047,.047]) box(replaceable,x+dx,.82,-.628,.014,1.08,.035,graphite);
      for(const y of [.22,1.42]) box(replaceable,x,y,-.616,.11,.09,.08,alloy);
      if(i%2===0) for(let j=0;j<44;j++) {
        for(const dx of [-.023,.023]) box(replaceable,x+dx,.31+j*.023,-.636,.009,.009,.01,gold);
      }
      if(ram==='32'||i%2===1) {
        box(replaceable,x,.82,-.53,.11,1.07,.29,graphite);
        box(replaceable,x,.82,-.374,.077,1.0,.026,metal(cpu.color));
        for(let j=0;j<5;j++) box(replaceable,x,.44+j*.18,-.35,.08,.021,.02,alloy);
      }
    }
    const amd=gpu.mark==='RX 6600', premium=gpu.fans===3;
    const length=gpu.length, center=-1.66+length/2, radius=premium?.425:amd?.43:.47;
    const height=premium?1.18:1.12;
    const casing=amd?brushed('#802a30'):premium?brushed('#a2a8a9'):shroud;
    shell(card,center,-.56,.12,length,height,.06,.05,pcb);
    // Fin stack is exposed between the backplate and the bevelled fan shroud.
    for(let i=0;i<Math.floor(length/.052);i++)
      box(card,-1.63+i*.052,-.55,.32,.021,height*.92,.32,silver);
    shell(card,center,-.56,.5,length,height,.085,amd?.15:premium?.11:.055,casing);
    const trim=amd?metal('#d24f41'):premium?silver:graphite;
    for(let i=0;i<gpu.fans;i++) {
      const x=-1.66+length*(i+.5)/gpu.fans;
      fan(card,x,-.59,.61,radius,trim,amd?9:11);
    }
    for(const side of [-1,1]) {
      const x=center+side*(length/2-.095);
      for(const y of [-.97,-.11]) screw(card,x,y,.60);
      for(let i=0;i<3;i++) {
        const slash=box(card,x-side*(.1+i*.07),-.10,.598,.032,.12,.018,trim);
        slash.rotation.z=amd?-.68:.68;
      }
    }
    // Machined braces and intake slots give each cooler a different silhouette.
    for(let j=1;j<gpu.fans;j++) {
      const x=-1.66+length*j/gpu.fans;
      for(const sign of [-1,1]) {
        const rib=box(card,x+sign*.047,-.56,.612,.036,premium?.72:.54,.025,trim);
        rib.rotation.z=sign*(premium?.27:.16);
      }
    }
    for(let i=0;i<Math.floor(length/.09)-2;i++) {
      const x=-1.52+i*.09;
      box(card,x,-1.036,.607,.044,.064,.014,black).rotation.z=amd?-.42:.4;
    }
    for(let i=0;i<3;i++) box(card,-1.724,-.28-i*.22,.32,.025,.084,.21,black);
    shell(card,center,.014,.548,length*.65,.164,.058,.026,black);
    print(card,gpu.mark,center,.014,.633,length*.67,.205);
    box(card,-1.69,-.55,.32,.043,1.26,.65,silver);
    box(card,center+length*.25,.062,.26,.27,.16,.19,rubber);
  }
  for(let wire=0;wire<8;wire++) {
    const x=wire*.029;
    cable(chassis,[[.14+x,.10,.29],[.15+x,.19,.48],[.32+x,.16,.77],[.62+x,-.16,.78],[.86+x,-.94,.43],[.97+x,-1.24,.19]],.014,sleeve);
  }
  // The heat pipes turn around the visible ends of the GPU fin stack.
  const nickel=brushed('#ada7a1');
  for(let i=0;i<3;i++) {
    const z=.21+i*.09;
    cable(card,[[.53,-.11,z],[.77,-.11,z],[.855,-.17,z],[.855,-.39,z],[.79,-.46,z],[.58,-.46,z]],.027,nickel);
  }
  // Recessed cable passages and folded reinforcement in the motherboard tray.
  for(const y of [-.57,.58,1.25]) {
    shell(chassis,1.24,y,-.862,.30,.46,.032,.075,rubber);
    for(let tooth=0;tooth<6;tooth++)
      box(chassis,1.24,y-.13+tooth*.051,-.822,.20,.018,.008,black);
  }
  // Subtle stamping and pressed edges on the removable cable-side cover.
  shell(chassis,0,0,-.971,3.81,3.54,.027,.056,enamel);
  for(const y of [-1.57,1.57]) box(chassis,0,y,-.976,3.49,.017,.012,alloy);
  for(const x of [-1.76,1.76]) for(const y of [-1.65,1.65]) {
    disk(chassis,x,y,-.987,.032,.023,graphite);
    box(chassis,x,y,-1,.035,.006,.005,silver).rotation.z=.74;
  }
  // Rear expansion slots, motherboard I/O shield and mains inlet.
  const rear=new T.Group(); rear.position.x=-1.977; rear.rotation.y=-Math.PI/2; chassis.add(rear);
  shell(rear,-.58,.80,0,.52,1.63,.025,.018,alloy);
  for(let row=0;row<4;row++) for(const dx of [-.11,.11]) {
    box(rear,-.58+dx,.28+row*.24,.035,.18,.115,.025,silver);
    box(rear,-.58+dx,.28+row*.24,.051,.152,.087,.013,black);
    box(rear,-.58+dx,.27+row*.24,.060,.124,.023,.009,metal('#30537a'));
  }
  for(let i=0;i<5;i++) {
    box(rear,.06,-.18-i*.17,.037,1.38,.13,.038,graphite);
    for(let j=0;j<11;j++) box(rear,-.50+j*.10,-.18-i*.17,.059,.071,.047,.008,black);
    screw(rear,.80,-.18-i*.17,.05);
  }
  shell(rear,0,-1.48,.04,1.68,.58,.028,.035,graphite);
  shell(rear,.46,-1.48,.08,.45,.32,.024,.045,black);
  for(const [x,y] of [[.34,-1.52],[.58,-1.52],[.46,-1.41]]) box(rear,x,y,.113,.025,.071,.023,silver);
  // Top I/O and the status LED are inset into the folded front lip.
  const top=new T.Group(); top.position.set(1.71,1.914,0); top.rotation.x=-Math.PI/2; chassis.add(top);
  disk(top,0,.56,0,.088,.016,graphite); ring(top,0,.56,.012,.069,.005,amber);
  for(const y of [.23,-.05]) {
    box(top,0,y,0,.092,.178,.009,black);
    box(top,.015,y,.007,.025,.143,.008,metal('#34587b'));
  }
  disk(top,0,-.34,0,.047,.01,black);
  // Cable combs secure the individual leads as they turn towards the PSU.
  for(const y of [.38,-.13]) box(chassis,1.36,y,-.23,.25,.045,.075,graphite);
  for(const x of [.28,.64]) {
    for(const y of [.23,1.41]) box(chassis,x,y,-.51,.14,.10,.20,alloy);
    print(chassis,'DDR4',x,.78,-.347,.095,.035);
  }
  for(const x of [-.91,-.72,-.48,-.29]) {
    const cap=disk(cooler,x,1.208,-.19,.052,.044,metal('#b88964',.34,.8));
    cap.rotation.x=0;
  }
  const contactCanvas=document.createElement('canvas');
  contactCanvas.width=contactCanvas.height=128;
  const pen=contactCanvas.getContext('2d');
  const fade=pen.createRadialGradient(64,64,10,64,64,63);
  fade.addColorStop(0,'rgba(0,0,0,.83)'); fade.addColorStop(.58,'rgba(0,0,0,.52)'); fade.addColorStop(1,'transparent');
  pen.fillStyle=fade; pen.fillRect(0,0,128,128);
  const contact=new T.Mesh(new T.PlaneGeometry(6.4,3.6),new T.MeshBasicMaterial({map:new T.CanvasTexture(contactCanvas),transparent:true,depthWrite:false}));
  contact.rotation.x=-Math.PI/2; contact.position.y=-2.071; scene.add(contact);
  // Indirect light spreading beneath the raised chassis.
  const spill=new T.Mesh(new T.PlaneGeometry(5.8,3.2),new T.MeshBasicMaterial({
    color:'#9966ff',transparent:true,
    opacity:.42,depthWrite:false,blending:T.AdditiveBlending
  }));
  const spillCanvas=document.createElement('canvas');
  spillCanvas.width=spillCanvas.height=128;
  const brush=spillCanvas.getContext('2d');
  const halo=brush.createRadialGradient(64,64,0,64,64,64);
  halo.addColorStop(0,'rgba(255,255,255,.95)'); halo.addColorStop(.52,'rgba(255,255,255,.42)'); halo.addColorStop(1,'rgba(255,255,255,0)');
  brush.fillStyle=halo; brush.fillRect(0,0,128,128);
  spill.material.map=new T.CanvasTexture(spillCanvas);
  spill.rotation.x=-Math.PI/2; spill.position.set(0,-2.067,.70); caseLights.add(spill);
  build();
  // Batch repeated screws, fins and PCB components into shared draw calls.
  // Keep the glazing separate from the static instance batches for detail inspection.
  const glazing=new T.Group();
  scene.add(glazing);
  const smokedGlass=new T.MeshPhysicalMaterial({
    color:'#28323b', roughness:.075, metalness:.06, transparent:true, opacity:.20,
    depthWrite:false, ior:1.52, clearcoat:1, clearcoatRoughness:.045, envMapIntensity:1.55
  });
  const pane=box(glazing,0,0,1.012,3.84,3.63,.030,smokedGlass);
  pane.renderOrder=2;
  const edge=metal('#536d70',.17,.54);
  for(const x of [-1.915,1.915]) box(glazing,x,0,1.015,.012,3.60,.024,edge);
  for(const y of [-1.809,1.809]) box(glazing,0,y,1.015,3.82,.012,.024,edge);
  for(const x of [-1.84,1.84]) for(const y of [-1.73,1.73]) {
    disk(glazing,x,y,1.034,.064,.021,rubber);
    screw(glazing,x,y,1.054);
  }
  const surroundings=new T.Group(), boardDisplay=new T.Group();
  scene.add(surroundings,boardDisplay);
  const batches=new Map();
  scene.updateMatrixWorld(true);
  for(const rotor of rotors) {
    const pivot=new T.Group(); rotor.parent.add(pivot); pivot.position.copy(rotor.position);
    rotor.position.set(0,0,0); pivot.add(rotor); surroundings.attach(pivot);
  }
  for(const root of [chassis,card,replaceable,board]) root.traverse(node=>{
    if(!node.isMesh) return;
    const onBoard=root===board || root===replaceable;
    const id=(onBoard?"board":"case")+node.geometry.uuid+node.material.uuid;
    if(!batches.has(id)) batches.set(id,[]);
    batches.get(id).push(node);
  });
  for(const [id,nodes] of batches) {
    const first=nodes[0], group=new T.InstancedMesh(first.geometry,first.material,nodes.length);
    nodes.forEach((node,i)=>group.setMatrixAt(i,node.matrixWorld));
    group.castShadow=!first.material.transparent; group.receiveShadow=true;
    (id.startsWith("board") ? boardDisplay : surroundings).add(group);
  }
  scene.remove(chassis,card,replaceable,board);
  renderer.shadowMap.needsUpdate=true;
  const anchors=[[-.43,-.59,.76],[-.60,.79,.42],[.64,.98,-.32],[-1.73,.93,.08],[-1.31,1.39,-.70],[-1.24,-1.49,.87]];
  function draw(view,seconds=0) {
    glazing.visible=!view.inspecting;
    const assembled=!view.boardOnly;
    if(surroundings.visible!==assembled) {
      surroundings.visible=assembled; caseLights.visible=assembled; floor.visible=assembled; contact.visible=assembled;
      renderer.shadowMap.needsUpdate=true;
    }
    rotors.forEach((rotor,i)=>{ rotor.rotation.z=seconds*(3.7+i*.27); });
    const w=canvas.clientWidth,h=canvas.clientHeight;
    if(!w || !h) return [];
    if(canvas.width!==Math.floor(w*renderer.getPixelRatio()) || canvas.height!==Math.floor(h*renderer.getPixelRatio())) renderer.setSize(w,h,false);
    camera.aspect=w/h;
    const target=new T.Vector3(...view.target);
    const distance=Math.max(9.5,9.5/camera.aspect)/view.zoom;
    camera.position.set(Math.sin(view.yaw)*Math.cos(view.pitch),Math.sin(view.pitch),Math.cos(view.yaw)*Math.cos(view.pitch)).multiplyScalar(distance).add(target);
    camera.lookAt(target); camera.updateProjectionMatrix();
    renderer.render(scene,camera);
    return anchors.map(point=>new T.Vector3(...point).project(camera));
  }
  return {draw,anchors};
}
