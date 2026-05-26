"use client";

/**
 * CosmicBackground – fixed full-viewport WebGL scene that lives behind all content.
 *
 * Design (matches the reels Levan referenced)
 * ───────────────────────────────────────────
 * • One unified body of particles that is ALWAYS alive — every particle has
 *   its own constant drift / breathing motion, so the scene never feels frozen.
 * • As the user scrolls, the SAME particles smoothly *morph* between scene
 *   targets — orbital ring → energy sphere → particle column → nebula trail →
 *   wave ribbon → galaxy spiral.
 * • A deep starfield sits behind the morphing body and the camera slowly
 *   travels forward through it, giving the whole site the "travelling through
 *   space" feel.
 *
 * Performance
 * ───────────
 * • Single canvas / single renderer / single requestAnimationFrame loop.
 * • Respects prefers-reduced-motion (renders one static frame, no rAF).
 * • Caps DPR at 1.5 and uses smaller particle counts on phones.
 * • Tracks <html class="dark"> so light mode dims everything gracefully.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function CosmicBackground() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = window.innerWidth;
    let h = window.innerHeight;
    const isSmall = w < 700;

    // ── Renderer ────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // ── Scene / camera ──────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(72, w / h, 0.1, 4000);
    camera.position.set(0, 0, 520);

    // ── Theme tracking ──────────────────────────────────────────────────────
    let darkMode = document.documentElement.classList.contains("dark");
    const themeObserver = new MutationObserver(() => {
      darkMode = document.documentElement.classList.contains("dark");
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const circleSprite = makeCircleTexture();
    const glowSprite = makeGlowTexture();

    // ── 1. Starfield (deep background, camera flies through it) ─────────────
    const STAR_COUNT = isSmall ? 1500 : 3500;
    const TUNNEL_LEN = 2400;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(STAR_COUNT * 3);
    const starCol = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      const r = 220 + Math.random() * 1100;
      const a = Math.random() * Math.PI * 2;
      starPos[i * 3 + 0] = Math.cos(a) * r;
      starPos[i * 3 + 1] = Math.sin(a) * r;
      starPos[i * 3 + 2] = -Math.random() * TUNNEL_LEN + 300;

      const tint = Math.random();
      if (tint < 0.7) {
        starCol[i * 3 + 0] = 0.9 + Math.random() * 0.1;
        starCol[i * 3 + 1] = 0.92 + Math.random() * 0.08;
        starCol[i * 3 + 2] = 1.0;
      } else if (tint < 0.9) {
        starCol[i * 3 + 0] = 0.5;
        starCol[i * 3 + 1] = 0.75;
        starCol[i * 3 + 2] = 1.0;
      } else {
        starCol[i * 3 + 0] = 0.8;
        starCol[i * 3 + 1] = 0.55;
        starCol[i * 3 + 2] = 1.0;
      }
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute("color", new THREE.BufferAttribute(starCol, 3));
    const starMat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      map: circleSprite,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // ── 2. The morphing feature particle system ─────────────────────────────
    // Each particle has a stable per-particle random seed (u,v,r) that all
    // shape builders use, so the *same* particle goes to a logical place in
    // every shape. That's what makes the morph feel coherent rather than
    // chaotic.
    // Cranked up density — this is what gives the shapes "body" / soul.
    const N = isSmall ? 3200 : 9000;
    const u = new Float32Array(N);
    const v = new Float32Array(N);
    const r = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      u[i] = Math.random();
      v[i] = Math.random();
      r[i] = Math.random();
    }

    const shapes: Float32Array[] = [
      buildRing(N, u, v, r),
      buildSphere(N, u, v),
      buildColumn(N, u, v, r),
      buildNebula(N, u, v, r),
      buildWave(N, u, v),
      buildSpiral(N, u, v, r),
    ];
    const palettes: Float32Array[] = [
      colorRing(N, u),
      colorSphere(N, u, v),
      colorColumn(N, v, r),
      colorNebula(N, u, r),
      colorWave(N, u),
      colorSpiral(N, u),
    ];

    const featGeo = new THREE.BufferGeometry();
    const featPos = new Float32Array(N * 3);
    const featCol = new Float32Array(N * 3);
    featPos.set(shapes[0]);
    featCol.set(palettes[0]);
    const posAttr = new THREE.BufferAttribute(featPos, 3);
    const colAttr = new THREE.BufferAttribute(featCol, 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    colAttr.setUsage(THREE.DynamicDrawUsage);
    featGeo.setAttribute("position", posAttr);
    featGeo.setAttribute("color", colAttr);

    const featMat = new THREE.PointsMaterial({
      size: 4.2,
      vertexColors: true,
      map: circleSprite,
      transparent: true,
      opacity: 1.0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const feature = new THREE.Points(featGeo, featMat);
    scene.add(feature);

    // Bloom layer — a sparse set of LARGE soft points that overlap the main
    // particles to fake bloom/halo and add genuine "glow" to bright zones.
    const BLOOM_N = isSmall ? 220 : 480;
    const bloomGeo = new THREE.BufferGeometry();
    const bloomPos = new Float32Array(BLOOM_N * 3);
    const bloomCol = new Float32Array(BLOOM_N * 3);
    // Bloom particles cherry-pick a subset of the main seeds, so they live
    // exactly on bright zones in every shape.
    const bloomIdx = new Uint32Array(BLOOM_N);
    for (let i = 0; i < BLOOM_N; i++) {
      bloomIdx[i] = Math.floor(Math.random() * N);
    }
    const bloomPosAttr = new THREE.BufferAttribute(bloomPos, 3);
    const bloomColAttr = new THREE.BufferAttribute(bloomCol, 3);
    bloomPosAttr.setUsage(THREE.DynamicDrawUsage);
    bloomColAttr.setUsage(THREE.DynamicDrawUsage);
    bloomGeo.setAttribute("position", bloomPosAttr);
    bloomGeo.setAttribute("color", bloomColAttr);
    const bloomMat = new THREE.PointsMaterial({
      size: 22,
      vertexColors: true,
      map: glowSprite,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const bloom = new THREE.Points(bloomGeo, bloomMat);
    scene.add(bloom);

    // Glowing core sprite — bright during the orbital-ring phase, fades out
    const coreMat = new THREE.SpriteMaterial({
      map: glowSprite,
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const core = new THREE.Sprite(coreMat);
    core.scale.set(280, 280, 1);
    scene.add(core);

    // ── Scroll tracking (smoothed) ──────────────────────────────────────────
    let scrollProgress = 0;
    let targetScroll = 0;
    const updateScroll = () => {
      const doc = document.documentElement;
      const max = Math.max(1, doc.scrollHeight - window.innerHeight);
      targetScroll = Math.min(1, Math.max(0, window.scrollY / max));
    };
    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });

    // ── Mouse parallax ──────────────────────────────────────────────────────
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMouseMove = (e: MouseEvent) => {
      mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    // ── Resize ──────────────────────────────────────────────────────────────
    const onResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    // ── Animation loop ──────────────────────────────────────────────────────
    const clock = new THREE.Clock();
    let rafId = 0;
    let time = 0;

    const render = () => {
      const dt = Math.min(0.05, clock.getDelta() || 0.016);
      time += dt;

      // Smooth scroll progress so morphs feel buttery
      scrollProgress += (targetScroll - scrollProgress) * 0.07;

      // Camera flies slowly forward as the page scrolls
      const targetZ = 520 - scrollProgress * 220;
      camera.position.z += (targetZ - camera.position.z) * 0.05;
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      camera.position.x = mouse.x * 35;
      camera.position.y = -mouse.y * 22;
      camera.lookAt(0, 0, 0);

      // Recycle starfield around the camera so it always feels infinite
      const sp = stars.geometry.attributes.position.array as Float32Array;
      const camZ = camera.position.z;
      for (let i = 0; i < STAR_COUNT; i++) {
        const z = sp[i * 3 + 2];
        if (z > camZ + 80) sp[i * 3 + 2] = z - TUNNEL_LEN;
        else if (z < camZ - TUNNEL_LEN + 80) sp[i * 3 + 2] = z + TUNNEL_LEN;
      }
      stars.geometry.attributes.position.needsUpdate = true;
      stars.rotation.z = time * 0.004;

      // ── Morph the feature body ───────────────────────────────────────────
      const segs = shapes.length - 1;
      const idx = Math.min(segs - 0.0001, scrollProgress * segs);
      const i0 = Math.floor(idx);
      const i1 = Math.min(segs, i0 + 1);
      const eased = easeInOutCubic(idx - i0);
      const A = shapes[i0];
      const B = shapes[i1];
      const CA = palettes[i0];
      const CB = palettes[i1];

      // Per-shape flow weights — blended by morph progress so motion feels
      // shape-appropriate (column cascades down, nebula drifts sideways, etc).
      // This is the per-shape "soul" — particles don't just wobble, they FLOW.
      const wRing = shapeWeight(idx, 0);
      // wSphere not used directly — sphere uses pure breath/rotation
      const wColumn = shapeWeight(idx, 2);
      const wNebula = shapeWeight(idx, 3);
      const wWave = shapeWeight(idx, 4);

      const cascadeAmt = wColumn; // particles streaming downward in column
      const nebulaAmt = wNebula; // particles drifting along the nebula trail
      const waveAmt = wWave; // particles drifting through wave field

      const cascadeSpeed = 90; // px/sec
      const nebulaSpeed = 70;

      // Per-particle live wobble + per-shape flow — runs every frame.
      for (let i = 0; i < N; i++) {
        const i3 = i * 3;
        const phase = r[i] * 6.2831853;
        const sp1 = 0.55 + r[i] * 0.6;
        const sp2 = 0.4 + u[i] * 0.5;
        const wob = 5 + r[i] * 9;
        const wobX = Math.sin(time * sp1 + phase) * wob;
        const wobY = Math.cos(time * sp2 + phase * 1.3) * wob;
        const wobZ =
          Math.sin(time * (0.35 + v[i] * 0.4) + phase * 0.7) * wob * 0.6;

        // Column cascade — vertical wrap from +360 to -360
        const colFlowY = cascadeAmt
          ? -(((time * cascadeSpeed * (0.7 + r[i] * 0.6) + v[i] * 720) %
              720) -
              360)
          : 0;
        // Nebula drift — horizontal wrap
        const nebFlowX = nebulaAmt
          ? -(((time * nebulaSpeed * (0.7 + r[i] * 0.5) + u[i] * 1000) %
              1000) -
              500)
          : 0;
        // Wave drift — slow Z motion within the wave field
        const wavFlowZ = waveAmt
          ? Math.sin(time * 0.8 + u[i] * 6.28) * 18
          : 0;

        const ax = A[i3], ay = A[i3 + 1], az = A[i3 + 2];
        const bx = B[i3], by = B[i3 + 1], bz = B[i3 + 2];
        featPos[i3] = ax + (bx - ax) * eased + wobX + nebFlowX * nebulaAmt;
        featPos[i3 + 1] =
          ay + (by - ay) * eased + wobY + colFlowY * cascadeAmt;
        featPos[i3 + 2] =
          az + (bz - az) * eased + wobZ + wavFlowZ * waveAmt;

        featCol[i3] = CA[i3] + (CB[i3] - CA[i3]) * eased;
        featCol[i3 + 1] = CA[i3 + 1] + (CB[i3 + 1] - CA[i3 + 1]) * eased;
        featCol[i3 + 2] = CA[i3 + 2] + (CB[i3 + 2] - CA[i3 + 2]) * eased;
      }
      featGeo.attributes.position.needsUpdate = true;
      featGeo.attributes.color.needsUpdate = true;

      // Bloom layer reads the main particle positions/colors directly so it
      // always sits on the *brightest* zones of the current shape.
      const bloomPulse = 0.85 + Math.sin(time * 1.8) * 0.15;
      for (let i = 0; i < BLOOM_N; i++) {
        const src = bloomIdx[i] * 3;
        const dst = i * 3;
        bloomPos[dst] = featPos[src];
        bloomPos[dst + 1] = featPos[src + 1];
        bloomPos[dst + 2] = featPos[src + 2];
        bloomCol[dst] = featCol[src] * bloomPulse;
        bloomCol[dst + 1] = featCol[src + 1] * bloomPulse;
        bloomCol[dst + 2] = featCol[src + 2] * bloomPulse;
      }
      bloomGeo.attributes.position.needsUpdate = true;
      bloomGeo.attributes.color.needsUpdate = true;

      // Whole-body rotation — base drift, plus extra spin during ring/spiral
      // phases (those shapes feel "alive" with orbit motion).
      const wSpiral = shapeWeight(idx, 5);
      const spinBoost = wRing * 0.18 + wSpiral * 0.22;
      feature.rotation.y = time * (0.06 + spinBoost);
      feature.rotation.x = Math.sin(time * 0.18) * 0.04;

      // Core glow — pulses, brightest in ring + spiral phases
      const ringWeight = Math.max(0, 1 - Math.min(1, scrollProgress / 0.18));
      const spiralWeight = Math.max(0, (scrollProgress - 0.85) / 0.15);
      const themeMul = darkMode ? 1.0 : 0.4;
      const pulse = 0.85 + Math.sin(time * 1.5) * 0.15;
      coreMat.opacity =
        Math.max(ringWeight, spiralWeight) * 0.95 * themeMul * pulse;

      starMat.opacity = 0.9 * themeMul;
      featMat.opacity = 1.0 * themeMul;
      bloomMat.opacity = 0.55 * themeMul * pulse;

      renderer.render(scene, camera);
      if (!reduced) rafId = requestAnimationFrame(render);
    };

    if (reduced) renderer.render(scene, camera);
    else rafId = requestAnimationFrame(render);

    // ── Cleanup ─────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", updateScroll);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      themeObserver.disconnect();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      starGeo.dispose();
      starMat.dispose();
      featGeo.dispose();
      featMat.dispose();
      bloomGeo.dispose();
      bloomMat.dispose();
      coreMat.dispose();
      circleSprite.dispose();
      glowSprite.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        touchAction: "none",
        // Ambient color wash that sits behind the canvas — adds mood/warmth
        // even when the active shape has no particles in that screen area.
        background:
          "radial-gradient(60% 50% at 50% 25%, rgba(120, 60, 220, 0.22), transparent 70%), " +
          "radial-gradient(55% 45% at 80% 80%, rgba(30, 160, 230, 0.18), transparent 70%), " +
          "radial-gradient(50% 40% at 15% 70%, rgba(220, 70, 160, 0.14), transparent 70%)",
      }}
    />
  );
}

/* ── Shape builders ────────────────────────────────────────────────────────
 * Every shape consumes the same per-particle (u, v, r) seeds so the morph
 * between any two shapes feels coherent — each particle moves from "its
 * place" in shape A to "its place" in shape B.
 */

