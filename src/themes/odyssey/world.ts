/**
 * Odyssey world — a daylit, scroll-cinematic 3D journey across a grassy
 * valley. Seven stops, each themed to a resume chapter:
 *
 *   0  Hillside letters   — giant white LEVAN / BEROSHVILI on the lawn
 *   1  Garden dev studio  — pergola deck, triple monitors, striped sun shadows
 *   2  Glass server hall  — racks of blinking LEDs behind reflective glass
 *   3  Guitar deck        — black Strat + amp on a wooden stage
 *   4  Garage             — the real car timeline; door tilts open in the sun
 *   5  Snow field         — Jones Frontier board in real snow, falling flakes
 *   6  Cliff villa        — infinity pool deck on a plateau, fire bowl, helipad
 *
 * Realism comes from light, not geometry: a real HDRI sky drives both the
 * background and PBR reflections (clearcoat car paint, glass, water), a
 * directional sun casts soft shadows everywhere and follows the camera so
 * the 2k shadow map stays sharp, and the ground/snow/wood/concrete wear
 * actual photo textures (CC0, Poly Haven). Geometry is still procedural.
 */

import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

export const CHAPTERS = 7;

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/* Camera waypoints (one per chapter) and what the camera looks at there. */
const CAM_POINTS = [
  v(0, 3.6, 22),
  v(-16, 3.2, -30),
  v(8, 2.9, -76),
  v(-16, 2.6, -120),
  v(14, 4.4, -152.5),
  v(-16, 4.4, -209),
  v(-4, 13.2, -253),
];
const TARGET_POINTS = [
  v(0, 2.4, 0),
  v(-16, 1.9, -40),
  v(8, 2.0, -90),
  v(-16, 1.8, -130),
  v(14, 0.8, -174),
  v(-16, 2.6, -221),
  v(2, 10.6, -271),
];

const STOP = {
  sign: v(0, 0, 0),
  dev: v(-16, 0, -40),
  corridor: v(8, 0, -88),
  guitar: v(-16, 0, -130),
  garage: v(14, 0, -175),
  snow: v(-16, 1.2, -221),
  roof: v(0, 9, -270),
};

/* Flat pads carved into the rolling terrain, one per scene. */
const PADS = [
  { x: 0, z: 0, h: 0, r: 18 },
  { x: -16, z: -40, h: 0, r: 14 },
  { x: 8, z: -88, h: 0, r: 16 },
  { x: -16, z: -130, h: 0, r: 13 },
  { x: 14, z: -175, h: 0, r: 17 },
  { x: -16, z: -221, h: 1.2, r: 17 },
  { x: 0, z: -270, h: 9, r: 24 },
];

function clamp01(x: number) {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

function bell(f: number, i: number) {
  return Math.max(0, 1 - Math.abs(f - i));
}

function flicker(time: number, seed: number) {
  const x = Math.sin(time * 31.7 + seed * 91.3) * 43758.5453;
  return x - Math.floor(x) > 0.42 ? 1 : 0.15;
}

/** Rolling-hills height field; amplitude grows toward the valley walls. */
function hills(x: number, z: number) {
  const base =
    2.0 * Math.sin(x * 0.045) * Math.cos(z * 0.038) +
    1.3 * Math.sin(x * 0.11 + 1.7) * Math.sin(z * 0.07) +
    0.5 * Math.sin(x * 0.23) * Math.cos(z * 0.19);
  const wall = 1 + clamp01((Math.abs(x) - 55) / 60) * 4.5;
  return base * wall;
}

function terrainHeight(x: number, z: number) {
  let padW = 0;
  let padH = 0;
  for (const p of PADS) {
    const d = Math.hypot(x - p.x, z - p.z);
    const t = smoothstep(clamp01(1 - d / (p.r * 2.1)));
    if (t > padW) {
      padW = t;
      padH = p.h;
    }
  }
  return hills(x, z) * (1 - padW) + padH * padW;
}

/* ── Canvas texture helpers ────────────────────────────────────────────── */

function canvasTexture(
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D) => void
) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext("2d")!);
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

function codeTexture(hue: number) {
  return canvasTexture(256, 160, (ctx) => {
    ctx.fillStyle = "#10151c";
    ctx.fillRect(0, 0, 256, 160);
    const colors = [
      `hsl(${hue}, 90%, 65%)`,
      `hsl(${(hue + 60) % 360}, 80%, 70%)`,
      `hsl(${(hue + 160) % 360}, 75%, 68%)`,
      "#8b95a5",
    ];
    let y = 10;
    while (y < 152) {
      let x = 8 + (Math.random() < 0.3 ? 16 : 0);
      const segs = 2 + Math.floor(Math.random() * 4);
      for (let s = 0; s < segs && x < 230; s++) {
        const w = 14 + Math.random() * 44;
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.globalAlpha = 0.85;
        ctx.fillRect(x, y, Math.min(w, 240 - x), 5);
        x += w + 8;
      }
      y += 11;
    }
    ctx.globalAlpha = 1;
  });
}

function boardTexture() {
  return canvasTexture(256, 1024, (ctx) => {
    const grad = ctx.createLinearGradient(0, 0, 0, 1024);
    grad.addColorStop(0, "#0d1b3d");
    grad.addColorStop(0.55, "#1d3f6e");
    grad.addColorStop(1, "#cfe5f2");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 1024);
    ctx.fillStyle = "#0a1530";
    ctx.beginPath();
    ctx.moveTo(0, 660);
    ctx.lineTo(50, 560);
    ctx.lineTo(95, 640);
    ctx.lineTo(150, 520);
    ctx.lineTo(205, 630);
    ctx.lineTo(256, 570);
    ctx.lineTo(256, 720);
    ctx.lineTo(0, 720);
    ctx.fill();
    ctx.fillStyle = "#f4f9ff";
    ctx.font = "bold 64px Arial";
    ctx.textAlign = "center";
    ctx.fillText("JONES", 128, 160);
    ctx.font = "26px Arial";
    ctx.fillText("FRONTIER", 128, 205);
    ctx.font = "20px Arial";
    ctx.fillStyle = "#9fc3e8";
    ctx.fillText("2025", 128, 980);
  });
}

