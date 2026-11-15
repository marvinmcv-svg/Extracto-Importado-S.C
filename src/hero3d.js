import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/**
 * Real-time model of the Extracto Importado 100 ml flask:
 * square thick glass, amber juice, matte black cap, cream "PARFUM" label.
 * Returns { setScent(f), setScroll(p), destroy() } or null if WebGL is unavailable.
 */
export function createHero(canvas, { reducedMotion = false } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0.3, 10);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const key = new THREE.DirectionalLight(0xfff1dc, 2.2);
  key.position.set(3, 5, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xe2b874, 3.2);
  rim.position.set(-4, 2, -3);
  scene.add(rim);
  const back = new THREE.PointLight(0xffc477, 18, 12);
  back.position.set(0, 0, -2.5);
  scene.add(back);

  const root = new THREE.Group();
  scene.add(root);
  const bottle = new THREE.Group();
  root.add(bottle);

  // ---- Glass (thick, square, softly rounded)
  const W = 2.0, H = 2.15, D = 1.3;
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.03,
    transmission: 1,
    thickness: 1.6,
    ior: 1.5,
    clearcoat: 0.25,
    clearcoatRoughness: 0.05,
    specularIntensity: 0.7,
    envMapIntensity: 0.7,
    attenuationColor: new THREE.Color('#fffaf0'),
    attenuationDistance: 5,
  });
  const glass = new THREE.Mesh(new RoundedBoxGeometry(W, H, D, 6, 0.1), glassMat);
  bottle.add(glass);

  // ---- Amber juice (sits on a thick glass base, like the real flask)
  const base = 0.24;
  const liquidH = H - base - 0.18;
  // Opaque juice: three.js transmission only refracts opaque objects, so a
  // non-transmissive liquid is what makes the amber read through the glass.
  const liquidMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#c8781a'),
    roughness: 0.22,
    metalness: 0,
    clearcoat: 0.6,
    clearcoatRoughness: 0.2,
    envMapIntensity: 0.35,
    emissive: new THREE.Color('#8a4508'),
    emissiveIntensity: 0.45,
    attenuationColor: new THREE.Color('#a8590e'),
  });
  const liquid = new THREE.Mesh(new RoundedBoxGeometry(W - 0.2, liquidH, D - 0.2, 4, 0.06), liquidMat);
  liquid.position.y = -H / 2 + base + liquidH / 2;
  bottle.add(liquid);

  // ---- Cream label (canvas texture, true to the printed label)
  const lc = document.createElement('canvas');
  lc.width = 600; lc.height = 720;
  const labelTex = new THREE.CanvasTexture(lc);
  labelTex.colorSpace = THREE.SRGBColorSpace;
  labelTex.anisotropy = 8;
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(1.3, 1.56),
    new THREE.MeshPhysicalMaterial({ map: labelTex, roughness: 0.7, clearcoat: 0.15 })
  );
  label.position.set(0, -0.02, D / 2 + 0.003);
  bottle.add(label);
  drawLabel(lc);
  labelTex.needsUpdate = true;

  // ---- Cap: matte black, wider than the shoulder
  const capMat = new THREE.MeshPhysicalMaterial({ color: 0x0b0a09, roughness: 0.42, metalness: 0.15, clearcoat: 0.35, clearcoatRoughness: 0.4, envMapIntensity: 0.9 });
  const capH = 0.92;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, capH, 96, 1), capMat);
  cap.position.y = H / 2 + capH / 2 + 0.06;
  bottle.add(cap);
  const capBevel = new THREE.Mesh(new THREE.TorusGeometry(0.54, 0.025, 16, 96), capMat);
  capBevel.rotation.x = Math.PI / 2;
  capBevel.position.y = H / 2 + capH + 0.055;
  bottle.add(capBevel);
  const capTop = new THREE.Mesh(new THREE.CircleGeometry(0.545, 96), capMat);
  capTop.rotation.x = -Math.PI / 2;
  capTop.position.y = H / 2 + capH + 0.07;
  bottle.add(capTop);
  // short glass neck visible under cap
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.12, 48), glassMat);
  neck.position.y = H / 2 + 0.05;
  bottle.add(neck);

  bottle.position.y = -0.6;

  // ---- Gold halo + glass droplets (refracted through the bottle)
  const gold = new THREE.MeshPhysicalMaterial({ color: 0xc9a46a, metalness: 1, roughness: 0.25, envMapIntensity: 1.5 });
  const halo = new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.016, 16, 220), gold);
  halo.position.set(0, 0.15, -2.2);
  root.add(halo);
  const halo2 = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.007, 16, 220), gold);
  halo2.position.set(0, 0.15, -2.6);
  root.add(halo2);

  const drops = [];
  const dropMat = glassMat.clone();
  dropMat.thickness = 0.5;
  for (let i = 0; i < 8; i++) {
    const r = 0.07 + Math.random() * 0.15;
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 32), dropMat);
    const a = (i / 8) * Math.PI * 2 + 0.3;
    m.position.set(Math.cos(a) * (2.5 + Math.random() * 0.8), Math.sin(a) * 1.9 + 0.2, -0.6 + Math.random() * 1.6);
    m.userData = { base: m.position.clone(), speed: 0.4 + Math.random() * 0.6, phase: Math.random() * 10 };
    root.add(m);
    drops.push(m);
  }

  // ---- Gold dust
  const N = reducedMotion ? 300 : 900;
  const pos = new Float32Array(N * 3);
  const seeds = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 14;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 9;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1;
    seeds[i] = Math.random();
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pGeo.setAttribute('seed', new THREE.BufferAttribute(seeds, 1));
  const pMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color('#e6c48a') }, uPR: { value: renderer.getPixelRatio() } },
    vertexShader: /* glsl */`
      attribute float seed; uniform float uTime; uniform float uPR; varying float vA;
      void main(){
        vec3 p = position;
        p.y = mod(position.y + 4.5 + uTime*0.12*(0.4+seed), 9.0) - 4.5;
        p.x += sin(uTime*0.4 + seed*20.0)*0.25;
        vec4 mv = modelViewMatrix * vec4(p,1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (2.0 + seed*5.0) * uPR * (6.0 / -mv.z);
        vA = 0.25 + 0.75*abs(sin(uTime*0.8 + seed*30.0));
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; varying float vA;
      void main(){ float d = length(gl_PointCoord-0.5); gl_FragColor = vec4(uColor, smoothstep(0.5,0.0,d)*vA*0.8); }`,
  });
  scene.add(new THREE.Points(pGeo, pMat));

  // ---- State / loop
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  let scroll = 0, visible = true, raf = 0, wobble = 0;
  const amber = new THREE.Color('#c8781a');
  const amberDeep = new THREE.Color('#8a4508');
  const target = { color: amber.clone(), deep: amberDeep.clone(), glow: new THREE.Color('#ffc477') };

  const onMove = (e) => {
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener('pointermove', onMove, { passive: true });

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = w < 700 ? 15 : 12.5;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) loop(); });
  io.observe(canvas);

  const clock = new THREE.Clock();
  function loop() {
    if (!visible) { raf = 0; return; }
    raf = requestAnimationFrame(loop);
    const t = clock.getElapsedTime();
    const k = reducedMotion ? 0.3 : 1;
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;

    bottle.rotation.y = Math.sin(t * 0.35 * k) * 0.5 + mouse.x * 0.6 + scroll * 1.8;
    bottle.rotation.x = mouse.y * 0.14 + 0.05;
    bottle.rotation.z = Math.sin(t * 0.5 * k) * 0.025;
    bottle.position.y = -0.6 + Math.sin(t * 0.8 * k) * 0.08 - scroll * 1.2;
    root.scale.setScalar(1 - scroll * 0.25);

    wobble *= 0.94;
    liquid.rotation.z = Math.sin(t * 9) * wobble * 0.05;

    halo.rotation.z = t * 0.05;
    halo.rotation.x = mouse.y * 0.2;
    halo2.rotation.z = -t * 0.03;
    drops.forEach((d) => {
      const u = d.userData;
      d.position.y = u.base.y + Math.sin(t * u.speed + u.phase) * 0.25;
      d.position.x = u.base.x + mouse.x * 0.3 * u.speed;
    });

    liquidMat.color.lerp(target.color, 0.05);
        liquidMat.emissive.lerp(target.deep, 0.03);
    back.color.lerp(target.glow, 0.05);

    pMat.uniforms.uTime.value = t;
    camera.position.x = mouse.x * 0.25;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }
  loop();

  return {
    // Keep the juice amber (true to product) but warm it toward the scent's colour.
    setScent(f) {
      target.color.copy(amber).lerp(new THREE.Color(f.color), 0.22);
      target.deep.copy(amberDeep).lerp(new THREE.Color(f.deep), 0.22);
      target.glow.set(f.color);
      wobble = 1;
    },
    setScroll(p) { scroll = p; },
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      window.removeEventListener('pointermove', onMove);
      renderer.dispose();
    },
  };
}

