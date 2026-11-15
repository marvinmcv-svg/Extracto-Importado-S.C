// Glossy WebGL perfume bottle — the Extracto 100 ml square flacon:
// thick refractive glass, amber juice, matte black cap, cream label.
// Studio reflections come from a PMREM'd RoomEnvironment plus two coloured rim lights.
// The scroll story drives `state` (GSAP tweens it); the render loop eases the mesh toward it.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import gsap from 'gsap';

function labelTexture() {
  const W = 512, H = 600;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const draw = () => {
    g.fillStyle = '#efe5d2';
    g.fillRect(0, 0, W, H);
    // paper grain
    for (let i = 0; i < 2600; i++) {
      g.fillStyle = `rgba(90,70,40,${Math.random() * 0.05})`;
      g.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5);
    }
    g.strokeStyle = '#a88f62'; g.lineWidth = 3; g.strokeRect(22, 22, W - 44, H - 44);
    g.lineWidth = 1; g.strokeRect(34, 34, W - 68, H - 68);
    g.fillStyle = '#231c14'; g.textAlign = 'center';
    g.font = '500 62px Cinzel, "Times New Roman", serif';
    g.fillText('EXTRACTO', W / 2, 238);
    g.font = '600 20px Inter, Helvetica, Arial, sans-serif';
    g.save(); g.letterSpacing = '10px'; g.fillText('IMPORTADO', W / 2 + 5, 280); g.restore();
    g.fillStyle = '#b0732a'; g.fillRect(W / 2 - 40, 312, 80, 2);
    g.fillStyle = '#231c14';
    g.font = '600 17px Inter, Helvetica, Arial, sans-serif';
    g.save(); g.letterSpacing = '6px'; g.fillText('PARFUM · 100 ML', W / 2 + 3, 470); g.restore();
  };
  draw();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  // redraw once the webfonts are in so the wordmark isn't a fallback serif
  document.fonts?.load('500 62px Cinzel').then(() => { draw(); tex.needsUpdate = true; }).catch(() => {});
  return tex;
}

function shadowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  r.addColorStop(0, 'rgba(0,0,0,.75)');
  r.addColorStop(0.45, 'rgba(0,0,0,.35)');
  r.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = r; g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

export function initBottle3D(canvas, { reduced = false, dark = true } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  const small = matchMedia('(max-width: 760px)').matches;
  renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.5 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.62; // a dim studio so the black stage stays black
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0.35, 8.6);
  camera.lookAt(0, 0.25, 0);

  /* ── the flacon ── */
  const bottle = new THREE.Group();
  const BW = 1.6, BH = 1.9, BD = 1.0;

  const glass = new THREE.Mesh(
    new RoundedBoxGeometry(BW, BH, BD, 8, 0.14),
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff, metalness: 0, roughness: 0.04, transmission: 1, thickness: 0.9, ior: 1.52,
      clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.1, specularIntensity: 1,
      attenuationColor: new THREE.Color('#fff4e2'), attenuationDistance: 3,
    }),
  );
  bottle.add(glass);

  // the juice — opaque-pass material so the transmissive glass refracts it
  const juice = new THREE.Mesh(
    new RoundedBoxGeometry(BW - 0.3, BH - 0.42, BD - 0.26, 5, 0.08),
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#c46a14'), roughness: 0.16, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.1,
      emissive: new THREE.Color('#8a3800'), emissiveIntensity: 0.5, sheen: 0.6, sheenColor: new THREE.Color('#ffcf85'),
    }),
  );
  juice.position.y = -0.1;
  bottle.add(juice);

  // gold collar + matte black cap
  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.26, 0.16, 48),
    new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#d4ae72'), metalness: 1, roughness: 0.22, clearcoat: 0.5 }),
  );
  collar.position.y = BH / 2 + 0.06;
  bottle.add(collar);

  const cap = new THREE.Mesh(
    new RoundedBoxGeometry(0.92, 0.78, 0.92, 6, 0.1),
    new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#070708'), metalness: 0.1, roughness: 0.38, clearcoat: 0.55, clearcoatRoughness: 0.3, envMapIntensity: 0.55 }),
  );
  cap.position.y = BH / 2 + 0.53;
  bottle.add(cap);

  // cream label on the front face, a hair proud of the glass
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(0.98, 1.15),
    new THREE.MeshStandardMaterial({ map: labelTexture(), roughness: 0.75, metalness: 0 }),
  );
  label.position.set(0, -0.12, BD / 2 + 0.004);
  bottle.add(label);

  const stage = new THREE.Group(); // scroll-driven transforms
  stage.add(bottle);
  scene.add(stage);

  // contact shadow
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 1.6),
    new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, opacity: dark ? 0.9 : 0.45 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -BH / 2 - 0.02;
  stage.add(shadow);

  // coloured rim lights — warm amber left, cool violet right (Apple-style glow on the edges)
  const warm = new THREE.PointLight(0xffa64d, 26, 12, 2); warm.position.set(-3.2, 1.2, -1.2);
  const cool = new THREE.PointLight(0x7a6bff, 22, 12, 2); cool.position.set(3.2, 0.6, -1.4);
  const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(2, 4, 5);
  scene.add(warm, cool, key, new THREE.AmbientLight(0xffffff, 0.15));

  /* state the scroll story animates */
  // intro pose: low and a little small, so the headline sits clear above it
  const state = { rotY: -0.5, rotX: 0, x: 0, y: -0.95, scale: 0.74, capLift: 0, spin: 0 };
  let mx = 0, my = 0, tmx = 0, tmy = 0;
  let visible = true, t0 = performance.now();

  function resize() {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.8 ? 42 : 30;
    camera.updateProjectionMatrix();
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  const onMove = (e) => {
    tmx = (e.clientX / innerWidth) * 2 - 1;
    tmy = (e.clientY / innerHeight) * 2 - 1;
  };
  if (!reduced) addEventListener('pointermove', onMove, { passive: true });

  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(canvas);

  const lerp = (a, b, k) => a + (b - a) * k;
  function tick() {
    if (!visible) return;
    const t = (performance.now() - t0) / 1000;
    mx = lerp(mx, tmx, 0.05); my = lerp(my, tmy, 0.05);
    const idle = reduced ? 0 : t * 0.25;
    stage.rotation.y = lerp(stage.rotation.y, state.rotY + state.spin + idle + mx * 0.35, 0.08);
    stage.rotation.x = lerp(stage.rotation.x, state.rotX + my * 0.12, 0.08);
    stage.position.x = lerp(stage.position.x, state.x, 0.08);
    stage.position.y = lerp(stage.position.y, state.y + (reduced ? 0 : Math.sin(t * 1.1) * 0.06), 0.08);
    const s = lerp(stage.scale.x, state.scale, 0.08);
    stage.scale.setScalar(s);
    cap.position.y = lerp(cap.position.y, BH / 2 + 0.53 + state.capLift, 0.1);
    // keep the rim lights orbiting so highlights travel across the glass
    warm.position.x = -3.2 + Math.sin(t * 0.6) * 0.8;
    cool.position.y = 0.6 + Math.cos(t * 0.5) * 0.7;
    renderer.render(scene, camera);
  }
  gsap.ticker.add(tick);

  if (!reduced) {
    stage.scale.setScalar(0.6);
    stage.position.y = -1.6;
    gsap.from(state, { spin: -Math.PI * 1.2, duration: 2.6, ease: 'expo.out', delay: 0.15 });
  }

  return {
    state,
    destroy() { gsap.ticker.remove(tick); ro.disconnect(); io.disconnect(); removeEventListener('pointermove', onMove); renderer.dispose(); },
  };
}