function helipadTexture() {
  return canvasTexture(256, 256, (ctx) => {
    ctx.clearRect(0, 0, 256, 256);
    ctx.strokeStyle = "#39424e";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(128, 128, 100, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = "bold 130px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#39424e";
    ctx.fillText("H", 128, 136);
  });
}

function labelTexture(text: string) {
  return canvasTexture(256, 64, (ctx) => {
    ctx.clearRect(0, 0, 256, 64);
    ctx.font = "italic bold 42px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#e8e2d2";
    ctx.fillText(text, 128, 32);
  });
}

/** Georgian license plate — white field, blue GE band, black characters. */
function plateTexture(text: string) {
  return canvasTexture(256, 56, (ctx) => {
    ctx.fillStyle = "#f4f4f0";
    ctx.fillRect(0, 0, 256, 56);
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 252, 52);
    ctx.fillStyle = "#1f4fa8";
    ctx.fillRect(2, 2, 34, 52);
    ctx.fillStyle = "#ffd966";
    ctx.font = "bold 13px Arial";
    ctx.textAlign = "center";
    ctx.fillText("★", 19, 22);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px Arial";
    ctx.fillText("GE", 19, 44);
    ctx.fillStyle = "#15151a";
    ctx.font = "bold 30px Arial";
    ctx.textAlign = "center";
    ctx.fillText(text, 146, 40);
  });
}

/** Painted floor plaque under each car. */
function plaqueTexture(text: string) {
  return canvasTexture(256, 64, (ctx) => {
    ctx.clearRect(0, 0, 256, 64);
    ctx.fillStyle = "rgba(244, 246, 248, 0.9)";
    ctx.beginPath();
    ctx.roundRect(4, 6, 248, 52, 10);
    ctx.fill();
    ctx.font = "bold 30px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#222a36";
    ctx.fillText(text, 128, 33);
  });
}

/* ── Small mesh helpers ────────────────────────────────────────────────── */

function box(
  w: number,
  h: number,
  d: number,
  mat: THREE.Material,
  x = 0,
  y = 0,
  z = 0
) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  return m;
}