function buildRing(
  N: number,
  u: Float32Array,
  v: Float32Array,
  r: Float32Array
) {
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const onRing = r[i] < 0.82;
    if (onRing) {
      const a = u[i] * Math.PI * 2;
      const wobble = (v[i] - 0.5) * 32;
      const ringR = 210 + wobble;
      pos[i * 3] = Math.cos(a) * ringR;
      pos[i * 3 + 1] =
        Math.sin(a) * ringR * 0.28 + (v[i] - 0.5) * 10;
      pos[i * 3 + 2] = Math.sin(a) * ringR * 0.95;
    } else {
      // Satellites floating around the ring
      const a = u[i] * Math.PI * 2;
      const rr = 290 + r[i] * 200;
      const ph = (v[i] - 0.5) * Math.PI * 0.5;
      pos[i * 3] = Math.cos(a) * Math.cos(ph) * rr;
      pos[i * 3 + 1] = Math.sin(ph) * rr * 0.4;
      pos[i * 3 + 2] = Math.sin(a) * Math.cos(ph) * rr;
    }
  }
  return pos;
}

function buildSphere(
  N: number,
  u: Float32Array,
  v: Float32Array
) {
  const pos = new Float32Array(N * 3);
  const R = 195;
  for (let i = 0; i < N; i++) {
    const phi = Math.acos(2 * u[i] - 1);
    const theta = 2 * Math.PI * v[i];
    pos[i * 3] = R * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = R * Math.sin(phi) * Math.sin(theta);
    pos[i * 3 + 2] = R * Math.cos(phi);
  }
  return pos;
}