function drawLabel(cv) {
  const c = cv.getContext('2d');
  const w = cv.width, h = cv.height;
  c.fillStyle = '#efe8da';
  c.fillRect(0, 0, w, h);
  // paper grain
  for (let i = 0; i < 2500; i++) {
    c.fillStyle = `rgba(120,100,70,${Math.random() * 0.05})`;
    c.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
  }
  c.strokeStyle = '#1a1714';
  c.lineWidth = 2;
  c.strokeRect(30, 30, w - 60, h - 60);
  c.fillStyle = '#1a1714';
  c.textAlign = 'center';
  c.font = '500 74px Cinzel, "Cormorant Garamond", serif';
  spaced(c, 'EXTRACTO', w / 2, 230, 6);
  c.fillRect(110, 262, 120, 1.5);
  c.fillRect(w - 230, 262, 120, 1.5);
  c.font = '400 26px Cinzel, "Cormorant Garamond", serif';
  spaced(c, 'IMPORTADO', w / 2, 271, 5);
  c.font = '600 22px Manrope, sans-serif';
  spaced(c, 'PARFUM', w / 2, 470, 3);
  c.font = '500 20px Manrope, sans-serif';
  c.textAlign = 'left';
  c.fillText('100 ML.', 60, h - 60);
  c.textAlign = 'right';
  c.fillText('3.4 FL.OZ.', w - 60, h - 60);
}

function spaced(c, text, x, y, sp) {
  const chars = [...text];
  const widths = chars.map((ch) => c.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + sp * (chars.length - 1);
  const align = c.textAlign;
  c.textAlign = 'left';
  let cx = x - total / 2;
  chars.forEach((ch, i) => { c.fillText(ch, cx, y); cx += widths[i] + sp; });
  c.textAlign = align;
}
