/**
 * Odyssey world — a cinematic 3D night-world the camera travels through as
 * the page scrolls. Seven "stops", each themed to a chapter of the resume:
 *
 *   0  Neon sign        — LEVAN BEROSHVILI in glowing tubes over a grid floor
 *   1  Dev room         — desk, triple monitors full of code, lamp clicks on
 *   2  Server corridor  — camera flies between racks of blinking LEDs
 *   3  Guitar stage     — black Strat in a spotlight that snaps on
 *   4  Garage           — door tilts open, supercar headlights flare, underglow
 *   5  Snow slope       — Jones Frontier board, falling snow, aurora sky
 *   6  Rooftop          — pool, fireplace, helipad, city skyline below
 *
 * Everything is procedural three.js primitives — no model files. Bloom makes
 * the emissive surfaces read as real light sources. Camera position/look-at
 * ride two Catmull-Rom curves; per-chapter smoothstep makes the camera dwell
 * at each stop while that chapter's content is on screen.
 */

import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

export const CHAPTERS = 7;

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/* Camera waypoints (one per chapter) and what the camera looks at there. */
const CAM_POINTS = [
  v(0, 4.6, 24),
  v(-16, 3.2, -30),
  v(8, 2.7, -84),
  v(-16, 2.6, -120),
  v(14, 4.4, -152.5),
  v(-16, 3.0, -209),
  v(-3, 12.6, -253),
];
const TARGET_POINTS = [
  v(0, 6.0, 0),
  v(-16, 1.9, -40),
  v(8, 2.2, -100),
  v(-16, 1.8, -130),
  v(14, 0.8, -174),
  v(-16, 1.8, -221),
  v(2, 10.8, -272),
];

const STOP = {
  sign: v(0, 6, 0),
  dev: v(-16, 0, -40),
  corridor: v(8, 0, -86),
  guitar: v(-16, 0, -130),
  garage: v(14, 0, -175),
  snow: v(-16, 0, -221),
  roof: v(0, 10, -270),
};