function buildColumn(
  N: number,
  u: Float32Array,
  v: Float32Array,
  r: Float32Array
) {
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const a = u[i] * Math.PI * 2;
    const radius = Math.pow(r[i], 0.55) * 85;
    pos[i * 3] = Math.cos(a) * radius;
    pos[i * 3 + 1] = (v[i] - 0.5) * 720;
    pos[i * 3 + 2] = Math.sin(a) * radius;
  }
  return pos;
}

function buildNebula(
  N: number,
  u: Float32Array,
  v: Float32Array,
  r: Float32Array
) {
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const t = u[i];
    const cx = (t - 0.5) * 1000;
    const cy = Math.sin(t * Math.PI * 1.5) * 80 + (v[i] - 0.5) * 70;
    const cz = Math.cos(t * Math.PI * 2.0) * 110 - 40;
    const jitter = (r[i] - 0.5) * 90;
    const ja = v[i] * Math.PI * 2;
    pos[i * 3] = cx + jitter * Math.cos(ja);
    pos[i * 3 + 1] = cy + jitter * 0.35;
    pos[i * 3 + 2] = cz + jitter * Math.sin(ja);
  }
  return pos;
}

function buildWave(
  N: number,
  u: Float32Array,
  v: Float32Array
) {
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const x = (u[i] - 0.5) * 950;
    const z = (v[i] - 0.5) * 540;
    const d = Math.sqrt(x * x + z * z);
    const y = Math.sin(d * 0.012) * 38 - 70;
    pos[i * 3] = x;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = z;
  }
  return pos;
}

