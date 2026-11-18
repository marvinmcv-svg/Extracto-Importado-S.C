// Hero scene: the Extracto 100 ml flacon floating in a field of liquid-gold smoke.
// The smoke is a domain-warped fbm shader on a plane behind the bottle, inside the
// same scene — so the transmissive glass genuinely refracts it. The cursor stirs it.
// `state` is tweened by GSAP (scroll); the render loop eases the meshes toward it.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import gsap from 'gsap';

const SMOKE_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const SMOKE_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uMouse;     // -1..1
  uniform float uAspect;
  uniform float uHeat;     // 0..1, scroll-driven intensity
  uniform float uFade;     // 0..1 intro fade

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
    for (int i = 0; i < 6; i++) { v += a * noise(p); p = r * p * 2.03 + 0.17; a *= 0.5; }
    return v;
  }
  void main() {
    vec2 uv = vUv - 0.5;
    uv.x *= uAspect;
    vec2 m = uMouse * vec2(uAspect * 0.5, 0.5);
    float t = uTime * 0.045;
    // swirl around the cursor
    vec2 d = uv - m;
    float infl = exp(-dot(d, d) * 5.0);
    uv += vec2(-d.y, d.x) * infl * 0.35;
    // domain warping (iq)
    vec2 q = vec2(fbm(uv * 1.6 + t), fbm(uv * 1.6 + vec2(5.2, 1.3) - t));
    vec2 r = vec2(fbm(uv * 1.6 + 3.5 * q + vec2(1.7, 9.2) + t * 1.4), fbm(uv * 1.6 + 3.5 * q + vec2(8.3, 2.8) - t * 1.2));
    float f = fbm(uv * 1.6 + 3.2 * r);
    // palette: ink black -> umber -> amber -> pale gold
    vec3 ink = vec3(0.020, 0.015, 0.012);
    vec3 umber = vec3(0.16, 0.075, 0.025);
    vec3 amber = vec3(0.78, 0.43, 0.12);
    vec3 gold = vec3(1.0, 0.86, 0.58);
    float k = smoothstep(0.32, 1.02, f * f * 1.5 + length(r) * 0.2);
    vec3 col = mix(ink, umber, smoothstep(0.0, 0.5, k));
    col = mix(col, amber, smoothstep(0.5, 0.9, k) * (0.6 + 0.5 * uHeat));
    col = mix(col, gold, pow(smoothstep(0.8, 1.0, k), 2.0) * (0.4 + infl * 0.7));
    // vignette + darken the top for the nav and left for the copy
    vec2 v = vUv - 0.5;
    col *= 1.0 - dot(v, v) * 1.5;
    col *= 0.28 + 0.72 * smoothstep(0.05, 0.75, vUv.x + 0.15 * vUv.y);
    // film grain
    col += (hash(vUv * 900.0 + uTime) - 0.5) * 0.035;
    gl_FragColor = vec4(col * uFade, 1.0);
  }
