// WebGL 360° gallery: a slowly turning ring of curved cards (real catalog photos) with a
// glossy floor reflection. Drag to spin, hover to tilt, scroll to push it away.
import * as THREE from 'three';
import gsap from 'gsap';

export function initHero3D(canvas, items, { onFront, onPick, reduced = false, bg = '#000000' } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const BG = new THREE.Color(bg);
  scene.fog = new THREE.Fog(BG, 8, 17);

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  const N = items.length;
  const W = 2.7, H = W * (440 / 760);
  const R = (N * W * 1.12) / (Math.PI * 2);
  const step = (Math.PI * 2) / N;

  const root = new THREE.Group();       // mouse tilt + scroll
  const ring = new THREE.Group();       // rotation
  const mirror = new THREE.Group();     // reflection ring
  root.add(ring, mirror);
  scene.add(root);
  root.rotation.x = 0.06;

  const geo = new THREE.PlaneGeometry(W, H, 32, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const th = x / R;
    pos.setX(i, Math.sin(th) * R);
    pos.setZ(i, Math.cos(th) * R - R);
  }
  geo.computeVertexNormals();

  const loader = new THREE.TextureLoader();
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const cards = items.map((it, i) => {
    const tex = loader.load(it.img, () => { tex.needsUpdate = true; });
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(8, maxAniso);
    const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.FrontSide, transparent: true, opacity: 1 });
    const mesh = new THREE.Mesh(geo, mat);
    const phi = i * step;
    mesh.position.set(Math.sin(phi) * R, 0, Math.cos(phi) * R);
    mesh.rotation.y = phi;
    mesh.userData = { i, id: it.id };
    ring.add(mesh);

    const rmat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, transparent: true, opacity: 0.16, depthWrite: false });
    const rmesh = new THREE.Mesh(geo, rmat);
    rmesh.position.copy(mesh.position);
    rmesh.rotation.y = phi;
    mirror.add(rmesh);
    return { mesh, rmesh };
  });
  mirror.scale.y = -1;
  mirror.position.y = -H - 0.08;

  // soft floor fade (darkens the reflection toward the back)
  const floorMat = new THREE.MeshBasicMaterial({ color: BG, transparent: true, opacity: 0.55, depthWrite: false });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -H / 2 - 0.04;
  root.add(floor);

  /* state */
  let rot = 0, vel = 0, auto = reduced ? 0 : 0.0016;
  let dragging = false, lastX = 0, moved = 0;
  let mx = 0, my = 0, tmx = 0, tmy = 0;
  let scrollP = 0;
  let front = -1;
  let visible = true;

  function resize() {
    const { clientWidth: w, clientHeight: h } = canvas;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const portrait = w / h < 1;
    camera.fov = portrait ? 44 : 32;
    camera.position.set(0, portrait ? 0.9 : 0.75, R + (portrait ? 7.4 : 8.2));
    camera.lookAt(0, portrait ? -0.1 : 0.05, R - 2);
    camera.updateProjectionMatrix();
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  /* interaction */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hit = (e) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray.intersectObjects(ring.children)[0]?.object;
  };
  canvas.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; moved = 0; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    tmx = ((e.clientX - r.left) / r.width) * 2 - 1;
    tmy = ((e.clientY - r.top) / r.height) * 2 - 1;
    if (dragging) {
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      moved += Math.abs(dx);
      vel = dx * 0.0042;
      rot += vel;
    } else if (e.pointerType === 'mouse') {
      canvas.style.cursor = hit(e) ? 'pointer' : 'grab';
    }
  });
  const up = (e) => {
    if (!dragging) return;
    dragging = false;
    if (moved < 6) {
      const o = hit(e);
      if (o) {
        const i = o.userData.i;
        if (i === front) onPick?.(o.userData.id);
        else goTo(i);
      }
    }
  };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', () => { dragging = false; });
  canvas.addEventListener('pointerleave', () => { tmx = 0; tmy = 0; });

  function goTo(i) {
    // shortest rotation so card i faces the camera (front angle = -i*step)
    let target = -i * step;
    const d = ((target - rot) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
    target = rot + d;
    vel = 0;
    gsap.to({ v: rot }, { v: target, duration: 1.1, ease: 'expo.out', onUpdate() { rot = this.targets()[0].v; } });
  }

  /* loop */
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(canvas);

  function tick() {
    if (!visible) return;
    if (!dragging) { vel *= 0.94; rot += vel - auto; }
    ring.rotation.y = rot;
    mirror.rotation.y = rot;
    mx += (tmx - mx) * 0.05;
    my += (tmy - my) * 0.05;
    root.rotation.y = mx * 0.12;
    root.rotation.x = 0.06 + my * 0.05 + scrollP * 0.25;
    root.position.y = scrollP * 1.6;
    root.position.z = -scrollP * 3;

    // which card faces the camera?
    const n = ((Math.round(-rot / step) % N) + N) % N;
    if (n !== front) { front = n; onFront?.(items[n], n); }
    cards.forEach(({ mesh, rmesh }, i) => {
      const s = i === front ? 1.08 : 1;
      mesh.scale.x += (s - mesh.scale.x) * 0.08;
      mesh.scale.y += (s - mesh.scale.y) * 0.08;
      rmesh.scale.copy(mesh.scale);
    });
    renderer.render(scene, camera);
  }
  gsap.ticker.add(tick);

  // intro
  if (!reduced) {
    rot = -1.4;
    gsap.from(root.scale, { x: 0.7, y: 0.7, z: 0.7, duration: 2.2, ease: 'expo.out', delay: 0.2 });
    gsap.to({ v: -1.4 }, { v: 0, duration: 2.4, ease: 'expo.out', delay: 0.2, onUpdate() { rot = this.targets()[0].v; } });
  }

  return {
    setScroll(p) { scrollP = p; },
    next() { goTo((front + 1) % N); },
    prev() { goTo((front - 1 + N) % N); },
    destroy() { gsap.ticker.remove(tick); ro.disconnect(); io.disconnect(); renderer.dispose(); },
  };
}