function buildSpiral(
  N: number,
  u: Float32Array,
  v: Float32Array,
  r: Float32Array
) {
  const pos = new Float32Array(N * 3);
  const arms = 3;
  for (let i = 0; i < N; i++) {
    const arm = Math.floor(r[i] * arms);
    const t = u[i];
    const armR = 30 + t * 290;
    const a = t * Math.PI * 3.2 + (arm / arms) * Math.PI * 2;
    const spread = (v[i] - 0.5) * 45 * (1 - t * 0.7);
    pos[i * 3] = Math.cos(a) * armR + spread * Math.cos(a + Math.PI / 2);
    pos[i * 3 + 1] = (v[i] - 0.5) * 24;
    pos[i * 3 + 2] = Math.sin(a) * armR + spread * Math.sin(a + Math.PI / 2);
  }
  return pos;
}

/* ── Color palettes (one per shape, same length as positions) ───────────── */

function colorRing(N: number, u: Float32Array) {
  const col = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const c = ringSweep(u[i]);
    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
  }
  return col;
}

function colorSphere(N: number, u: Float32Array, v: Float32Array) {
  // Hot pink/red at the top → vivid cyan at the bottom (matches the reel).
  // v sweeps from 0..1 across "latitude" since buildSphere uses v for theta;
  // we use u (which feeds phi) to drive vertical position instead — phi = acos(2u-1),
  // so u=0 is top, u=1 is bottom.
  const col = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const t = u[i]; // 0 = north pole, 1 = south
    // top: hot magenta (1.0, 0.25, 0.85) — bottom: bright cyan (0.15, 0.95, 1.0)
    col[i * 3] = 1.0 - t * 0.85;
    col[i * 3 + 1] = 0.25 + t * 0.7;
    col[i * 3 + 2] = 0.85 + t * 0.15;
    // Sprinkle a little randomness so it doesn't band
    const j = (v[i] - 0.5) * 0.1;
    col[i * 3] = Math.min(1, Math.max(0, col[i * 3] + j));
  }
  return col;
}