`;

function labelTexture() {
  const W = 512, H = 600;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const draw = () => {
    g.fillStyle = '#efe5d2';
    g.fillRect(0, 0, W, H);
    for (let i = 0; i < 2600; i++) {
      g.fillStyle = `rgba(90,70,40,${Math.random() * 0.05})`;
      g.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5);
    }
    g.strokeStyle = '#a88f62'; g.lineWidth = 3; g.strokeRect(22, 22, W - 44, H - 44);
    g.lineWidth = 1; g.strokeRect(34, 34, W - 68, H - 68);
    g.fillStyle = '#231c14'; g.textAlign = 'center';
    g.font = '500 62px Cinzel, "Times New Roman", serif';
    g.fillText('EXTRACTO', W / 2, 238);
    g.font = '600 20px "Manrope", Helvetica, Arial, sans-serif';
    g.save(); g.letterSpacing = '10px'; g.fillText('IMPORTADO', W / 2 + 5, 280); g.restore();
    g.fillStyle = '#b0732a'; g.fillRect(W / 2 - 40, 312, 80, 2);
    g.fillStyle = '#231c14';
    g.font = '600 17px "Manrope", Helvetica, Arial, sans-serif';
    g.save(); g.letterSpacing = '6px'; g.fillText('PARFUM · 100 ML', W / 2 + 3, 470); g.restore();
  };
  draw();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  document.fonts?.load('500 62px Cinzel').then(() => { draw(); tex.needsUpdate = true; }).catch(() => {});
  return tex;
}

export function initBottle3D(canvas, { reduced = false } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  const small = matchMedia('(max-width: 760px)').matches;
  renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.5 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x050403, 1);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.5;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  camera.position.set(0, 0.3, 8.6);
  camera.lookAt(0, 0.25, 0);
  scene.add(camera);

  /* ── liquid-gold backdrop (child of the camera so it always fills the frame) ── */
  const uniforms = {
    uTime: { value: 0 }, uMouse: { value: new THREE.Vector2(0.4, 0) }, uAspect: { value: 1 },
    uHeat: { value: 0 }, uFade: { value: 0 },
  };
  const BACK_Z = 16;
  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.ShaderMaterial({ vertexShader: SMOKE_VERT, fragmentShader: SMOKE_FRAG, uniforms, depthWrite: false, toneMapped: false }),
  );
  backdrop.position.z = -BACK_Z;
  backdrop.renderOrder = -1;
  camera.add(backdrop);

  /* ── the flacon ── */
  const bottle = new THREE.Group();
  const BW = 1.6, BH = 1.9, BD = 1.0;
  const glass = new THREE.Mesh(
    new RoundedBoxGeometry(BW, BH, BD, 8, 0.14),
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff, metalness: 0, roughness: 0.03, transmission: 1, thickness: 1.1, ior: 1.52,
      clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.2, specularIntensity: 1,
      attenuationColor: new THREE.Color('#fff1da'), attenuationDistance: 2.5, dispersion: 0.25,
    }),
  );
  bottle.add(glass);
  const juice = new THREE.Mesh(
    new RoundedBoxGeometry(BW - 0.3, BH - 0.42, BD - 0.26, 5, 0.08),
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#c46a14'), roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.1,
      emissive: new THREE.Color('#8a3800'), emissiveIntensity: 0.55, sheen: 0.6, sheenColor: new THREE.Color('#ffcf85'),
    }),
  );
  juice.position.y = -0.1;
  bottle.add(juice);
  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.26, 0.16, 48),
    new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#d4ae72'), metalness: 1, roughness: 0.2, clearcoat: 0.5 }),
  );
  collar.position.y = BH / 2 + 0.06;
  bottle.add(collar);
  const cap = new THREE.Mesh(
    new RoundedBoxGeometry(0.92, 0.78, 0.92, 6, 0.1),
    new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#070708'), metalness: 0.1, roughness: 0.38, clearcoat: 0.55, clearcoatRoughness: 0.3, envMapIntensity: 0.55 }),
  );
  cap.position.y = BH / 2 + 0.53;
  bottle.add(cap);
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(0.98, 1.15),
    new THREE.MeshStandardMaterial({ map: labelTexture(), roughness: 0.75 }),
  );
  label.position.set(0, -0.12, BD / 2 + 0.004);
  bottle.add(label);

  const stage = new THREE.Group();
  stage.add(bottle);
  scene.add(stage);

  // warm key + amber rim + cool counter-rim
  const key = new THREE.DirectionalLight(0xfff2dd, 1.6); key.position.set(2, 4, 5);
  const warm = new THREE.PointLight(0xff9a3c, 30, 12, 2); warm.position.set(-3.2, 1.2, -1.2);
  const cool = new THREE.PointLight(0xffe1a8, 18, 12, 2); cool.position.set(3.2, 0.6, -1.4);
  scene.add(key, warm, cool, new THREE.AmbientLight(0xffffff, 0.12));

  const state = { rotY: -0.5, rotX: 0, x: 0, y: -0.2, scale: 0.92, capLift: 0, spin: 0, heat: 0 };
  let mx = 0.4, my = 0, tmx = 0.4, tmy = 0;
  let visible = true;
  const t0 = performance.now();

  function resize() {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.8 ? 40 : 30;
    camera.updateProjectionMatrix();
    const hh = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * BACK_Z;
    backdrop.scale.set(hh * camera.aspect * 1.02, hh * 1.02, 1);
    uniforms.uAspect.value = camera.aspect;
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  const onMove = (e) => {
    tmx = (e.clientX / innerWidth) * 2 - 1;
    tmy = -((e.clientY / innerHeight) * 2 - 1);
  };
  if (!reduced) addEventListener('pointermove', onMove, { passive: true });
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(canvas);

  const lerp = (a, b, k) => a + (b - a) * k;
  function tick() {
    if (!visible) return;
    const t = (performance.now() - t0) / 1000;
    mx = lerp(mx, tmx, 0.04); my = lerp(my, tmy, 0.04);
    uniforms.uTime.value = reduced ? 20 : t;
    uniforms.uMouse.value.set(mx, my);
    uniforms.uHeat.value = lerp(uniforms.uHeat.value, state.heat, 0.08);
    const idle = reduced ? 0 : t * 0.22;
    stage.rotation.y = lerp(stage.rotation.y, state.rotY + state.spin + idle + mx * 0.3, 0.07);
    stage.rotation.x = lerp(stage.rotation.x, state.rotX - my * 0.1, 0.07);
    stage.position.x = lerp(stage.position.x, state.x, 0.07);
    stage.position.y = lerp(stage.position.y, state.y + (reduced ? 0 : Math.sin(t * 1.1) * 0.07), 0.07);
    stage.scale.setScalar(lerp(stage.scale.x, state.scale, 0.07));
    cap.position.y = lerp(cap.position.y, BH / 2 + 0.53 + state.capLift, 0.1);
    warm.position.x = -3.2 + Math.sin(t * 0.6) * 0.8;
    cool.position.y = 0.6 + Math.cos(t * 0.5) * 0.7;
    renderer.render(scene, camera);
  }
  gsap.ticker.add(tick);

  // intro: smoke fades up, bottle rises out of it spinning
  stage.scale.setScalar(0.5);
  stage.position.y = -2.4;
  const intro = gsap.timeline({ paused: true })
    .to(uniforms.uFade, { value: 1, duration: 2.4, ease: 'power2.out' }, 0)
    .from(state, { spin: -Math.PI * 1.5, duration: 2.8, ease: 'expo.out' }, 0.2);

  return {
    state,
    play: () => (reduced ? intro.progress(1) : intro.play()),
    destroy() { gsap.ticker.remove(tick); ro.disconnect(); io.disconnect(); removeEventListener('pointermove', onMove); renderer.dispose(); },
  };
}