function clamp01(x: number) {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

/** 1 at the chapter, fading to 0 one chapter away. */
function bell(f: number, i: number) {
  return Math.max(0, 1 - Math.abs(f - i));
}

/** Stepped pseudo-random flicker used when lights "switch on". */
function flicker(time: number, seed: number) {
  const x = Math.sin(time * 31.7 + seed * 91.3) * 43758.5453;
  return x - Math.floor(x) > 0.42 ? 1 : 0.15;
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

function neonTextTexture(text: string, color: string) {
  return canvasTexture(2048, 512, (ctx) => {
    ctx.clearRect(0, 0, 2048, 512);
    // Auto-fit: scale the font so the text spans ~88% of the canvas width
    ctx.font = "bold 100px Arial, sans-serif";
    const measured = ctx.measureText(text).width;
    const size = Math.min(380, (100 * 2048 * 0.88) / measured);
    ctx.font = `bold ${size}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = color;
    ctx.shadowBlur = 70;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 8;
    ctx.strokeText(text, 1024, 256);
    ctx.shadowBlur = 28;
    ctx.fillStyle = color;
    ctx.fillText(text, 1024, 256);
  });
}

function codeTexture(hue: number) {
  return canvasTexture(256, 160, (ctx) => {
    ctx.fillStyle = "#0a0f14";
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

function cityWindowsTexture() {
  return canvasTexture(128, 256, (ctx) => {
    ctx.fillStyle = "#06070c";
    ctx.fillRect(0, 0, 128, 256);
    for (let y = 6; y < 250; y += 12) {
      for (let x = 6; x < 122; x += 10) {
        if (Math.random() < 0.28) {
          ctx.fillStyle =
            Math.random() < 0.7
              ? `rgba(255, 214, 140, ${0.5 + Math.random() * 0.5})`
              : `rgba(150, 220, 255, ${0.4 + Math.random() * 0.5})`;
          ctx.fillRect(x, y, 5, 7);
        }
      }
    }
  });
}

function boardTexture() {
  return canvasTexture(256, 1024, (ctx) => {
    // Jones-Frontier-inspired: deep blue fading to ice with mountain band
    const grad = ctx.createLinearGradient(0, 0, 0, 1024);
    grad.addColorStop(0, "#0d1b3d");
    grad.addColorStop(0.55, "#1d3f6e");
    grad.addColorStop(1, "#cfe5f2");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 1024);
    // mountain silhouette band
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

function gridTexture() {
  return canvasTexture(256, 256, (ctx) => {
    ctx.fillStyle = "#07080d";
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = "rgba(80, 140, 255, 0.20)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 256; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 256);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(256, i);
      ctx.stroke();
    }
  });
}

function helipadTexture() {
  return canvasTexture(256, 256, (ctx) => {
    ctx.clearRect(0, 0, 256, 256);
    ctx.strokeStyle = "#ffd966";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(128, 128, 100, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = "bold 130px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffd966";
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

/** Glowing floor plaque under each car in the garage timeline. */
function plaqueTexture(text: string) {
  return canvasTexture(256, 64, (ctx) => {
    ctx.clearRect(0, 0, 256, 64);
    ctx.font = "bold 34px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "#7ad8ff";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#bfe9ff";
    ctx.fillText(text, 128, 32);
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
    antialias: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1 : 1.5));
  renderer.setSize(w, h);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x04050a);
  scene.fog = new THREE.FogExp2(0x04050a, 0.016);

  const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 600);
  camera.position.copy(CAM_POINTS[0]);

  /* Post: bloom sells every emissive surface as a light source. */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(w, h),
    lowPower ? 0.7 : 1.0,
    0.55,
    0.3
  );
  composer.addPass(bloom);

  const disposables: Array<{ dispose(): void }> = [renderer, composer];
  const track = <T extends { dispose(): void }>(o: T): T => {
    disposables.push(o);
    return o;
  };

  /* Shared materials */
  const matDark = track(
    new THREE.MeshStandardMaterial({ color: 0x15161c, roughness: 0.55, metalness: 0.4 })
  );
  const matConcrete = track(
    new THREE.MeshStandardMaterial({ color: 0x1c1e24, roughness: 0.9, metalness: 0.05 })
  );
  const matMetal = track(
    new THREE.MeshStandardMaterial({ color: 0x2a2d36, roughness: 0.3, metalness: 0.85 })
  );
  const basic = (color: number, opacity = 1) =>
    track(
      new THREE.MeshBasicMaterial({
        color,
        transparent: opacity < 1,
        opacity,
      })
    );

  const ambient = new THREE.AmbientLight(0x223040, 0.5);
  scene.add(ambient);

  /* Ground: one long faint tron-grid strip tying the journey together */
  const gridTex = track(gridTexture());
  gridTex.wrapS = gridTex.wrapT = THREE.RepeatWrapping;
  gridTex.repeat.set(24, 64);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(160, 420),
    track(
      new THREE.MeshStandardMaterial({
        map: gridTex,
        color: 0x666c80,
        roughness: 0.85,
        metalness: 0.2,
      })
    )
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, -150);
  scene.add(ground);

  /* Stars */
  const STAR_N = lowPower ? 500 : 1100;
  const starGeo = track(new THREE.BufferGeometry());
  {
    const p = new Float32Array(STAR_N * 3);
    for (let i = 0; i < STAR_N; i++) {
      p[i * 3] = (Math.random() - 0.5) * 220;
      p[i * 3 + 1] = 14 + Math.random() * 90;
      p[i * 3 + 2] = 30 - Math.random() * 400;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(p, 3));
  }
  const stars = new THREE.Points(
    starGeo,
    track(
      new THREE.PointsMaterial({
        color: 0xbfd4ff,
        size: 0.35,
        transparent: true,
        opacity: 0.85,
        sizeAttenuation: true,
      })
    )
  );
  scene.add(stars);

  /* ════ 0 · NEON SIGN ════ */
  const signGroup = new THREE.Group();
  signGroup.position.copy(STOP.sign);
  {
    const t1 = track(neonTextTexture("LEVAN", "#46c8ff"));
    const t2 = track(neonTextTexture("BEROSHVILI", "#ff4fd2"));
    const m1 = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 3.5),
      track(new THREE.MeshBasicMaterial({ map: t1, transparent: true }))
    );
    m1.position.y = 1.4;
    const m2 = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 3),
      track(new THREE.MeshBasicMaterial({ map: t2, transparent: true }))
    );
    m2.position.y = -1.5;
    signGroup.add(m1, m2);
    // support poles
    signGroup.add(box(0.1, 12, 0.1, matMetal, -6.5, -3, -0.2));
    signGroup.add(box(0.1, 12, 0.1, matMetal, 6.5, -3, -0.2));
  }
  scene.add(signGroup);
  const signLightA = new THREE.PointLight(0x46c8ff, 0, 30);
  signLightA.position.set(-4, 7, 4);
  const signLightB = new THREE.PointLight(0xff4fd2, 0, 30);
  signLightB.position.set(4, 4, 4);
  scene.add(signLightA, signLightB);

  /* ════ 1 · DEV ROOM ════ */
  const dev = new THREE.Group();
  dev.position.copy(STOP.dev);
  const monitorMats: THREE.MeshBasicMaterial[] = [];
  {
    const deskTop = box(6, 0.18, 2.4, track(
      new THREE.MeshStandardMaterial({ color: 0x3a2d22, roughness: 0.6 })
    ), 0, 1.45, 0);
    dev.add(deskTop);
    for (const [lx, lz] of [[-2.7, -0.9], [2.7, -0.9], [-2.7, 0.9], [2.7, 0.9]]) {
      dev.add(box(0.12, 1.45, 0.12, matMetal, lx, 0.72, lz));
    }
    // three monitors
    for (let i = -1; i <= 1; i++) {
      const tex = track(codeTexture(i === -1 ? 200 : i === 0 ? 160 : 280));
      const mat = track(new THREE.MeshBasicMaterial({ map: tex }));
      monitorMats.push(mat);
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.05), mat);
      screen.position.set(i * 1.8, 2.5, -0.55 + Math.abs(i) * 0.18);
      screen.rotation.y = -i * 0.38;
      const back = box(1.74, 1.1, 0.06, matDark, 0, 0, -0.04);
      back.position.copy(screen.position).add(
        new THREE.Vector3(Math.sin(-i * 0.38) * -0.04, 0, Math.cos(-i * 0.38) * -0.04)
      );
      back.rotation.copy(screen.rotation);
      const stand = box(0.1, 0.45, 0.1, matMetal, i * 1.8, 1.75, -0.5);
      dev.add(screen, back, stand);
    }
    dev.add(box(1.6, 0.05, 0.5, matDark, 0, 1.57, 0.55)); // keyboard
    const mug = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 0.2, 12),
      basic(0xff5a3c)
    );
    mug.position.set(1.4, 1.65, 0.6);
    dev.add(mug);
    // chair
    dev.add(box(0.9, 0.12, 0.9, matDark, 0, 0.85, 1.9));
    dev.add(box(0.9, 1.1, 0.12, matDark, 0, 1.5, 2.35));
    dev.add(box(0.1, 0.85, 0.1, matMetal, 0, 0.4, 1.9));
    // neon strip behind the desk on the floor
    dev.add(box(6.4, 0.06, 0.06, basic(0x9b5cff), 0, 0.06, -1.5));
    // desk lamp
    dev.add(box(0.06, 0.8, 0.06, matMetal, -2.5, 1.95, -0.6));
    const lampHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 10, 10),
      basic(0xffd9a0)
    );
    lampHead.position.set(-2.5, 2.38, -0.5);
    dev.add(lampHead);
    // rug
    const rug = new THREE.Mesh(
      new THREE.CircleGeometry(2.6, 24),
      track(new THREE.MeshStandardMaterial({ color: 0x141821, roughness: 1 }))
    );
    rug.rotation.x = -Math.PI / 2;
    rug.position.y = 0.02;
    dev.add(rug);
  }
  scene.add(dev);
  const lampLight = new THREE.PointLight(0xffc878, 0, 14);
  lampLight.position.copy(STOP.dev).add(v(-2.5, 2.6, -0.3));
  const monLight = new THREE.PointLight(0x5fa8ff, 0, 12);
  monLight.position.copy(STOP.dev).add(v(0, 2.4, 0.6));
  scene.add(lampLight, monLight);

  /* ════ 2 · SERVER CORRIDOR ════ */
  const corridor = new THREE.Group();
  corridor.position.copy(STOP.corridor);
  const leds: Array<{ mesh: THREE.Mesh; phase: number; speed: number }> = [];
  {
    const ledMats = [basic(0x3dff7a), basic(0x46c8ff), basic(0xffb347)];
    for (const side of [-1, 1]) {
      for (let r = 0; r < 5; r++) {
        const z = 14 - r * 7;
        const rack = box(1.6, 4.2, 1.2, matMetal, side * 3.6, 2.1, z);
        corridor.add(rack);
        for (let l = 0; l < 9; l++) {
          const led = new THREE.Mesh(
            new THREE.PlaneGeometry(0.4, 0.05),
            ledMats[Math.floor(Math.random() * 3)]
          );
          led.position.set(
            side * (3.6 - side * 0.81 * side),
            0.5 + l * 0.42,
            z - 0.45 + Math.random() * 0.9
          );
          led.position.x = side * 2.79; // inner face of the rack
          led.rotation.y = -side * Math.PI / 2;
          corridor.add(led);
          leds.push({
            mesh: led,
            phase: Math.random() * 10,
            speed: 2 + Math.random() * 7,
          });
        }
      }
      // floor light strip along the corridor
      corridor.add(
        box(0.1, 0.04, 36, basic(0x2766ff), side * 2.6, 0.04, 0)
      );
    }
  }
  scene.add(corridor);
  const corrLightA = new THREE.PointLight(0x4677ff, 0, 22);
  corrLightA.position.copy(STOP.corridor).add(v(0, 3.6, 6));
  const corrLightB = new THREE.PointLight(0x4677ff, 0, 22);
  corrLightB.position.copy(STOP.corridor).add(v(0, 3.6, -8));
  scene.add(corrLightA, corrLightB);

  /* ════ 3 · GUITAR STAGE ════ */
  const stage = new THREE.Group();
  stage.position.copy(STOP.guitar);
  {
    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3.3, 0.25, 36),
      matDark
    );
    platform.position.y = 0.12;
    stage.add(platform);

    const guitar = new THREE.Group();
    // Strat-ish double-cutaway body: big lower bout, pinched waist,
    // two slim pointed horns flanking the neck pocket
    const bs = new THREE.Shape();
    bs.moveTo(0, -0.75);
    bs.bezierCurveTo(0.42, -0.75, 0.62, -0.55, 0.6, -0.28);   // lower-right bout
    bs.bezierCurveTo(0.58, -0.05, 0.42, 0.02, 0.4, 0.16);     // right waist
    bs.bezierCurveTo(0.38, 0.32, 0.5, 0.42, 0.44, 0.58);      // upper-right rise
    bs.bezierCurveTo(0.4, 0.7, 0.26, 0.72, 0.2, 0.58);        // short horn
    bs.bezierCurveTo(0.16, 0.46, 0.12, 0.4, 0, 0.4);          // neck pocket
    bs.bezierCurveTo(-0.12, 0.4, -0.16, 0.5, -0.2, 0.66);
    bs.bezierCurveTo(-0.24, 0.84, -0.44, 0.82, -0.46, 0.62);  // tall horn
    bs.bezierCurveTo(-0.48, 0.46, -0.42, 0.32, -0.44, 0.18);  // left waist
    bs.bezierCurveTo(-0.46, 0.0, -0.62, -0.1, -0.64, -0.35);  // lower-left bout
    bs.bezierCurveTo(-0.6, -0.62, -0.36, -0.75, 0, -0.75);
    const bodyGeo = track(
      new THREE.ExtrudeGeometry(bs, {
        depth: 0.09,
        bevelEnabled: true,
        bevelSize: 0.03,
        bevelThickness: 0.03,
        bevelSegments: 3,
      })
    );
    const body = new THREE.Mesh(
      bodyGeo,
      track(new THREE.MeshStandardMaterial({ color: 0x0a0a0c, roughness: 0.15, metalness: 0.25 }))
    );
    guitar.add(body);
    // wood-tone center stripe (the player's actual guitar detail)
    const stripe = new THREE.Mesh(
      track(new THREE.ExtrudeGeometry(roundedRectShape(0.34, 1.0, 0.12), { depth: 0.012, bevelEnabled: false })),
      track(new THREE.MeshStandardMaterial({ color: 0x553a1c, roughness: 0.7 }))
    );
    stripe.position.set(-0.02, -0.1, 0.123);
    guitar.add(stripe);
    // pickups + bridge
    const pickupMat = track(
      new THREE.MeshStandardMaterial({ color: 0x1c1c20, roughness: 0.4, metalness: 0.6 })
    );
    for (let p = 0; p < 3; p++) {
      guitar.add(box(0.2, 0.05, 0.02, pickupMat, -0.02, 0.12 - p * 0.18, 0.135));
    }
    // neck + fretboard
    const neck = box(0.13, 1.5, 0.05, track(
      new THREE.MeshStandardMaterial({ color: 0x77573a, roughness: 0.7 })
    ), -0.02, 1.27, 0.06);
    guitar.add(neck);
    guitar.add(box(0.13, 1.5, 0.012, track(
      new THREE.MeshStandardMaterial({ color: 0x2c1d12, roughness: 0.6 })
    ), -0.02, 1.27, 0.09));
    // headstock + Fender-style label
    const head = box(0.22, 0.4, 0.04, track(
      new THREE.MeshStandardMaterial({ color: 0x77573a, roughness: 0.7 })
    ), 0.02, 2.2, 0.05);
    guitar.add(head);
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(0.2, 0.05),
      track(new THREE.MeshBasicMaterial({ map: track(labelTexture("Fender")), transparent: true }))
    );
    label.position.set(0.02, 2.3, 0.075);
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
    // strings — muted so they don't bloom into a light-saber
    const strMat = basic(0x8a8270);
    for (let s2 = 0; s2 < 6; s2++) {
      const str = new THREE.Mesh(
        new THREE.CylinderGeometry(0.003, 0.003, 2.6, 4),
        strMat
      );
      str.position.set(-0.065 + s2 * 0.022, 0.95, 0.1);
      guitar.add(str);
    }
    guitar.position.set(0, 0.95, 0.3);
    guitar.rotation.set(-0.16, 0.5, 0);
    guitar.scale.set(1.15, 1.35, 1.35); // slimmer waist, full height
    stage.add(guitar);
    // stand
    stage.add(box(0.06, 1.0, 0.06, matMetal, 0, 0.6, 0.06));
    stage.add(box(0.7, 0.06, 0.06, matMetal, 0, 0.18, 0.2));
  }
  scene.add(stage);
  // cool rim light from behind separates the black body from the night
  const rimLight = new THREE.PointLight(0x5f8aff, 0, 16);
  rimLight.position.copy(STOP.guitar).add(v(-2.5, 2.2, -3));
  scene.add(rimLight);
  const spot = new THREE.SpotLight(0xfff2dd, 0, 26, 0.42, 0.55, 1.2);
  spot.position.copy(STOP.guitar).add(v(0.5, 9.5, 2.4));
  const spotTarget = new THREE.Object3D();
  spotTarget.position.copy(STOP.guitar).add(v(0, 1, 0.2));
  scene.add(spotTarget);
  spot.target = spotTarget;
  scene.add(spot);
  // visible beam cone
  const beamMat = track(
    new THREE.MeshBasicMaterial({
      color: 0xfff4da,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  const beam = new THREE.Mesh(
    track(new THREE.ConeGeometry(2.6, 9.0, 28, 1, true)),
    beamMat
  );
  beam.position.copy(STOP.guitar).add(v(0.25, 5.0, 1.3));
  beam.rotation.x = 0.12;
  scene.add(beam);

  /* ════ 4 · GARAGE — the actual car timeline ════
   * W203 '04 (dark red) → W204 '12 (black) → Forester Wilderness '22
   * (autumn green) → and a glowing "next" supercar. Georgian plates. */
  const garage = new THREE.Group();
  garage.position.copy(STOP.garage);
  const doorPivot = new THREE.Group();
  let underglowMat!: THREE.MeshBasicMaterial;
  let headlightMatOn!: THREE.MeshBasicMaterial;
  let superCar!: THREE.Group;
  const headlights: THREE.SpotLight[] = [];
  {
    const W = 15, H = 4, D = 9.5;
    garage.add(box(W, 0.2, D, matConcrete, 0, 0.1, 0));                 // slab
    garage.add(box(W, H, 0.3, matConcrete, 0, H / 2, -D / 2));          // back
    garage.add(box(0.3, H, D, matConcrete, -W / 2, H / 2, 0));          // left
    garage.add(box(0.3, H, D, matConcrete, W / 2, H / 2, 0));           // right
    garage.add(box(W, 0.3, D, matConcrete, 0, H, 0));                   // roof
    // ceiling light tubes
    garage.add(box(4, 0.06, 0.2, basic(0xfff6e0), -3.5, H - 0.2, 0.6));
    garage.add(box(4, 0.06, 0.2, basic(0xfff6e0), 3.5, H - 0.2, 0.6));
    // shelf with boxes
    garage.add(box(3, 0.08, 0.8, matMetal, -5, 2.6, -4.2));
    garage.add(box(0.6, 0.5, 0.6, matDark, -5.6, 2.95, -4.2));
    garage.add(box(0.5, 0.4, 0.5, matDark, -4.5, 2.9, -4.2));
    // tilt-up door hinged at the top of the opening
    doorPivot.position.set(0, H - 0.15, D / 2);
    const door = box(W - 0.7, H - 0.35, 0.12, track(
      new THREE.MeshStandardMaterial({ color: 0x3b404c, roughness: 0.45, metalness: 0.7 })
    ), 0, -(H - 0.35) / 2, 0);
    doorPivot.add(door);
    garage.add(doorPivot);

    /* Car builder — extruded side profile (+x = nose), per-era silhouettes */
    const glassMat = track(
      new THREE.MeshStandardMaterial({ color: 0x0c1018, roughness: 0.06, metalness: 0.9 })
    );
    const tireMat = track(
      new THREE.MeshStandardMaterial({ color: 0x0a0a0c, roughness: 0.9 })
    );
    const rimSilver = track(
      new THREE.MeshStandardMaterial({ color: 0xb9c2cc, roughness: 0.25, metalness: 1 })
    );
    const headlightOff = track(
      new THREE.MeshBasicMaterial({ color: 0x756f5e })
    );
    headlightMatOn = track(
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 })
    );

    type CarKind = "sedan04" | "sedan12" | "suv" | "super";
    const profiles: Record<CarKind, () => THREE.Shape> = {
      // W203 — rounded classic three-box sedan
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
      // W204 — sharper, longer hood, lower roofline
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
      // Forester Wilderness — tall boxy wagon, upright glass, long roof
      suv: () => {
        const s = new THREE.Shape();
        s.moveTo(-2.15, 0.42);
        s.lineTo(-2.28, 0.85);
        s.quadraticCurveTo(-2.26, 1.1, -2.1, 1.25);
        s.lineTo(-1.85, 1.72);        // upright tailgate
        s.quadraticCurveTo(-1.5, 1.8, -0.6, 1.8);
        s.lineTo(0.9, 1.78);          // long flat roof
        s.quadraticCurveTo(1.35, 1.7, 1.65, 1.3);  // windshield
        s.quadraticCurveTo(2.05, 1.18, 2.35, 1.12); // hood
        s.quadraticCurveTo(2.55, 1.0, 2.55, 0.7);
        s.lineTo(2.45, 0.42);
        s.lineTo(-2.15, 0.42);
        return s;
      },
      // The "next one" — low wedge supercar
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

    const buildCar = (opts: {
      kind: CarKind;
      color: number;
      plate: string;
      lit?: boolean;   // working headlights (the current car)
      glow?: boolean;  // underglow + hover (the future car)
    }) => {
      const car = new THREE.Group();
      const isSuv = opts.kind === "suv";
      const wheelR = isSuv ? 0.46 : 0.4;
      const lift = isSuv ? 0.16 : 0;

      const bodyGeo = track(
        new THREE.ExtrudeGeometry(profiles[opts.kind](), {
          depth: 1.8,
          bevelEnabled: true,
          bevelSize: 0.06,
          bevelThickness: 0.06,
          bevelSegments: 3,
        })
      );
      const body = new THREE.Mesh(
        bodyGeo,
        track(
          new THREE.MeshStandardMaterial({
            color: opts.color,
            roughness: opts.kind === "super" ? 0.2 : 0.32,
            metalness: 0.85,
          })
        )
      );
      body.position.set(0, lift, -0.9);
      car.add(body);

      // cabin glass band
      const glassH = isSuv ? 0.45 : 0.32;
      const glassY = isSuv ? 1.45 : opts.kind === "super" ? 1.06 : 1.12;
      car.add(box(isSuv ? 2.4 : 1.2, glassH, 1.62, glassMat, -0.2, glassY + lift, 0));
      if (isSuv) {
        // roof rails + black lower cladding (Wilderness trim)
        car.add(box(2.6, 0.06, 0.08, matDark, -0.4, 1.86 + lift, 0.7));
        car.add(box(2.6, 0.06, 0.08, matDark, -0.4, 1.86 + lift, -0.7));
        car.add(box(4.6, 0.18, 1.92, matDark, 0.1, 0.4 + lift, 0));
      }

      // wheels
      const wx = isSuv ? [-1.5, 1.6] : [-1.45, 1.55];
      for (const x of wx) {
        for (const z of [0.95, -0.95]) {
          const tire = new THREE.Mesh(
            new THREE.CylinderGeometry(wheelR, wheelR, 0.3, 18),
            tireMat
          );
          tire.rotation.x = Math.PI / 2;
          tire.position.set(x, wheelR, z);
          const rim = new THREE.Mesh(
            new THREE.TorusGeometry(wheelR * 0.52, 0.035, 8, 18),
            opts.glow ? basic(0x35e0ff) : rimSilver
          );
          rim.position.set(x, wheelR, z + Math.sign(z) * 0.16);
          car.add(tire, rim);
        }
      }

      // headlights + tail lights
      const noseX = opts.kind === "suv" ? 2.6 : opts.kind === "sedan04" ? 2.27 : 2.47;
      const lightY = (isSuv ? 0.95 : 0.55) + lift;
      for (const z of [-0.6, 0.6]) {
        const hl = new THREE.Mesh(
          new THREE.PlaneGeometry(0.26, 0.1),
          opts.lit || opts.glow ? headlightMatOn : headlightOff
        );
        hl.position.set(noseX + 0.01, lightY, z);
        hl.rotation.y = Math.PI / 2;
        car.add(hl);
        const tl = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.09), basic(0x7a1818));
        tl.position.set(-noseX + (isSuv ? 0.25 : 0.12), lightY + 0.06, z);
        tl.rotation.y = -Math.PI / 2;
        car.add(tl);
        if (opts.lit) {
          // Aimed down at the slab so the beam pools on the floor instead
          // of glaring straight into the approaching camera.
          const sl = new THREE.SpotLight(0xeef4ff, 0, 24, 0.34, 0.7, 1.6);
          sl.position.set(noseX, lightY, z);
          const slt = new THREE.Object3D();
          slt.position.set(9, -1.2, z * 1.6);
          car.add(sl, slt);
          sl.target = slt;
          headlights.push(sl);
        }
      }

      // Georgian plates, front + rear
      const pTex = track(plateTexture(opts.plate));
      const pMat = track(new THREE.MeshBasicMaterial({ map: pTex }));
      const front = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.1), pMat);
      front.position.set(noseX + 0.02, (isSuv ? 0.66 : 0.38) + lift, 0);
      front.rotation.y = Math.PI / 2;
      const rear = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.1), pMat);
      rear.position.set(-noseX + (isSuv ? 0.18 : 0.06), (isSuv ? 0.8 : 0.45) + lift, 0);
      rear.rotation.y = -Math.PI / 2;
      car.add(front, rear);

      if (opts.glow) {
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
        car.add(glow);
      }
      return car;
    };

    const lineup: Array<{
      x: number;
      plaque: string;
      car: THREE.Group;
    }> = [
      { x: -5.5, plaque: "W203 · 2004", car: buildCar({ kind: "sedan04", color: 0x4a1014, plate: "MA-010-RK" }) },
      { x: -1.85, plaque: "W204 · 2012", car: buildCar({ kind: "sedan12", color: 0x0d0d11, plate: "MA-020-RK" }) },
      { x: 1.85, plaque: "FORESTER · 2022", car: buildCar({ kind: "suv", color: 0x3c4631, plate: "MA-030-RK", lit: true }) },
      { x: 5.5, plaque: "NEXT · 20??", car: buildCar({ kind: "super", color: 0x2e3340, plate: "MA-040-RK", glow: true }) },
    ];
    for (const { x, plaque, car } of lineup) {
      car.position.set(x, 0.12, -0.6);
      car.rotation.y = -Math.PI / 2 + (Math.random() - 0.5) * 0.06; // nose out the door
      garage.add(car);
      const pl = new THREE.Mesh(
        new THREE.PlaneGeometry(2.0, 0.5),
        track(new THREE.MeshBasicMaterial({ map: track(plaqueTexture(plaque)), transparent: true }))
      );
      pl.rotation.x = -Math.PI / 2;
      pl.position.set(x, 0.22, 3.6);
      garage.add(pl);
    }
    superCar = lineup[3].car;
  }
  scene.add(garage);
  const garageLight = new THREE.PointLight(0xfff0d8, 0, 26);
  garageLight.position.copy(STOP.garage).add(v(-3.5, 3.4, 2.2));
  const garageLight2 = new THREE.PointLight(0xfff0d8, 0, 26);
  garageLight2.position.copy(STOP.garage).add(v(3.5, 3.4, 2.2));
  // driveway fill — lights the car noses through the open door
  const drivewayLight = new THREE.PointLight(0xd8e4ff, 0, 30);
  drivewayLight.position.copy(STOP.garage).add(v(0, 3.5, 9));
  scene.add(garageLight, garageLight2, drivewayLight);

  /* ════ 5 · SNOW SLOPE ════ */
  const snowG = new THREE.Group();
  snowG.position.copy(STOP.snow);
  {
    const snowMat = track(
      new THREE.MeshStandardMaterial({ color: 0xdfe9f5, roughness: 0.95 })
    );
    const patch = new THREE.Mesh(new THREE.CircleGeometry(15, 28), snowMat);
    patch.rotation.x = -Math.PI / 2;
    patch.position.y = 0.04;
    snowG.add(patch);
    for (const [mx, mz, mr] of [[-3, -2, 2.2], [3.4, -4, 3.0], [1.5, 2.5, 1.6]]) {
      const mound = new THREE.Mesh(new THREE.SphereGeometry(mr, 18, 12), snowMat);
      mound.scale.y = 0.32;
      mound.position.set(mx, 0.1, mz);
      snowG.add(mound);
    }
    // snowboard standing in the snow
    const board = new THREE.Mesh(
      track(new THREE.ExtrudeGeometry(roundedRectShape(0.62, 2.9, 0.3), { depth: 0.05, bevelEnabled: false })),
      [
        track(new THREE.MeshStandardMaterial({ map: track(boardTexture()), roughness: 0.35 })),
        track(new THREE.MeshStandardMaterial({ color: 0x101015, roughness: 0.4 })),
      ]
    );
    board.position.set(0, 1.2, 0);
    board.rotation.set(-0.18, 0.35, 0.06);
    snowG.add(board);
    // bindings hint
    snowG.add(box(0.4, 0.3, 0.1, matDark, -0.06, 1.7, 0.12));
    snowG.add(box(0.4, 0.3, 0.1, matDark, 0.1, 0.8, 0.12));
    // low-poly pines
    const pineMat = track(
      new THREE.MeshStandardMaterial({ color: 0x0e3b28, roughness: 0.8, flatShading: true })
    );
    for (const [px, pz, ps] of [[-6, -5, 1.4], [-8, -1, 1.0], [6, -6, 1.7], [8, -2, 1.1]]) {
      const pine = new THREE.Group();
      pine.add(box(0.18 * ps, 0.7 * ps, 0.18 * ps, matDark, 0, 0.35 * ps, 0));
      const c1 = new THREE.Mesh(new THREE.ConeGeometry(0.9 * ps, 1.6 * ps, 7), pineMat);
      c1.position.y = 1.4 * ps;
      const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.65 * ps, 1.3 * ps, 7), pineMat);
      c2.position.y = 2.2 * ps;
      pine.add(c1, c2);
      pine.position.set(px, 0, pz);
      snowG.add(pine);
    }
    // moon
    const moon = new THREE.Mesh(new THREE.CircleGeometry(2.4, 24), basic(0xfdfaef));
    moon.position.set(-12, 22, -42);
    snowG.add(moon);
  }
  scene.add(snowG);
  // aurora — animated shader ribbon in the sky
  const auroraMat = track(
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: { uTime: { value: 0 }, uIntensity: { value: 0 } },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uIntensity;
        varying vec2 vUv;
        void main() {
          float band = sin(vUv.x * 7.0 + uTime * 0.45 + sin(vUv.x * 3.1 - uTime * 0.2) * 1.6);
          float curtain = smoothstep(-0.9, 0.9, band);
          float vert = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.45, vUv.y);
          vec3 green = vec3(0.15, 0.95, 0.55);
          vec3 violet = vec3(0.55, 0.25, 0.95);
          vec3 col = mix(green, violet, vUv.y + 0.25 * sin(vUv.x * 5.0 + uTime * 0.3));
          float a = curtain * vert * uIntensity * 0.22;
          gl_FragColor = vec4(col * 0.8, a);
        }
      `,
    })
  );
  const aurora = new THREE.Mesh(new THREE.PlaneGeometry(80, 20), auroraMat);
  aurora.position.copy(STOP.snow).add(v(0, 27, -48));
  scene.add(aurora);
  const moonLight = new THREE.PointLight(0xa8c8ff, 0, 60);
  moonLight.position.copy(STOP.snow).add(v(-6, 14, 2));
  // close fill on the board itself so the graphic reads
  const boardLight = new THREE.PointLight(0xcfe0ff, 0, 14);
  boardLight.position.copy(STOP.snow).add(v(1.5, 2.6, 3.5));
  scene.add(moonLight, boardLight);
  // falling snow
  const SNOW_N = lowPower ? 250 : 650;
  const snowGeo = track(new THREE.BufferGeometry());
  const snowPos = new Float32Array(SNOW_N * 3);
  const snowSpeed = new Float32Array(SNOW_N);
  for (let i = 0; i < SNOW_N; i++) {
    snowPos[i * 3] = STOP.snow.x + (Math.random() - 0.5) * 34;
    snowPos[i * 3 + 1] = Math.random() * 16;
    snowPos[i * 3 + 2] = STOP.snow.z + (Math.random() - 0.5) * 34;
    snowSpeed[i] = 0.8 + Math.random() * 1.6;
  }
  snowGeo.setAttribute("position", new THREE.BufferAttribute(snowPos, 3));
  const snowPts = new THREE.Points(
    snowGeo,
    track(
      new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.09,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: true,
      })
    )
  );
  scene.add(snowPts);

  /* ════ 6 · ROOFTOP ════ */
  const roof = new THREE.Group();
  roof.position.copy(STOP.roof);
  let poolMat: THREE.MeshBasicMaterial;
  {
    roof.add(box(28, 0.7, 17, matConcrete, 0, -0.35, 0));
    // glass railing
    const railMat = track(
      new THREE.MeshStandardMaterial({
        color: 0x9fd4e8,
        roughness: 0.05,
        metalness: 0.2,
        transparent: true,
        opacity: 0.18,
      })
    );
    roof.add(box(28, 1.0, 0.06, railMat, 0, 0.5, -8.5));
    roof.add(box(0.06, 1.0, 17, railMat, -14, 0.5, 0));
    roof.add(box(0.06, 1.0, 17, railMat, 14, 0.5, 0));
    // pool — glowing cyan water
    poolMat = track(
      new THREE.MeshBasicMaterial({ color: 0x0c7e92, transparent: true, opacity: 0.7 })
    );
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(7, 3.6), poolMat);
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(-6.5, 0.03, -2.5);
    roof.add(pool);
    roof.add(box(7.5, 0.12, 0.25, basic(0xe8e4da), -6.5, 0.06, -0.55));
    roof.add(box(7.5, 0.12, 0.25, basic(0xe8e4da), -6.5, 0.06, -4.45));
    roof.add(box(0.25, 0.12, 4.1, basic(0xe8e4da), -10.1, 0.06, -2.5));
    roof.add(box(0.25, 0.12, 4.1, basic(0xe8e4da), -2.9, 0.06, -2.5));
    // fireplace
    const fp = new THREE.Group();
    fp.add(box(1.8, 0.9, 0.9, track(
      new THREE.MeshStandardMaterial({ color: 0x2e2a26, roughness: 0.95 })
    ), 0, 0.45, 0));
    fp.add(box(1.3, 0.45, 0.92, basic(0x140a05), 0, 0.42, 0.01));
    fp.position.set(4.5, 0, -4.5);
    roof.add(fp);
    // lounge sofas + table
    const sofaMat = track(
      new THREE.MeshStandardMaterial({ color: 0x33302c, roughness: 0.9 })
    );
    roof.add(box(2.6, 0.45, 0.9, sofaMat, 4.5, 0.22, -1.4));
    roof.add(box(2.6, 0.5, 0.2, sofaMat, 4.5, 0.65, -0.95));
    roof.add(box(0.9, 0.45, 2.2, sofaMat, 2.6, 0.22, -3.2));
    roof.add(box(0.8, 0.3, 0.8, matMetal, 4.4, 0.18, -2.6));
    // helipad
    const heli = new THREE.Mesh(
      new THREE.CircleGeometry(2.6, 28),
      track(new THREE.MeshBasicMaterial({ map: track(helipadTexture()), transparent: true }))
    );
    heli.rotation.x = -Math.PI / 2;
    heli.position.set(9.5, 0.04, 3.5);
    roof.add(heli);
  }
  scene.add(roof);
  const fireLight = new THREE.PointLight(0xff8030, 0, 14);
  fireLight.position.copy(STOP.roof).add(v(4.5, 1.2, -4));
  const poolLight = new THREE.PointLight(0x22c8e0, 0, 12);
  poolLight.position.copy(STOP.roof).add(v(-6.5, 1.0, -2.5));
  const roofFill = new THREE.PointLight(0xcdd8ee, 0, 30);
  roofFill.position.copy(STOP.roof).add(v(0, 7, 4));
  scene.add(fireLight, poolLight, roofFill);

  // fire particles
  const FIRE_N = 90;
  const fireGeo = track(new THREE.BufferGeometry());
  const firePos = new Float32Array(FIRE_N * 3);
  const fireSeed = new Float32Array(FIRE_N);
  for (let i = 0; i < FIRE_N; i++) {
    fireSeed[i] = Math.random();
    firePos[i * 3] = STOP.roof.x + 4.5 + (Math.random() - 0.5) * 0.8;
    firePos[i * 3 + 1] = STOP.roof.y + 0.3 + Math.random() * 0.9;
    firePos[i * 3 + 2] = STOP.roof.z - 4.5 + (Math.random() - 0.5) * 0.5;
  }
  fireGeo.setAttribute("position", new THREE.BufferAttribute(firePos, 3));
  const fireMat = track(
    new THREE.PointsMaterial({
      color: 0xff9a40,
      size: 0.14,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  scene.add(new THREE.Points(fireGeo, fireMat));

  // city skyline below & beyond the roof
  {
    const N = lowPower ? 90 : 170;
    const cityTex = track(cityWindowsTexture());
    const cityMat = track(new THREE.MeshBasicMaterial({ map: cityTex }));
    const inst = new THREE.InstancedMesh(
      track(new THREE.BoxGeometry(1, 1, 1)),
      cityMat,
      N
    );
    const m = new THREE.Matrix4();
    for (let i = 0; i < N; i++) {
      const cx = (Math.random() - 0.5) * 170;
      const cz = STOP.roof.z - 22 - Math.random() * 90;
      // keep a gap right behind the roof so the platform reads clearly
      const ch = 4 + Math.random() * 19;
      const cw = 2.5 + Math.random() * 4;
      m.makeScale(cw, ch, cw);
      m.setPosition(cx, ch / 2 - 2, cz);
      inst.setMatrixAt(i, m);
    }
    inst.instanceMatrix.needsUpdate = true;
    scene.add(inst);
  }

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

    /* Chapter weights drive every light & effect */
    const w0 = bell(f, 0), w1 = bell(f, 1), w2 = bell(f, 2), w3 = bell(f, 3);
    const w4 = bell(f, 4), w5 = bell(f, 5), w6 = bell(f, 6);

    // 0 · sign: gentle bob + neon pulse
    signGroup.position.y = STOP.sign.y + Math.sin(time * 0.8) * 0.15;
    const signPulse = 0.9 + Math.sin(time * 2.2) * 0.1;
    signLightA.intensity = 60 * w0 * signPulse;
    signLightB.intensity = 50 * w0 * signPulse;

    // 1 · dev room: lamp clicks on with a flicker, monitors hum
    const lampOn = w1 < 0.45 ? flicker(time, 1) : 1;
    lampLight.intensity = 26 * w1 * lampOn;
    monLight.intensity = 14 * w1;
    for (let i = 0; i < monitorMats.length; i++) {
      const hum = 0.85 + 0.15 * Math.sin(time * (3 + i) + i * 2.1);
      monitorMats[i].color.setScalar(0.75 + 0.45 * w1 * hum);
    }

    // 2 · corridor lights + LED blinking
    corrLightA.intensity = 90 * w2;
    corrLightB.intensity = 90 * w2;
    if (w2 > 0.02) {
      for (const led of leds) {
        led.mesh.visible =
          Math.sin(time * led.speed + led.phase) > -0.35;
      }
    }

    // 3 · spotlight snaps on over the guitar
    const spotOn = w3 < 0.4 ? flicker(time, 3) : 1;
    spot.intensity = 105 * w3 * spotOn;
    rimLight.intensity = 30 * w3;
    beamMat.opacity = 0.075 * w3 * spotOn;
    stage.rotation.y = Math.sin(time * 0.25) * 0.06;

    // 4 · garage: door opens, interior light, headlights flare, underglow,
    //     and the future car hovers off the slab
    const doorT = smoothstep(clamp01((w4 - 0.12) / 0.5));
    doorPivot.rotation.x = -doorT * 1.65;
    garageLight2.intensity = garageLight.intensity =
      55 * smoothstep(clamp01((w4 - 0.18) / 0.4));
    drivewayLight.intensity = 26 * doorT;
    const hlOn = w4 > 0.55 ? (w4 < 0.75 ? flicker(time, 4) : 1) : 0;
    for (const hl of headlights) hl.intensity = 40 * hlOn;
    headlightMatOn.opacity = 0.85 * hlOn;
    underglowMat.opacity = 0.5 * smoothstep(clamp01((w4 - 0.35) / 0.4)) *
      (0.85 + 0.15 * Math.sin(time * 3.2));
    superCar.position.y =
      0.12 + doorT * (0.22 + 0.08 * Math.sin(time * 1.6));

    // 5 · snow: aurora + moonlight + snowfall
    auroraMat.uniforms.uTime.value = time;
    auroraMat.uniforms.uIntensity.value = w5;
    moonLight.intensity = 170 * w5;
    boardLight.intensity = 12 * w5;
    if (w5 > 0.02 && !opts.reducedMotion) {
      const sp = snowGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < SNOW_N; i++) {
        sp[i * 3 + 1] -= snowSpeed[i] * dt;
        sp[i * 3] += Math.sin(time * 0.8 + i) * dt * 0.35;
        if (sp[i * 3 + 1] < 0) sp[i * 3 + 1] = 15 + Math.random() * 2;
      }
      snowGeo.attributes.position.needsUpdate = true;
    }

    // 6 · rooftop: fire flicker, pool shimmer, flames rise
    fireLight.intensity = (10 + 5 * Math.sin(time * 9) * Math.sin(time * 23)) * w6;
    poolLight.intensity = 14 * w6;
    roofFill.intensity = 48 * w6;
    poolMat.opacity = 0.7 + 0.15 * Math.sin(time * 1.8);
    fireMat.opacity = 0.9 * Math.min(1, w6 * 2);
    if (w6 > 0.02 && !opts.reducedMotion) {
      const fp2 = fireGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < FIRE_N; i++) {
        fp2[i * 3 + 1] += (0.9 + fireSeed[i]) * dt;
        fp2[i * 3] += Math.sin(time * 6 + fireSeed[i] * 40) * dt * 0.12;
        if (fp2[i * 3 + 1] > STOP.roof.y + 1.5 + fireSeed[i] * 0.6) {
          fp2[i * 3 + 1] = STOP.roof.y + 0.25;
          fp2[i * 3] = STOP.roof.x + 4.5 + (Math.random() - 0.5) * 0.8;
        }
      }
      fireGeo.attributes.position.needsUpdate = true;
    }

    stars.rotation.y = time * 0.004;

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