function colorColumn(N: number, v: Float32Array, r: Float32Array) {
  // Cascade colour — pink at the top, magenta in the middle, electric blue at
  // the bottom. v is the vertical seed (used by buildColumn).
  const col = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const t = v[i]; // 0..1 along height
    const jitter = (r[i] - 0.5) * 0.2;
    // Three-stop gradient: pink (1.0, 0.4, 0.9) → magenta (0.8, 0.25, 1.0) → cyan (0.2, 0.85, 1.0)
    let R, G, B;
    if (t < 0.5) {
      const lt = t * 2;
      R = 1.0 + (0.8 - 1.0) * lt;
      G = 0.4 + (0.25 - 0.4) * lt;
      B = 0.9 + (1.0 - 0.9) * lt;
    } else {
      const lt = (t - 0.5) * 2;
      R = 0.8 + (0.2 - 0.8) * lt;
      G = 0.25 + (0.85 - 0.25) * lt;
      B = 1.0;
    }
    col[i * 3] = Math.min(1, Math.max(0, R + jitter));
    col[i * 3 + 1] = Math.min(1, Math.max(0, G + jitter));
    col[i * 3 + 2] = Math.min(1, Math.max(0, B + jitter));
  }
  return col;
}

function colorNebula(N: number, u: Float32Array, r: Float32Array) {
  // Teal/cyan dominant flow with hot pink accents — matches FLOW reel.
  const col = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const t = u[i];
    const accent = r[i] > 0.85 ? 1 : 0; // 15% of particles are pink accents
    if (accent) {
      col[i * 3] = 1.0;
      col[i * 3 + 1] = 0.35;
      col[i * 3 + 2] = 0.8;
    } else {
      col[i * 3] = 0.15 + (1 - t) * 0.25;
      col[i * 3 + 1] = 0.7 + (1 - t) * 0.3;
      col[i * 3 + 2] = 1.0;
    }
  }
  return col;
}