function roundedRectShape(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/* ── World ─────────────────────────────────────────────────────────────── */

export interface OdysseyWorld {
  setScroll(progress: number): void;
  setMouse(nx: number, ny: number): void;
  dispose(): void;
}

export function createOdysseyWorld(
  mount: HTMLElement,
  opts: { reducedMotion: boolean }
): OdysseyWorld {
  const lowPower = window.innerWidth < 768;
  let w = window.innerWidth;
  let h = window.innerHeight;

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1 : 1.5));
  renderer.setSize(w, h);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xcfe2f2); // until the HDRI arrives
  scene.fog = new THREE.Fog(0xdfeaf2, 110, 430);

  const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 800);
  camera.position.copy(CAM_POINTS[0]);

  /* Subtle bloom — just sun glints on chrome/water, not a glow machine. */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.14, 0.4, 1.0);
  composer.addPass(bloom);

  const disposables: Array<{ dispose(): void }> = [renderer, composer];
  const track = <T extends { dispose(): void }>(o: T): T => {
    disposables.push(o);
    return o;
  };

  /* ── Sky + image-based lighting ── */
  new RGBELoader().load("/world/sky.hdr", (tex) => {
    tex.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = tex;
    scene.environment = tex;
    track(tex);
  });

  /* ── Sun + sky fill ── */
  const sun = new THREE.DirectionalLight(0xfff3e0, 3.4);
  sun.castShadow = true;
  sun.shadow.mapSize.setScalar(lowPower ? 1024 : 2048);
  sun.shadow.camera.left = -30;
  sun.shadow.camera.right = 30;
  sun.shadow.camera.top = 30;
  sun.shadow.camera.bottom = -30;
  sun.shadow.camera.near = 10;
  sun.shadow.camera.far = 160;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(0xbcd8f5, 0x7a8b66, 0.55);
  scene.add(hemi);

  /* ── Textures ── */
  const tl = new THREE.TextureLoader();
  const loadTex = (url: string, repeat: number, srgb: boolean) => {
    const t = tl.load(url);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat, repeat);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return track(t);
  };
  const grassD = loadTex("/world/grass_diff.jpg", 60, true);
  const grassN = loadTex("/world/grass_nor.jpg", 60, false);
  const snowD = loadTex("/world/snow_diff.jpg", 7, true);
  const snowN = loadTex("/world/snow_nor.jpg", 7, false);
  const concreteD = loadTex("/world/concrete_diff.jpg", 3, true);
  const woodD = loadTex("/world/wood_diff.jpg", 2.5, true);

  /* ── Shared materials ── */
  const matWood = track(
    new THREE.MeshStandardMaterial({ map: woodD, roughness: 0.7 })
  );
  const matConcrete = track(
    new THREE.MeshStandardMaterial({ map: concreteD, roughness: 0.85 })
  );
  const matWhite = track(
    new THREE.MeshStandardMaterial({ color: 0xf2f3f0, roughness: 0.55 })
  );
  const matDark = track(
    new THREE.MeshStandardMaterial({ color: 0x23262d, roughness: 0.5, metalness: 0.4 })
  );
  const matMetal = track(
    new THREE.MeshStandardMaterial({ color: 0x6a7077, roughness: 0.3, metalness: 0.9 })
  );
  const matGlass = track(
    new THREE.MeshPhysicalMaterial({
      color: 0xcfe6ee,
      roughness: 0.05,
      metalness: 0,
      transparent: true,
      opacity: 0.16,
      envMapIntensity: 1.4,
    })
  );
  const basic = (color: number, opacity = 1) =>
    track(
      new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity })
    );
  /** Decals / glass / particles shouldn't block the sun. */
  const noShadow = (m: THREE.Object3D) => {
    m.userData.noShadow = true;
    return m;
  };

  /* ── Terrain ── */
  {
    const SEG = lowPower ? 96 : 150;
    const geo = track(new THREE.PlaneGeometry(440, 520, SEG, SEG));
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i) - 140; // recenter strip over the journey
      pos.setZ(i, z);
      pos.setY(i, terrainHeight(x, z));
    }
    geo.computeVertexNormals();
    const terrain = new THREE.Mesh(
      geo,
      track(
        new THREE.MeshStandardMaterial({
          map: grassD,
          normalMap: grassN,
          roughness: 0.95,
        })
      )
    );
    terrain.receiveShadow = true;
    terrain.userData.noShadow = true; // receives but doesn't cast
    scene.add(terrain);
  }

  /* Distant peaks — pushed deep into the fog so they read as hazy ridges */
  {
    const peakMat = track(
      new THREE.MeshStandardMaterial({ color: 0x93a9bd, roughness: 1, flatShading: true })
    );
    for (const [px, pz, ph, pr] of [
      [-260, -120, 85, 150], [280, -220, 95, 170], [-290, -300, 80, 160], [260, -20, 70, 140],
    ]) {
      const peak = new THREE.Mesh(new THREE.ConeGeometry(pr, ph, 7), peakMat);
      peak.position.set(px, ph / 2 - 18, pz);
      noShadow(peak);
      scene.add(peak);
    }
  }

  /* Scattered pines along the valley (clear of the camera path) */
  const pineLeaf = track(
    new THREE.MeshStandardMaterial({ color: 0x2e5d3a, roughness: 0.9, flatShading: true })
  );
  const pineTrunk = track(
    new THREE.MeshStandardMaterial({ color: 0x4a3826, roughness: 0.9 })
  );
  const addPine = (x: number, z: number, s: number, snowy = false) => {
    const y = terrainHeight(x, z);
    const g = new THREE.Group();
    g.add(box(0.22 * s, 0.9 * s, 0.22 * s, pineTrunk, 0, 0.45 * s, 0));
    const c1 = new THREE.Mesh(new THREE.ConeGeometry(1.0 * s, 1.9 * s, 7), pineLeaf);
    c1.position.y = 1.7 * s;
    const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.7 * s, 1.5 * s, 7), pineLeaf);
    c2.position.y = 2.7 * s;
    g.add(c1, c2);
    if (snowy) {
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.45 * s, 0.7 * s, 7), matWhite);
      cap.position.y = 3.25 * s;
      g.add(cap);
    }
    g.position.set(x, y, z);
    scene.add(g);
  };
  {
    let seed = 7;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < (lowPower ? 18 : 38); i++) {
      const side = rand() < 0.5 ? -1 : 1;
      const x = side * (30 + rand() * 55);
      const z = 20 - rand() * 330;
      addPine(x, z, 0.9 + rand() * 1.3, z < -195 && z > -250);
    }
  }

  /* ════ 0 · HILLSIDE LETTERS ════ */
  const lettersGroup = new THREE.Group();
  lettersGroup.position.copy(STOP.sign);
  scene.add(lettersGroup);
  const letterMat = track(
    new THREE.MeshStandardMaterial({ color: 0xd9d7cd, roughness: 0.65 })
  );
  new FontLoader().load("/world/font.json", (font) => {
    const make = (text: string, size: number, z: number) => {
      const geo = new TextGeometry(text, {
        font,
        size,
        depth: size * 0.24,
        curveSegments: 5,
        bevelEnabled: true,
        bevelThickness: size * 0.018,
        bevelSize: size * 0.014,
        bevelSegments: 2,
      });
      geo.computeBoundingBox();
      const bb = geo.boundingBox!;
      geo.translate(-(bb.max.x + bb.min.x) / 2, 0, 0);
      track(geo);
      const mesh = new THREE.Mesh(geo, letterMat);
      mesh.position.set(0, 0, z);
      lettersGroup.add(mesh);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    };
    make("LEVAN", 3.1, -3.0);
    make("BEROSHVILI", 1.3, 4.8);
  });

  /* ════ 1 · GARDEN DEV STUDIO ════ */
  const dev = new THREE.Group();
  dev.position.copy(STOP.dev);
  const monitorMats: THREE.MeshBasicMaterial[] = [];
  {
    // wooden deck + pergola whose slats throw striped shadows
    dev.add(box(9, 0.25, 7, matWood, 0, 0.12, 0));
    for (const [px, pz] of [[-4.2, -3.2], [4.2, -3.2], [-4.2, 3.2], [4.2, 3.2]]) {
      dev.add(box(0.22, 3.4, 0.22, matWood, px, 1.95, pz));
    }
    for (let i = 0; i < 9; i++) {
      dev.add(box(9.4, 0.07, 0.22, matWood, 0, 3.7, -3.2 + i * 0.8));
    }
    dev.add(box(0.16, 0.16, 7.0, matWood, -4.2, 3.62, 0));
    dev.add(box(0.16, 0.16, 7.0, matWood, 4.2, 3.62, 0));

    const deskTop = box(5.6, 0.14, 2.2, matWood, 0, 1.45, -1.2);
    dev.add(deskTop);
    for (const [lx, lz] of [[-2.5, -2.0], [2.5, -2.0], [-2.5, -0.4], [2.5, -0.4]]) {
      dev.add(box(0.1, 1.4, 0.1, matMetal, lx, 0.7, lz));
    }
    for (let i = -1; i <= 1; i++) {
      const tex = track(codeTexture(i === -1 ? 200 : i === 0 ? 160 : 280));
      const mat = track(new THREE.MeshBasicMaterial({ map: tex }));
      monitorMats.push(mat);
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.0), mat);
      screen.position.set(i * 1.7, 2.35, -1.7 + Math.abs(i) * 0.16);
      screen.rotation.y = -i * 0.36;
      noShadow(screen);
      const back = box(1.66, 1.06, 0.06, matDark, 0, 0, 0);
      back.position.copy(screen.position);
      back.position.z -= 0.045;
      back.rotation.copy(screen.rotation);
      const stand = box(0.09, 0.42, 0.09, matMetal, i * 1.7, 1.66, -1.66);
      dev.add(screen, back, stand);
    }
    dev.add(box(1.5, 0.05, 0.5, matDark, 0, 1.55, -0.7)); // keyboard
    const mug = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 0.2, 12),
      track(new THREE.MeshStandardMaterial({ color: 0xc8472e, roughness: 0.4 }))
    );
    mug.position.set(1.35, 1.62, -0.6);
    dev.add(mug);
    // chair
    dev.add(box(0.85, 0.1, 0.85, matDark, 0, 0.85, 0.6));
    dev.add(box(0.85, 1.0, 0.1, matDark, 0, 1.45, 1.05));
    dev.add(box(0.09, 0.8, 0.09, matMetal, 0, 0.4, 0.6));
    // potted plant
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.22, 0.45, 10),
      track(new THREE.MeshStandardMaterial({ color: 0xb06a3c, roughness: 0.8 }))
    );
    pot.position.set(-3.4, 0.45, -2.4);
    const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), pineLeaf);
    bush.position.set(-3.4, 1.05, -2.4);
    dev.add(pot, bush);
  }
  scene.add(dev);
  const monLight = new THREE.PointLight(0x6fb0ff, 0, 7);
  monLight.position.copy(STOP.dev).add(v(0, 2.3, -0.4));
  scene.add(monLight);

  /* ════ 2 · GLASS SERVER HALL ════ */
  const corridor = new THREE.Group();
  corridor.position.copy(STOP.corridor);
  const leds: Array<{ mesh: THREE.Mesh; phase: number; speed: number }> = [];
  {
    corridor.add(box(12, 0.25, 26, matConcrete, 0, 0.12, 0));
    // glass walls + roof on a steel frame
    const wallL = box(0.08, 3.6, 26, matGlass, -6, 2.05, 0);
    const wallR = box(0.08, 3.6, 26, matGlass, 6, 2.05, 0);
    const roofG = box(12, 0.08, 26, matGlass, 0, 3.9, 0);
    noShadow(wallL); noShadow(wallR); noShadow(roofG);
    corridor.add(wallL, wallR, roofG);
    for (let i = 0; i < 5; i++) {
      const z = -12 + i * 6;
      corridor.add(box(0.18, 3.8, 0.18, matMetal, -6, 2, z));
      corridor.add(box(0.18, 3.8, 0.18, matMetal, 6, 2, z));
      corridor.add(box(12.2, 0.18, 0.18, matMetal, 0, 3.95, z));
    }
    const ledMats = [basic(0x18e06a), basic(0x2ab4ff), basic(0xffb347)];
    for (const side of [-1, 1]) {
      for (let r = 0; r < 5; r++) {
        const z = 10 - r * 5.5;
        corridor.add(box(1.5, 2.6, 1.1, matDark, side * 3.6, 1.42, z));
        for (let l = 0; l < 7; l++) {
          const led = new THREE.Mesh(
            new THREE.PlaneGeometry(0.34, 0.045),
            ledMats[Math.floor(Math.random() * 3)]
          );
          led.position.set(side * 2.84, 0.5 + l * 0.32, z - 0.38 + Math.random() * 0.76);
          led.rotation.y = (-side * Math.PI) / 2;
          noShadow(led);
          corridor.add(led);
          leds.push({ mesh: led, phase: Math.random() * 10, speed: 2 + Math.random() * 7 });
        }
      }
    }
  }
  scene.add(corridor);

  /* ════ 3 · GUITAR DECK ════ */
  const stage = new THREE.Group();
  stage.position.copy(STOP.guitar);
  {
    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3.2, 0.3, 36),
      matWood
    );
    platform.position.y = 0.15;
    stage.add(platform);

    const guitar = new THREE.Group();
    const bs = new THREE.Shape();
    bs.moveTo(0, -0.75);
    bs.bezierCurveTo(0.42, -0.75, 0.62, -0.55, 0.6, -0.28);
    bs.bezierCurveTo(0.58, -0.05, 0.42, 0.02, 0.4, 0.16);
    bs.bezierCurveTo(0.38, 0.32, 0.5, 0.42, 0.44, 0.58);
    bs.bezierCurveTo(0.4, 0.7, 0.26, 0.72, 0.2, 0.58);
    bs.bezierCurveTo(0.16, 0.46, 0.12, 0.4, 0, 0.4);
    bs.bezierCurveTo(-0.12, 0.4, -0.16, 0.5, -0.2, 0.66);
    bs.bezierCurveTo(-0.24, 0.84, -0.44, 0.82, -0.46, 0.62);
    bs.bezierCurveTo(-0.48, 0.46, -0.42, 0.32, -0.44, 0.18);
    bs.bezierCurveTo(-0.46, 0.0, -0.62, -0.1, -0.64, -0.35);
    bs.bezierCurveTo(-0.6, -0.62, -0.36, -0.75, 0, -0.75);
    const body = new THREE.Mesh(
      track(
        new THREE.ExtrudeGeometry(bs, {
          depth: 0.09,
          bevelEnabled: true,
          bevelSize: 0.03,
          bevelThickness: 0.03,
          bevelSegments: 3,
        })
      ),
      track(
        new THREE.MeshPhysicalMaterial({
          color: 0x0b0b0e,
          roughness: 0.18,
          metalness: 0.1,
          clearcoat: 1,
          clearcoatRoughness: 0.08,
        })
      )
    );
    guitar.add(body);
    const stripe = new THREE.Mesh(
      track(new THREE.ExtrudeGeometry(roundedRectShape(0.34, 1.0, 0.12), { depth: 0.012, bevelEnabled: false })),
      track(new THREE.MeshStandardMaterial({ color: 0x6e4a22, roughness: 0.55 }))
    );
    stripe.position.set(-0.02, -0.1, 0.123);
    guitar.add(stripe);
    const pickupMat = track(
      new THREE.MeshStandardMaterial({ color: 0x1c1c20, roughness: 0.4, metalness: 0.6 })
    );
    for (let p = 0; p < 3; p++) {
      guitar.add(box(0.2, 0.05, 0.02, pickupMat, -0.02, 0.12 - p * 0.18, 0.135));
    }
    const neckMat = track(
      new THREE.MeshStandardMaterial({ color: 0x8a6a45, roughness: 0.6 })
    );
    guitar.add(box(0.13, 1.5, 0.05, neckMat, -0.02, 1.27, 0.06));
    guitar.add(box(0.13, 1.5, 0.012, track(
      new THREE.MeshStandardMaterial({ color: 0x2c1d12, roughness: 0.6 })
    ), -0.02, 1.27, 0.09));
    guitar.add(box(0.22, 0.4, 0.04, neckMat, 0.02, 2.2, 0.05));
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(0.2, 0.05),
      track(new THREE.MeshBasicMaterial({ map: track(labelTexture("Fender")), transparent: true }))
    );
    label.position.set(0.02, 2.3, 0.075);
    noShadow(label);
    guitar.add(label);
    for (let tn = 0; tn < 6; tn++) {
      const tuner = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.05, 8),
        matMetal
      );
      tuner.rotation.z = Math.PI / 2;
      tuner.position.set(-0.08, 2.04 + tn * 0.062, 0.05);
      guitar.add(tuner);
    }
    const strMat = track(
      new THREE.MeshStandardMaterial({ color: 0xc8c2b2, roughness: 0.3, metalness: 0.9 })
    );
    for (let s2 = 0; s2 < 6; s2++) {
      const str = new THREE.Mesh(
        new THREE.CylinderGeometry(0.003, 0.003, 2.6, 4),
        strMat
      );
      str.position.set(-0.065 + s2 * 0.022, 0.95, 0.1);
      noShadow(str);
      guitar.add(str);
    }
    guitar.position.set(0.3, 1.1, 0.4);
    guitar.rotation.set(-0.16, 0.5, 0);
    guitar.scale.set(1.15, 1.35, 1.35);
    stage.add(guitar);
    stage.add(box(0.06, 1.0, 0.06, matMetal, 0.3, 0.75, 0.16));
    stage.add(box(0.7, 0.06, 0.06, matMetal, 0.3, 0.33, 0.3));
    // amp
    const amp = new THREE.Group();
    amp.add(box(1.1, 0.9, 0.6, matDark, 0, 0.45, 0));
    amp.add(box(0.95, 0.5, 0.02, track(
      new THREE.MeshStandardMaterial({ color: 0x4a4138, roughness: 0.95 })
    ), 0, 0.38, 0.31));
    for (let k = 0; k < 4; k++) {
      const knob = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.035, 0.03, 8),
        matMetal
      );
      knob.rotation.x = Math.PI / 2;
      knob.position.set(-0.3 + k * 0.2, 0.78, 0.32);
      amp.add(knob);
    }
    amp.position.set(-1.6, 0.3, -0.6);
    amp.rotation.y = 0.4;
    stage.add(amp);
  }
  scene.add(stage);

  /* ════ 4 · GARAGE — the actual car timeline ════ */
  const garage = new THREE.Group();
  garage.position.copy(STOP.garage);
  const doorPivot = new THREE.Group();
  let underglowMat!: THREE.MeshBasicMaterial;
  let headlightMatOn!: THREE.MeshBasicMaterial;
  let superCar!: THREE.Group;
  const headlights: THREE.SpotLight[] = [];
  {
    const W = 15, H = 4, D = 9.5;
    garage.add(box(W + 4, 0.22, D + 7, matConcrete, 0, 0.1, 2)); // apron slab
    const wallMat = track(
      new THREE.MeshStandardMaterial({ color: 0xe8e4dc, roughness: 0.85 })
    );
    garage.add(box(W, H, 0.3, wallMat, 0, H / 2, -D / 2));
    garage.add(box(0.3, H, D, wallMat, -W / 2, H / 2, 0));
    garage.add(box(0.3, H, D, wallMat, W / 2, H / 2, 0));
    garage.add(box(W + 0.8, 0.3, D + 0.8, matConcrete, 0, H + 0.1, 0));
    garage.add(box(4, 0.06, 0.18, basic(0xfff2d8), -3.5, H - 0.25, 0.6));
    garage.add(box(4, 0.06, 0.18, basic(0xfff2d8), 3.5, H - 0.25, 0.6));
    doorPivot.position.set(0, H - 0.15, D / 2);
    const door = box(W - 0.7, H - 0.35, 0.12, track(
      new THREE.MeshStandardMaterial({ color: 0x9aa1ab, roughness: 0.4, metalness: 0.7 })
    ), 0, -(H - 0.35) / 2, 0);
    doorPivot.add(door);
    garage.add(doorPivot);

    const glassMat = track(
      new THREE.MeshPhysicalMaterial({
        color: 0x1c2630,
        roughness: 0.05,
        metalness: 0.4,
        envMapIntensity: 1.5,
      })
    );
    const tireMat = track(
      new THREE.MeshStandardMaterial({ color: 0x111114, roughness: 0.92 })
    );
    const rimSilver = track(
      new THREE.MeshStandardMaterial({ color: 0xc6cdd6, roughness: 0.18, metalness: 1 })
    );
    const headlightOff = track(
      new THREE.MeshStandardMaterial({ color: 0xd9dde2, roughness: 0.2, metalness: 0.6 })
    );
    headlightMatOn = track(
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 })
    );

    type CarKind = "sedan04" | "sedan12" | "suv" | "super";
    const profiles: Record<CarKind, () => THREE.Shape> = {
      sedan04: () => {
        const s = new THREE.Shape();
        s.moveTo(-2.0, 0.28);
        s.lineTo(-2.1, 0.62);
        s.quadraticCurveTo(-2.05, 0.88, -1.55, 0.92);
        s.quadraticCurveTo(-1.05, 0.95, -0.8, 1.18);
        s.quadraticCurveTo(-0.3, 1.38, 0.3, 1.36);
        s.quadraticCurveTo(0.85, 1.3, 1.15, 1.0);
        s.quadraticCurveTo(1.45, 0.88, 1.95, 0.84);
        s.quadraticCurveTo(2.2, 0.8, 2.22, 0.52);
        s.lineTo(2.18, 0.28);
        s.lineTo(-2.0, 0.28);
        return s;
      },
      sedan12: () => {
        const s = new THREE.Shape();
        s.moveTo(-2.15, 0.28);
        s.lineTo(-2.25, 0.66);
        s.quadraticCurveTo(-2.15, 0.92, -1.6, 0.95);
        s.quadraticCurveTo(-1.0, 0.98, -0.7, 1.22);
        s.quadraticCurveTo(-0.15, 1.4, 0.45, 1.34);
        s.quadraticCurveTo(1.0, 1.24, 1.3, 0.98);
        s.quadraticCurveTo(1.7, 0.88, 2.2, 0.84);
        s.quadraticCurveTo(2.4, 0.78, 2.42, 0.5);
        s.lineTo(2.38, 0.28);
        s.lineTo(-2.15, 0.28);
        return s;
      },
      suv: () => {
        const s = new THREE.Shape();
        s.moveTo(-2.15, 0.42);
        s.lineTo(-2.28, 0.85);
        s.quadraticCurveTo(-2.26, 1.1, -2.1, 1.25);
        s.lineTo(-1.85, 1.72);
        s.quadraticCurveTo(-1.5, 1.8, -0.6, 1.8);
        s.lineTo(0.9, 1.78);
        s.quadraticCurveTo(1.35, 1.7, 1.65, 1.3);
        s.quadraticCurveTo(2.05, 1.18, 2.35, 1.12);
        s.quadraticCurveTo(2.55, 1.0, 2.55, 0.7);
        s.lineTo(2.45, 0.42);
        s.lineTo(-2.15, 0.42);
        return s;
      },
      super: () => {
        const s = new THREE.Shape();
        s.moveTo(-2.25, 0.22);
        s.lineTo(-2.35, 0.55);
        s.quadraticCurveTo(-2.3, 0.8, -1.9, 0.86);
        s.quadraticCurveTo(-1.2, 0.92, -0.75, 1.18);
        s.quadraticCurveTo(-0.1, 1.32, 0.45, 1.22);
        s.quadraticCurveTo(1.2, 1.0, 1.7, 0.78);
        s.quadraticCurveTo(2.3, 0.62, 2.5, 0.45);
        s.lineTo(2.45, 0.22);
        s.lineTo(-2.25, 0.22);
        return s;
      },
    };

    const buildCar = (carOpts: {
      kind: CarKind;
      color: number;
      plate: string;
      lit?: boolean;
      glow?: boolean;
    }) => {
      const car = new THREE.Group();
      const isSuv = carOpts.kind === "suv";
      const wheelR = isSuv ? 0.46 : 0.4;
      const lift = isSuv ? 0.16 : 0;

      const body = new THREE.Mesh(
        track(
          new THREE.ExtrudeGeometry(profiles[carOpts.kind](), {
            depth: 1.8,
            bevelEnabled: true,
            bevelSize: 0.06,
            bevelThickness: 0.06,
            bevelSegments: 3,
          })
        ),
        track(
          // clearcoat + HDRI reflections = actual car paint
          new THREE.MeshPhysicalMaterial({
            color: carOpts.color,
            roughness: 0.32,
            metalness: 0.85,
            clearcoat: 1,
            clearcoatRoughness: 0.06,
            envMapIntensity: 1.25,
          })
        )
      );
      body.position.set(0, lift, -0.9);
      car.add(body);

      const glassH = isSuv ? 0.45 : 0.32;
      const glassY = isSuv ? 1.45 : carOpts.kind === "super" ? 1.06 : 1.12;
      car.add(box(isSuv ? 2.4 : 1.2, glassH, 1.62, glassMat, -0.2, glassY + lift, 0));
      if (isSuv) {
        car.add(box(2.6, 0.06, 0.08, matDark, -0.4, 1.86 + lift, 0.7));
        car.add(box(2.6, 0.06, 0.08, matDark, -0.4, 1.86 + lift, -0.7));
        car.add(box(4.6, 0.18, 1.92, matDark, 0.1, 0.4 + lift, 0));
      }

      const wx = isSuv ? [-1.5, 1.6] : [-1.45, 1.55];
      for (const x of wx) {
        for (const z of [0.95, -0.95]) {
          const tire = new THREE.Mesh(
            new THREE.CylinderGeometry(wheelR, wheelR, 0.3, 20),
            tireMat
          );
          tire.rotation.x = Math.PI / 2;
          tire.position.set(x, wheelR, z);
          const rim = new THREE.Mesh(
            new THREE.TorusGeometry(wheelR * 0.52, 0.035, 8, 18),
            carOpts.glow ? basic(0x35e0ff) : rimSilver
          );
          rim.position.set(x, wheelR, z + Math.sign(z) * 0.16);
          car.add(tire, rim);
        }
      }

      const noseX = carOpts.kind === "suv" ? 2.6 : carOpts.kind === "sedan04" ? 2.27 : 2.47;
      const lightY = (isSuv ? 0.95 : 0.55) + lift;
      for (const z of [-0.6, 0.6]) {
        const hl = new THREE.Mesh(
          new THREE.PlaneGeometry(0.26, 0.1),
          carOpts.lit || carOpts.glow ? headlightMatOn : headlightOff
        );
        hl.position.set(noseX + 0.01, lightY, z);
        hl.rotation.y = Math.PI / 2;
        noShadow(hl);
        car.add(hl);
        const tail = new THREE.Mesh(
          new THREE.PlaneGeometry(0.22, 0.09),
          track(new THREE.MeshStandardMaterial({ color: 0x801c1c, roughness: 0.3 }))
        );
        tail.position.set(-noseX + (isSuv ? 0.25 : 0.12), lightY + 0.06, z);
        tail.rotation.y = -Math.PI / 2;
        noShadow(tail);
        car.add(tail);
        if (carOpts.lit) {
          const sl = new THREE.SpotLight(0xeef4ff, 0, 24, 0.34, 0.7, 1.6);
          sl.position.set(noseX, lightY, z);
          const slt = new THREE.Object3D();
          slt.position.set(9, -1.2, z * 1.6);
          car.add(sl, slt);
          sl.target = slt;
          headlights.push(sl);
        }
      }

      const pMat = track(
        new THREE.MeshBasicMaterial({ map: track(plateTexture(carOpts.plate)) })
      );
      const front = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.1), pMat);
      front.position.set(noseX + 0.02, (isSuv ? 0.66 : 0.38) + lift, 0);
      front.rotation.y = Math.PI / 2;
      noShadow(front);
      const rear = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.1), pMat);
      rear.position.set(-noseX + (isSuv ? 0.18 : 0.06), (isSuv ? 0.8 : 0.45) + lift, 0);
      rear.rotation.y = -Math.PI / 2;
      noShadow(rear);
      car.add(front, rear);

      if (carOpts.glow) {
        underglowMat = track(
          new THREE.MeshBasicMaterial({
            color: 0x27d8ff,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          })
        );
        const glow = new THREE.Mesh(new THREE.PlaneGeometry(4.9, 2.3), underglowMat);
        glow.rotation.x = -Math.PI / 2;
        glow.position.y = 0.06;
        noShadow(glow);
        car.add(glow);
      }
      return car;
    };

    const lineup = [
      { x: -5.5, plaque: "W203 · 2004", car: buildCar({ kind: "sedan04", color: 0x5a1418, plate: "MA-010-RK" }) },
      { x: -1.85, plaque: "W204 · 2012", car: buildCar({ kind: "sedan12", color: 0x0e0e12, plate: "MA-020-RK" }) },
      { x: 1.85, plaque: "FORESTER · 2022", car: buildCar({ kind: "suv", color: 0x46523a, plate: "MA-030-RK", lit: true }) },
      { x: 5.5, plaque: "NEXT · 20??", car: buildCar({ kind: "super", color: 0x39404e, plate: "MA-040-RK", glow: true }) },
    ];
    for (const { x, plaque, car } of lineup) {
      car.position.set(x, 0.2, -0.6);
      car.rotation.y = -Math.PI / 2 + (Math.random() - 0.5) * 0.06;
      garage.add(car);
      const pl = new THREE.Mesh(
        new THREE.PlaneGeometry(2.0, 0.5),
        track(new THREE.MeshBasicMaterial({ map: track(plaqueTexture(plaque)), transparent: true }))
      );
      pl.rotation.x = -Math.PI / 2;
      pl.position.set(x, 0.23, 3.9);
      noShadow(pl);
      garage.add(pl);
    }
    superCar = lineup[3].car;
  }
  scene.add(garage);
  const garageLight = new THREE.PointLight(0xfff0d8, 0, 26);
  garageLight.position.copy(STOP.garage).add(v(-3.5, 3.4, 2.2));
  const garageLight2 = new THREE.PointLight(0xfff0d8, 0, 26);
  garageLight2.position.copy(STOP.garage).add(v(3.5, 3.4, 2.2));
  scene.add(garageLight, garageLight2);

  /* ════ 5 · SNOW FIELD ════ */
  const snowG = new THREE.Group();
  snowG.position.copy(STOP.snow);
  {
    const snowMat = track(
      new THREE.MeshStandardMaterial({
        map: snowD,
        normalMap: snowN,
        roughness: 0.85,
      })
    );
    const patch = new THREE.Mesh(new THREE.CircleGeometry(16, 36), snowMat);
    patch.rotation.x = -Math.PI / 2;
    patch.position.y = 0.06;
    patch.userData.noShadow = true;
    patch.receiveShadow = true;
    snowG.add(patch);
    for (const [mx, mz, mr] of [[-3, -2, 2.4], [3.4, -4, 3.2], [1.5, 2.5, 1.7], [-6, 3, 2.0]]) {
      const mound = new THREE.Mesh(new THREE.SphereGeometry(mr, 20, 14), snowMat);
      mound.scale.y = 0.3;
      mound.position.set(mx, 0.1, mz);
      snowG.add(mound);
    }
    const board = new THREE.Mesh(
      track(new THREE.ExtrudeGeometry(roundedRectShape(0.62, 2.9, 0.3), { depth: 0.05, bevelEnabled: false })),
      [
        track(new THREE.MeshPhysicalMaterial({
          map: track(boardTexture()),
          roughness: 0.25,
          clearcoat: 0.8,
          clearcoatRoughness: 0.15,
        })),
        track(new THREE.MeshStandardMaterial({ color: 0x101015, roughness: 0.4 })),
      ]
    );
    board.position.set(0, 1.35, 0);
    board.rotation.set(-0.18, 0.35, 0.06);
    snowG.add(board);
    snowG.add(box(0.4, 0.3, 0.1, matDark, -0.06, 1.85, 0.14));
    snowG.add(box(0.4, 0.3, 0.1, matDark, 0.1, 0.95, 0.14));
  }
  scene.add(snowG);
  const SNOW_N = lowPower ? 220 : 520;
  const snowGeo = track(new THREE.BufferGeometry());
  const snowPos = new Float32Array(SNOW_N * 3);
  const snowSpeed = new Float32Array(SNOW_N);
  for (let i = 0; i < SNOW_N; i++) {
    snowPos[i * 3] = STOP.snow.x + (Math.random() - 0.5) * 34;
    snowPos[i * 3 + 1] = STOP.snow.y + Math.random() * 14;
    snowPos[i * 3 + 2] = STOP.snow.z + (Math.random() - 0.5) * 34;
    snowSpeed[i] = 0.7 + Math.random() * 1.3;
  }
  snowGeo.setAttribute("position", new THREE.BufferAttribute(snowPos, 3));
  const snowPts = new THREE.Points(
    snowGeo,
    track(
      new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.08,
        transparent: true,
        opacity: 0.85,
        sizeAttenuation: true,
      })
    )
  );
  noShadow(snowPts);
  scene.add(snowPts);

  /* ════ 6 · CLIFF VILLA DECK ════ */
  const roof = new THREE.Group();
  roof.position.copy(STOP.roof);
  let poolMat!: THREE.MeshPhysicalMaterial;
  {
    const deckMat = track(
      new THREE.MeshStandardMaterial({ map: concreteD, color: 0xe9e9e4, roughness: 0.7 })
    );
    roof.add(box(30, 0.8, 18, deckMat, 0, -0.4, 0));
    // glass railing
    for (const [bx, bz, bw, bd] of [
      [0, -8.8, 30, 0.06], [-14.8, 0, 0.06, 18], [14.8, 0, 0.06, 18],
    ]) {
      const rail = box(bw as number, 1.05, bd as number, matGlass, bx as number, 0.55, bz as number);
      noShadow(rail);
      roof.add(rail);
    }
    // infinity pool — reflective water
    poolMat = track(
      new THREE.MeshPhysicalMaterial({
        color: 0x1583a2,
        roughness: 0.08,
        metalness: 0,
        transparent: true,
        opacity: 0.85,
        envMapIntensity: 0.8,
      })
    );
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), poolMat);
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(-7, 0.08, -4);
    noShadow(pool);
    roof.add(pool);
    roof.add(box(8.5, 0.16, 0.3, matWhite, -7, 0.08, -1.85));
    roof.add(box(8.5, 0.16, 0.3, matWhite, -7, 0.08, -6.15));
    roof.add(box(0.3, 0.16, 4.6, matWhite, -11.4, 0.08, -4));
    roof.add(box(0.3, 0.16, 4.6, matWhite, -2.6, 0.08, -4));
    // villa behind the deck
    const villa = new THREE.Group();
    villa.add(box(13, 4.2, 6, matWhite, 0, 2.1, 0));
    villa.add(box(14.4, 0.3, 7.4, matConcrete, 0, 4.35, 0.3));
    const win = box(11.5, 2.2, 0.1, track(
      new THREE.MeshPhysicalMaterial({
        color: 0x2a3947,
        roughness: 0.04,
        metalness: 0.5,
        envMapIntensity: 1.8,
      })
    ), 0, 2.0, 3.06);
    noShadow(win);
    villa.add(win);
    villa.position.set(4, 0, -12.5);
    roof.add(villa);
    // fire bowl + loungers
    const bowl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.4, 0.45, 16),
      matDark
    );
    bowl.position.set(5, 0.25, -3.5);
    roof.add(bowl);
    const loungerMat = track(
      new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.8 })
    );
    for (const lx of [8.2, 10.4]) {
      roof.add(box(0.9, 0.18, 2.3, loungerMat, lx, 0.3, -4));
      const backRest = box(0.9, 0.9, 0.12, loungerMat, lx, 0.7, -2.95);
      backRest.rotation.x = -0.5;
      roof.add(backRest);
    }
    // helipad
    const heli = new THREE.Mesh(
      new THREE.CircleGeometry(2.8, 28),
      track(new THREE.MeshBasicMaterial({ map: track(helipadTexture()), transparent: true }))
    );
    heli.rotation.x = -Math.PI / 2;
    heli.position.set(9.5, 0.02, 4.5);
    noShadow(heli);
    roof.add(heli);
  }
  scene.add(roof);
  const fireLight = new THREE.PointLight(0xff8030, 0, 9);
  fireLight.position.copy(STOP.roof).add(v(5, 1.1, -3.5));
  scene.add(fireLight);

  const FIRE_N = 70;
  const fireGeo = track(new THREE.BufferGeometry());
  const firePos = new Float32Array(FIRE_N * 3);
  const fireSeed = new Float32Array(FIRE_N);
  for (let i = 0; i < FIRE_N; i++) {
    fireSeed[i] = Math.random();
    firePos[i * 3] = STOP.roof.x + 5 + (Math.random() - 0.5) * 0.6;
    firePos[i * 3 + 1] = STOP.roof.y + 0.5 + Math.random() * 0.7;
    firePos[i * 3 + 2] = STOP.roof.z - 3.5 + (Math.random() - 0.5) * 0.4;
  }
  fireGeo.setAttribute("position", new THREE.BufferAttribute(firePos, 3));
  const fireMat = track(
    new THREE.PointsMaterial({
      color: 0xff7a28,
      size: 0.12,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  const firePts = new THREE.Points(fireGeo, fireMat);
  noShadow(firePts);
  scene.add(firePts);

  /* Shadow flags: everything casts/receives unless flagged. */
  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh && !obj.userData.noShadow) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  /* Curves through the waypoints */
  const camCurve = new THREE.CatmullRomCurve3(CAM_POINTS, false, "centripetal", 0.6);
  const targetCurve = new THREE.CatmullRomCurve3(TARGET_POINTS, false, "centripetal", 0.6);

  /* ── Render loop ──────────────────────────────────────────────────────── */

  let scroll = 0;
  let smooth = 0;
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  let time = 0;
  let last = performance.now();
  let raf = 0;
  let disposed = false;

  const camPos = new THREE.Vector3();
  const camTarget = new THREE.Vector3();
  const SUN_OFFSET = v(34, 52, 26);

  const frame = () => {
    if (disposed) return;
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    time += dt;

    smooth += (scroll - smooth) * (opts.reducedMotion ? 1 : 0.065);
    mouse.sx += (mouse.x - mouse.sx) * 0.05;
    mouse.sy += (mouse.y - mouse.sy) * 0.05;

    const f = smooth * (CHAPTERS - 1);
    const seg = Math.min(CHAPTERS - 2, Math.floor(f));
    const u = (seg + smoothstep(clamp01(f - seg))) / (CHAPTERS - 1);

    camCurve.getPoint(u, camPos);
    targetCurve.getPoint(u, camTarget);
    camera.position.set(
      camPos.x + mouse.sx * 0.9,
      camPos.y - mouse.sy * 0.6,
      camPos.z
    );
    camera.lookAt(camTarget);

    // Sun shadow frustum follows the action so the map stays sharp
    sun.position.copy(camTarget).add(SUN_OFFSET);
    sun.target.position.copy(camTarget);

    const w1 = bell(f, 1), w2 = bell(f, 2);
    const w4 = bell(f, 4), w5 = bell(f, 5), w6 = bell(f, 6);

    // 1 · monitors hum
    monLight.intensity = 4 * w1;
    for (let i = 0; i < monitorMats.length; i++) {
      const hum = 0.85 + 0.15 * Math.sin(time * (3 + i) + i * 2.1);
      monitorMats[i].color.setScalar(0.8 + 0.4 * w1 * hum);
    }

    // 2 · LED blinking
    if (w2 > 0.02) {
      for (const led of leds) {
        led.mesh.visible = Math.sin(time * led.speed + led.phase) > -0.35;
      }
    }

    // 4 · garage: door opens, headlights flare, future car hovers
    const doorT = smoothstep(clamp01((w4 - 0.12) / 0.5));
    doorPivot.rotation.x = -doorT * 1.65;
    garageLight2.intensity = garageLight.intensity =
      30 * smoothstep(clamp01((w4 - 0.18) / 0.4));
    const hlOn = w4 > 0.55 ? (w4 < 0.75 ? flicker(time, 4) : 1) : 0;
    for (const hl of headlights) hl.intensity = 40 * hlOn;
    headlightMatOn.opacity = 0.85 * hlOn;
    underglowMat.opacity =
      0.4 * smoothstep(clamp01((w4 - 0.35) / 0.4)) *
      (0.85 + 0.15 * Math.sin(time * 3.2));
    superCar.position.y = 0.2 + doorT * (0.22 + 0.08 * Math.sin(time * 1.6));

    // 5 · snowfall
    if (w5 > 0.02 && !opts.reducedMotion) {
      const sp = snowGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < SNOW_N; i++) {
        sp[i * 3 + 1] -= snowSpeed[i] * dt;
        sp[i * 3] += Math.sin(time * 0.8 + i) * dt * 0.3;
        if (sp[i * 3 + 1] < STOP.snow.y) {
          sp[i * 3 + 1] = STOP.snow.y + 13 + Math.random() * 2;
        }
      }
      snowGeo.attributes.position.needsUpdate = true;
    }

    // 6 · fire bowl
    fireLight.intensity = (4 + 2.5 * Math.sin(time * 9) * Math.sin(time * 23)) * w6;
    fireMat.opacity = 0.85 * Math.min(1, w6 * 2);
    if (w6 > 0.02 && !opts.reducedMotion) {
      const fp2 = fireGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < FIRE_N; i++) {
        fp2[i * 3 + 1] += (0.8 + fireSeed[i]) * dt;
        fp2[i * 3] += Math.sin(time * 6 + fireSeed[i] * 40) * dt * 0.1;
        if (fp2[i * 3 + 1] > STOP.roof.y + 1.3 + fireSeed[i] * 0.5) {
          fp2[i * 3 + 1] = STOP.roof.y + 0.45;
          fp2[i * 3] = STOP.roof.x + 5 + (Math.random() - 0.5) * 0.6;
        }
      }
      fireGeo.attributes.position.needsUpdate = true;
    }

    composer.render();
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  const onResize = () => {
    w = window.innerWidth;
    h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
  };
  window.addEventListener("resize", onResize);

  return {
    setScroll(p: number) {
      scroll = clamp01(p);
    },
    setMouse(nx: number, ny: number) {
      mouse.x = nx;
      mouse.y = ny;
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
          obj.geometry?.dispose();
        }
      });
      for (const d of disposables) d.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    },
  };
}