function colorWave(N: number, u: Float32Array) {
  // VOYAGE reel — bright electric blue on the left sweeping through magenta to
  // hot red on the right. Very saturated.
  const col = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const t = u[i];
    // 3-stop: blue (0.15, 0.55, 1.0) → magenta (1.0, 0.25, 0.95) → red (1.0, 0.35, 0.45)
    let R, G, B;
    if (t < 0.5) {
      const lt = t * 2;
      R = 0.15 + (1.0 - 0.15) * lt;
      G = 0.55 + (0.25 - 0.55) * lt;
      B = 1.0 + (0.95 - 1.0) * lt;
    } else {
      const lt = (t - 0.5) * 2;
      R = 1.0;
      G = 0.25 + (0.35 - 0.25) * lt;
      B = 0.95 + (0.45 - 0.95) * lt;
    }
    col[i * 3] = R;
    col[i * 3 + 1] = G;
    col[i * 3 + 2] = B;
  }
  return col;
}

function colorSpiral(N: number, u: Float32Array) {
  // Galaxy core: hot white-pink core fading to electric violet at the arms.
  const col = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const t = u[i]; // 0 at center, 1 at arm tip
    col[i * 3] = 1.0 - t * 0.4; // white-pink → violet
    col[i * 3 + 1] = 0.55 - t * 0.3;
    col[i * 3 + 2] = 0.95 + (1 - t) * 0.05;
  }
  return col;
}

/* ── Tiny helpers ──────────────────────────────────────────────────────── */

function ringSweep(t: number) {
  // Vivid 4-stop sweep matching the COSMOS reel.
  const stops = [
    { p: 0.0, c: [0.15, 0.85, 1.0] }, // electric cyan
    { p: 0.33, c: [1.0, 0.3, 0.9] }, // hot magenta
    { p: 0.66, c: [0.55, 0.25, 1.0] }, // violet
    { p: 1.0, c: [0.15, 0.85, 1.0] }, // wrap back to cyan
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (t >= a.p && t <= b.p) {
      const lt = (t - a.p) / (b.p - a.p);
      return {
        r: a.c[0] + (b.c[0] - a.c[0]) * lt,
        g: a.c[1] + (b.c[1] - a.c[1]) * lt,
        b: a.c[2] + (b.c[2] - a.c[2]) * lt,
      };
    }
  }
  return { r: 0.5, g: 0.5, b: 1.0 };
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Bell weight for "how much are we currently in shape `shapeIdx`?". */
function shapeWeight(morphIdx: number, shapeIdx: number) {
  const d = morphIdx - shapeIdx;
  return Math.max(0, 1 - Math.abs(d));
}

function makeCircleTexture(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.35, "rgba(255,255,255,0.55)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function makeGlowTexture(): THREE.Texture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  grad.addColorStop(0, "rgba(255,255,255,0.9)");
  grad.addColorStop(0.25, "rgba(180,210,255,0.45)");
  grad.addColorStop(0.55, "rgba(120,140,255,0.18)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}
