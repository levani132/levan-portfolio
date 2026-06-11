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
    // We switch the particle blending mode based on theme:
    //   Dark mode  → AdditiveBlending  (particles glow / accumulate brightness)
    //   Light mode → NormalBlending    (particles paint as discrete coloured
    //                                    dots over white; additive would just
    //                                    blow out to white)
    let darkMode = document.documentElement.classList.contains("dark");
    // Materials to keep in sync with the theme — they get pushed into this
    // array as they're created below.
    const themedMaterials: THREE.ShaderMaterial[] = [];
    const applyThemeBlending = () => {
      const mode = darkMode
        ? THREE.AdditiveBlending
        : THREE.NormalBlending;
      for (const m of themedMaterials) {
        m.blending = mode;
        m.needsUpdate = true;
      }
    };
    const themeObserver = new MutationObserver(() => {
      darkMode = document.documentElement.classList.contains("dark");
      applyThemeBlending();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const glowSprite = makeGlowTexture();
    const pixelRatio = renderer.getPixelRatio();

    // ── 1. Starfield (deep background, camera flies through it) ─────────────
    const STAR_COUNT = 3500;
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
    // Per-star size variety + twinkle phase — a few big bright stars among
    // many faint ones reads far more "real sky" than uniform dots.
    const starScale = new Float32Array(STAR_COUNT);
    const starPhase = new Float32Array(STAR_COUNT);
    for (let i = 0; i < STAR_COUNT; i++) {
      const big = Math.random();
      starScale[i] = big > 0.96 ? 1.8 + Math.random() : 0.45 + Math.random();
      starPhase[i] = Math.random() * 10;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute("color", new THREE.BufferAttribute(starCol, 3));
    starGeo.setAttribute("aScale", new THREE.BufferAttribute(starScale, 1));
    starGeo.setAttribute("aPhase", new THREE.BufferAttribute(starPhase, 1));
    const starMat = makeParticleMaterial({
      size: 3.4,
      opacity: 0.9,
      twinkle: 0.85,
      soft: 0,
      pixelRatio,
    });
    themedMaterials.push(starMat);
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // ── 2. The morphing feature particle field ──────────────────────────────
    // Particles are organized on a regular NUM_U × NUM_V grid. NUM_U is the
    // along-strand density (e.g. for the sphere it's the number of points
    // around each latitude ring); NUM_V is the number of strands themselves.
    //
    // We make NUM_U large so that within a strand, particles sit close
    // enough together that — with their coherent wobble — they visually
    // read as continuous glowing lines without ever drawing a real line.
    //
    // Each particle has stable seeds:
    //   u[i] = position along its strand   (0..1)
    //   v[i] = which strand                 (0..1)
    //   r[i] = random jitter (stable per particle)
    const NUM_U = 200;
    const NUM_V = 42;
    const N = NUM_U * NUM_V; // 3080 mobile, 8400 desktop

    const u = new Float32Array(N);
    const v = new Float32Array(N);
    const r = new Float32Array(N);
    for (let iv = 0; iv < NUM_V; iv++) {
      for (let iu = 0; iu < NUM_U; iu++) {
        const i = iv * NUM_U + iu;
        u[i] = iu / (NUM_U - 1);
        v[i] = iv / (NUM_V - 1);
        r[i] = Math.random();
      }
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
      colorRing(N, u, r),
      colorSphere(N, u, v, r),
      colorColumn(N, v, r),
      colorNebula(N, u, r),
      colorWave(N, u, r),
      // Spiral colours by horizontal position so left=blue, right=red
      colorSpiral(N, u, r, shapes[5]),
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
    // Per-particle size + twinkle phase. Core and halo share the geometry,
    // so each particle's spark and its bloom twinkle in perfect sync.
    const featScale = new Float32Array(N);
    const featPhase = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      featScale[i] = 0.65 + r[i] * 0.9;
      featPhase[i] = ((r[i] * 997.13) % 1) * 10;
    }
    featGeo.setAttribute("aScale", new THREE.BufferAttribute(featScale, 1));
    featGeo.setAttribute("aPhase", new THREE.BufferAttribute(featPhase, 1));

    // Particles — tight bright sparks rendered by a custom shader: procedural
    // radial falloff (no texture fetch), per-particle size variety, and a
    // gentle brightness/size twinkle. Pure-primary colors keep hue stable
    // when 2–3 overlap additively.
    const featMat = makeParticleMaterial({
      size: 4.4,
      opacity: 1.0,
      twinkle: 0.4,
      soft: 0,
      pixelRatio,
    });
    themedMaterials.push(featMat);

    // ── Halo layer ──────────────────────────────────────────────────────────
    // Shares the same geometry (position + color attributes) as the core
    // layer, so each particle automatically has BOTH a bright spark core
    // AND a wider soft halo sitting underneath. Together they read as the
    // reel-style "bright glowing star" instead of a flat dot.
    const haloMat = makeParticleMaterial({
      // Wide radius spreads each particle's glow into soft bloom; low opacity
      // keeps total light per particle similar — wider but gentler.
      size: 34,
      opacity: 0.22,
      twinkle: 0.4,
      soft: 1,
      pixelRatio,
    });
    themedMaterials.push(haloMat);
    const halo = new THREE.Points(featGeo, haloMat);
    const feature = new THREE.Points(featGeo, featMat);
    // Both layers go inside a single Group so they share the same rotation
    // transform — otherwise rotating only `feature` makes the halos lag
    // behind the cores and the visuals separate.
    const featureGroup = new THREE.Group();
    featureGroup.add(halo); // halo first → cores render on top of halos
    featureGroup.add(feature);
    scene.add(featureGroup);

    // Apply current theme's blending mode now that all materials exist.
    applyThemeBlending();

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

    // ── Shooting stars ──────────────────────────────────────────────────────
    // A small pool of comets that occasionally streak across the deep field.
    // Each is a Line whose trail fades to black along its length — under
    // additive blending black is invisible, so we get per-vertex alpha for
    // free. The trail needs no history: it's just pos - vel * k.
    const COMET_COUNT = 5;
    const TRAIL = 24;
    interface Comet {
      line: THREE.Line;
      posArr: Float32Array;
      colArr: Float32Array;
      pos: THREE.Vector3;
      vel: THREE.Vector3;
      tint: THREE.Color;
      life: number;
      maxLife: number;
      delay: number;
    }
    const cometMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const comets: Comet[] = [];
    for (let i = 0; i < COMET_COUNT; i++) {
      const geo = new THREE.BufferGeometry();
      const posArr = new Float32Array(TRAIL * 3);
      const colArr = new Float32Array(TRAIL * 3);
      const pa = new THREE.BufferAttribute(posArr, 3);
      const ca = new THREE.BufferAttribute(colArr, 3);
      pa.setUsage(THREE.DynamicDrawUsage);
      ca.setUsage(THREE.DynamicDrawUsage);
      geo.setAttribute("position", pa);
      geo.setAttribute("color", ca);
      const line = new THREE.Line(geo, cometMat);
      line.visible = false;
      line.frustumCulled = false;
      scene.add(line);
      comets.push({
        line,
        posArr,
        colArr,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        tint: new THREE.Color(),
        life: 0,
        maxLife: 0,
        delay: 2 + Math.random() * 8,
      });
    }
    const launchComet = (c: Comet) => {
      const side = Math.random() < 0.5 ? -1 : 1;
      c.pos.set(
        side * (150 + Math.random() * 450),
        180 + Math.random() * 260,
        camera.position.z - 500 - Math.random() * 400
      );
      c.vel.set(
        -side * (260 + Math.random() * 320),
        -(180 + Math.random() * 260),
        (Math.random() - 0.5) * 120
      );
      // Cool white-blue, occasionally warm
      if (Math.random() < 0.25) c.tint.setRGB(1.0, 0.8, 0.55);
      else c.tint.setRGB(0.75 + Math.random() * 0.25, 0.9, 1.0);
      c.life = 0;
      c.maxLife = 1.4 + Math.random() * 1.2;
    };
    const updateComets = (dt: number) => {
      for (const c of comets) {
        if (c.delay > 0) {
          c.delay -= dt;
          if (c.delay <= 0) launchComet(c);
          else continue;
        }
        c.life += dt;
        if (c.life >= c.maxLife) {
          c.line.visible = false;
          c.delay = 4 + Math.random() * 10;
          continue;
        }
        c.pos.addScaledVector(c.vel, dt);
        // Fade in fast, fade out slow over the comet's life
        const lt = c.life / c.maxLife;
        const env = Math.sin(Math.PI * Math.min(1, lt)) ** 0.7;
        for (let j = 0; j < TRAIL; j++) {
          const k = j * 0.014;
          c.posArr[j * 3] = c.pos.x - c.vel.x * k;
          c.posArr[j * 3 + 1] = c.pos.y - c.vel.y * k;
          c.posArr[j * 3 + 2] = c.pos.z - c.vel.z * k;
          const fade = env * (1 - j / TRAIL) ** 2;
          c.colArr[j * 3] = c.tint.r * fade;
          c.colArr[j * 3 + 1] = c.tint.g * fade;
          c.colArr[j * 3 + 2] = c.tint.b * fade;
        }
        c.line.geometry.attributes.position.needsUpdate = true;
        c.line.geometry.attributes.color.needsUpdate = true;
        // Additive trails over white wash out — comets are dark-mode only
        c.line.visible = darkMode;
      }
    };

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

    // ── Mouse parallax + particle repulsion ─────────────────────────────────
    const mouse = { x: 0, y: 0, tx: 0, ty: 0, active: false };
    const onMouseMove = (e: MouseEvent) => {
      mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
      mouse.active = true;
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    // Scratch objects for projecting the cursor onto the z=0 plane and
    // transforming it into the rotating feature group's local space.
    const _mNdc = new THREE.Vector3();
    const _mDir = new THREE.Vector3();
    const _mWorld = new THREE.Vector3();
    const _mLocal = new THREE.Vector3();
    const _mInv = new THREE.Matrix4();
    const REPEL_R = 110;
    const REPEL_R2 = REPEL_R * REPEL_R;
    const REPEL_STRENGTH = 46;

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
    let lastFrame = performance.now();
    let rafId = 0;
    let time = 0;
    // Accumulated rotation — incremental so we can vary the rate per shape
    // without the rotation snapping back to time*speed when speed changes.
    let rotY = 0;

    const render = () => {
      const nowMs = performance.now();
      const dt = Math.min(0.05, (nowMs - lastFrame) / 1000 || 0.016);
      lastFrame = nowMs;
      time += dt;

      starMat.uniforms.uTime.value = time;
      featMat.uniforms.uTime.value = time;
      haloMat.uniforms.uTime.value = time;

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

      // Cascade disabled — the column shape is now a DNA helix, and adding
      // a downward stream on top would smear the strand structure into a
      // waterfall. Keep nebula / wave drifts since those shapes benefit.
      const cascadeAmt = 0;
      const nebulaAmt = wNebula;
      const waveAmt = wWave;

      const cascadeSpeed = 0;
      const nebulaSpeed = 70;

      // Project the cursor onto the z=0 plane, then into the rotating
      // group's local space, so repulsion can run directly on featPos.
      let repel = false;
      if (mouse.active) {
        _mNdc.set(mouse.x, -mouse.y, 0.5).unproject(camera);
        _mDir.copy(_mNdc).sub(camera.position).normalize();
        if (Math.abs(_mDir.z) > 1e-4) {
          const tPlane = -camera.position.z / _mDir.z;
          _mWorld.copy(camera.position).addScaledVector(_mDir, tPlane);
          featureGroup.updateMatrixWorld();
          _mInv.copy(featureGroup.matrixWorld).invert();
          _mLocal.copy(_mWorld).applyMatrix4(_mInv);
          repel = true;
        }
      }
      const mlx = _mLocal.x,
        mly = _mLocal.y,
        mlz = _mLocal.z;

      // Per-particle live wobble + per-shape flow — runs every frame.
      // The wobble is "strand-coherent": neighbors in the same strand share
      // similar phase, so the dense strands of particles undulate together
      // like traveling waves on a string. u[i] drives spatial waves along
      // the strand, v[i] drives strand-to-strand phase offset.
      // Amplitude is kept small so strands read as lines, not clouds.
      // During the column (DNA) phase we damp wobble somewhat so the helix
      // structure stays legible while still breathing slightly.
      const wobDamp = 1 - wColumn * 0.4;
      for (let i = 0; i < N; i++) {
        const i3 = i * 3;
        const strandPhase = v[i] * 6.2831853 * 2;
        const wavePhase = u[i] * 6.2831853 * 3;
        const wob = (2 + r[i] * 3) * wobDamp;
        const wobX =
          Math.sin(time * 0.7 + strandPhase + wavePhase) * wob;
        const wobY =
          Math.cos(time * 0.55 + strandPhase * 1.3 + wavePhase) * wob * 0.8;
        const wobZ =
          Math.sin(time * 0.4 + strandPhase * 0.7 + wavePhase * 0.8) *
          wob *
          0.6;

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

        // Cursor repulsion — particles near the mouse get gently pushed
        // aside with a smooth falloff, like parting a cloud of fireflies.
        if (repel) {
          const dxm = featPos[i3] - mlx;
          const dym = featPos[i3 + 1] - mly;
          const dzm = featPos[i3 + 2] - mlz;
          const d2 = dxm * dxm + dym * dym + dzm * dzm;
          if (d2 < REPEL_R2 && d2 > 1e-6) {
            const d = Math.sqrt(d2);
            const f = 1 - d / REPEL_R;
            const push = (f * f * REPEL_STRENGTH) / d;
            featPos[i3] += dxm * push;
            featPos[i3 + 1] += dym * push;
            featPos[i3 + 2] += dzm * push;
          }
        }

        featCol[i3] = CA[i3] + (CB[i3] - CA[i3]) * eased;
        featCol[i3 + 1] = CA[i3 + 1] + (CB[i3 + 1] - CA[i3 + 1]) * eased;
        featCol[i3 + 2] = CA[i3 + 2] + (CB[i3 + 2] - CA[i3 + 2]) * eased;
      }
      featGeo.attributes.position.needsUpdate = true;
      featGeo.attributes.color.needsUpdate = true;

      // Whole-body rotation — base drift, plus extra spin during ring/spiral
      // phases (those shapes feel "alive" with orbit motion).
      const wSpiral = shapeWeight(idx, 5);
      // Spin: faster for ring/spiral, gentler during the DNA column phase
      // so the helix structure is legible but still feels alive.
      // Applied to the GROUP so cores + halos rotate together.
      const baseSpin = 0.06 + wRing * 0.18 + wSpiral * 0.22;
      const columnSpin = 0.07; // dedicated slow spin for DNA viewing
      const spinSpeed = baseSpin * (1 - wColumn) + columnSpin * wColumn;
      rotY += dt * spinSpeed;
      featureGroup.rotation.y = rotY;
      featureGroup.rotation.x =
        Math.sin(time * 0.18) * 0.04 * (1 - wColumn * 0.6);

      // Core glow — pulses, brightest in ring + spiral phases
      const ringWeight = Math.max(0, 1 - Math.min(1, scrollProgress / 0.18));
      const spiralWeight = Math.max(0, (scrollProgress - 0.85) / 0.15);
      const pulse = 0.85 + Math.sin(time * 1.5) * 0.15;

      if (darkMode) {
        coreMat.opacity =
          Math.max(ringWeight, spiralWeight) * 0.95 * pulse;
        starMat.uniforms.uOpacity.value = 0.9;
        featMat.uniforms.uOpacity.value = 1.0;
        haloMat.uniforms.uOpacity.value = 0.22; // wide radius, gentle intensity
      } else {
        // Light mode: normal blending paints colored dots over white. We
        // need higher per-particle opacity (no additive accumulation) but
        // hide the additive-only effects (stars / core glow / halo).
        coreMat.opacity = 0;
        starMat.uniforms.uOpacity.value = 0;
        featMat.uniforms.uOpacity.value = 0.85;
        haloMat.uniforms.uOpacity.value = 0; // additive bloom doesn't work over white
      }

      updateComets(dt);

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
      haloMat.dispose();
      coreMat.dispose();
      cometMat.dispose();
      for (const c of comets) c.line.geometry.dispose();
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
  // Grid layout: each row (v) is a concentric ring at a different radius;
  // each column (u) is an angular position around the ring.
  // Warp lines wrap around each ring; weft lines connect concentric rings.
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const a = u[i] * Math.PI * 2;
    // Radius spreads across rows; centered around ~210
    const ringR = 150 + v[i] * 130 + (r[i] - 0.5) * 4;
    const tilt = 0.28; // ellipse squish for the perspective look
    pos[i * 3] = Math.cos(a) * ringR;
    pos[i * 3 + 1] = Math.sin(a) * ringR * tilt + (v[i] - 0.5) * 12;
    pos[i * 3 + 2] = Math.sin(a) * ringR * 0.95;
  }
  return pos;
}

function buildSphere(
  N: number,
  u: Float32Array,
  v: Float32Array
) {
  // Regular lat/lon grid so latitude rings + longitude lines form a wireframe.
  // u → longitude (0..2π), v → latitude (0=north pole, 1=south pole).
  // Top points collapse to the north pole, creating the bright hotspot we see
  // in the reference screenshot.
  const pos = new Float32Array(N * 3);
  const R = 200;
  for (let i = 0; i < N; i++) {
    const lon = u[i] * Math.PI * 2;
    const lat = v[i] * Math.PI;
    pos[i * 3] = R * Math.sin(lat) * Math.cos(lon);
    pos[i * 3 + 1] = R * Math.cos(lat); // top (v=0) at +R, bottom (v=1) at -R
    pos[i * 3 + 2] = R * Math.sin(lat) * Math.sin(lon);
  }
  return pos;
}

function buildColumn(
  N: number,
  u: Float32Array,
  v: Float32Array,
  r: Float32Array
) {
  // DNA double helix — fits the Experience section thematically (career = chain
  // of building blocks). Two helical strands spiral around the central axis,
  // with rung crossbars connecting them at each row.
  //
  // u range allocation:
  //   [0.00, 0.40) → strand A (40% of particles)
  //   [0.40, 0.60) → rung crossbars between strands (20%)
  //   [0.60, 1.00] → strand B (40%)
  //
  // v drives vertical position; each row gets its own rung, so rungs march
  // up the column at regular intervals (the classic ladder look).
  const pos = new Float32Array(N * 3);
  const helixR = 105; // distance from center axis to strand centerline
  const helixTurns = 2.5;
  const height = 740;
  const ROW_SPREAD = 0.028;
  const TUBE_R = 12; // strand cross-section thickness — gives each strand volume
  const RUNG_THICK = 10; // rung vertical thickness
  const A_END = 0.3;
  const B_START = 0.7;
  for (let i = 0; i < N; i++) {
    const i3 = i * 3;
    // Decoupled pseudo-random pair from r[i] — used for tube cross-section
    // (angle around the strand axis + distance from it). Without this, all
    // particles in a row collapse onto a single line; with it, the strand
    // gets actual cross-section volume.
    const tubeAngle = r[i] * Math.PI * 2;
    const tubeDist =
      TUBE_R * Math.sqrt((r[i] * 7.31) - Math.floor(r[i] * 7.31));

    if (u[i] < A_END) {
      const subU = u[i] / A_END;
      const t = v[i] + (subU - 0.5) * ROW_SPREAD;
      const h = (t - 0.5) * height;
      const twist = t * helixTurns * Math.PI * 2;
      // Strand center
      const cx = Math.cos(twist) * helixR;
      const cz = Math.sin(twist) * helixR;
      // Cross-section offset (radial outward + vertical), gives the strand volume
      const dx = Math.cos(tubeAngle) * tubeDist * Math.cos(twist);
      const dy = Math.sin(tubeAngle) * tubeDist;
      const dz = Math.cos(tubeAngle) * tubeDist * Math.sin(twist);
      pos[i3] = cx + dx;
      pos[i3 + 1] = h + dy;
      pos[i3 + 2] = cz + dz;
    } else if (u[i] < B_START) {
      // Rung — connects strand A to strand B at this height.
      const rungT = (u[i] - A_END) / (B_START - A_END);
      const h = (v[i] - 0.5) * height;
      const twist = v[i] * helixTurns * Math.PI * 2;
      const ax = Math.cos(twist) * helixR;
      const az = Math.sin(twist) * helixR;
      const bx = Math.cos(twist + Math.PI) * helixR;
      const bz = Math.sin(twist + Math.PI) * helixR;
      // Vertical + perpendicular thickness so the rung reads as a chunky
      // crossbar, not a hairline.
      const perpScale = (tubeDist / TUBE_R - 0.5) * 8;
      pos[i3] = ax + (bx - ax) * rungT - Math.sin(twist) * perpScale;
      pos[i3 + 1] = h + (r[i] - 0.5) * RUNG_THICK;
      pos[i3 + 2] = az + (bz - az) * rungT + Math.cos(twist) * perpScale;
    } else {
      const subU = (u[i] - B_START) / (1 - B_START);
      const t = v[i] + (subU - 0.5) * ROW_SPREAD;
      const h = (t - 0.5) * height;
      const twist = t * helixTurns * Math.PI * 2 + Math.PI;
      const cx = Math.cos(twist) * helixR;
      const cz = Math.sin(twist) * helixR;
      const dx = Math.cos(tubeAngle) * tubeDist * Math.cos(twist);
      const dy = Math.sin(tubeAngle) * tubeDist;
      const dz = Math.cos(tubeAngle) * tubeDist * Math.sin(twist);
      pos[i3] = cx + dx;
      pos[i3 + 1] = h + dy;
      pos[i3 + 2] = cz + dz;
    }
  }
  return pos;
}

function buildNebula(
  N: number,
  u: Float32Array,
  v: Float32Array,
  r: Float32Array
) {
  // Grid: u → along the flowing curve; v → perpendicular offset (creates a
  // ribbon mesh with multiple parallel strands flowing together).
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const t = u[i];
    const cx = (t - 0.5) * 1000;
    const cy = Math.sin(t * Math.PI * 1.5) * 80;
    const cz = Math.cos(t * Math.PI * 2.0) * 110 - 40;
    const off = (v[i] - 0.5) * 120 + (r[i] - 0.5) * 8;
    pos[i * 3] = cx;
    pos[i * 3 + 1] = cy + off * 0.4;
    pos[i * 3 + 2] = cz + off;
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
  // Tilted orbital galaxy — modelled after the COSMOS reel.
  // Grid: u → distance from center (0 = core, 1 = arm tip).
  //       v → which arm (with smooth cross-arm interpolation).
  // The whole disk is tilted around the X axis so we see it from the side,
  // and each arm has a vertical offset so they read as concentric rings
  // rather than a flat spiral.
  const pos = new Float32Array(N * 3);
  const arms = 3;
  const tilt = 0.38; // radians — gives the Saturn-ring perspective
  const sinT = Math.sin(tilt);
  const cosT = Math.cos(tilt);
  for (let i = 0; i < N; i++) {
    const t = u[i];
    const armR = 40 + t * 280;
    const armPos = v[i] * arms;
    const arm = Math.floor(armPos);
    const armFrac = armPos - arm;
    const angle =
      t * Math.PI * 3.5 +
      (arm / arms) * Math.PI * 2 +
      armFrac * ((Math.PI * 2) / arms);
    const spread = (r[i] - 0.5) * 18;
    const rawX = Math.cos(angle) * armR + spread * Math.cos(angle + Math.PI / 2);
    const rawZ = Math.sin(angle) * armR + spread * Math.sin(angle + Math.PI / 2);
    // Tilt around the X axis (rotate Y/Z plane)
    pos[i * 3] = rawX;
    pos[i * 3 + 1] = -rawZ * sinT + (r[i] - 0.5) * 6;
    pos[i * 3 + 2] = rawZ * cosT;
  }
  return pos;
}

/* ── Color palettes (one per shape, same length as positions) ───────────── */

/* ── Vivid "fun" palettes for each shape ─────────────────────────────────
 * Each particle samples one slot from its shape's palette via the per-particle
 * r-seed, so the same particle picks the SAME palette slot every frame. A small
 * jitter (driven by another stable seed) gives organic per-particle variation
 * without making the colors strobe.
 */

type RGB = readonly [number, number, number];

// Color palettes — PURE primary colors (one channel near zero), so that even
// after additive blending of overlapping particles the hue survives. Anything
// with mid-range "filler" in two channels averages to grey/white under
// additive, which is what we're trying to avoid.
//
// Red is intentionally pure (1, 0, 0) — anything like (1, 0.2, 0.2) will look
// pink/salmon once particles overlap.

const PALETTE_RING: RGB[] = [
  [0.0, 0.9, 1.0], // pure cyan
  [0.1, 0.4, 1.0], // electric blue
  [0.5, 0.0, 1.0], // pure violet
  [1.0, 0.0, 1.0], // pure magenta
  [1.0, 0.0, 0.4], // hot red-pink
  [1.0, 0.0, 0.0], // PURE RED
  [1.0, 0.5, 0.0], // pure orange
  [1.0, 0.85, 0.1], // gold
  [0.0, 1.0, 0.7], // mint
];

const PALETTE_COLUMN: RGB[] = [
  [1.0, 0.0, 0.7], // hot pink top
  [1.0, 0.0, 0.0], // pure red
  [1.0, 0.5, 0.0], // orange
  [1.0, 1.0, 0.1], // yellow
  [0.5, 0.0, 1.0], // violet
  [0.1, 0.3, 1.0], // electric blue
  [0.0, 1.0, 1.0], // cyan bottom
];

const PALETTE_NEBULA: RGB[] = [
  [0.0, 1.0, 1.0], // cyan
  [0.0, 0.5, 1.0], // sky blue
  [0.5, 0.0, 1.0], // violet
  [1.0, 0.0, 0.7], // hot pink
  [1.0, 0.0, 0.0], // PURE RED accent
  [1.0, 0.6, 0.0], // orange
  [1.0, 1.0, 0.0], // yellow
];

const PALETTE_WAVE: RGB[] = [
  [0.0, 0.9, 1.0], // cyan
  [0.1, 0.3, 1.0], // electric blue
  [0.5, 0.0, 1.0], // violet
  [1.0, 0.0, 1.0], // magenta
  [1.0, 0.0, 0.0], // PURE RED
  [1.0, 0.5, 0.0], // orange
  [1.0, 1.0, 0.0], // yellow
];

// Spiral is laid out left→center→right with color split, so its palette is
// ordered as a horizontal sweep: blue on the left, white core in the middle,
// red on the right — matching the COSMOS reel exactly.
const PALETTE_SPIRAL: RGB[] = [
  [0.0, 0.85, 1.0], // far left: cyan
  [0.1, 0.3, 1.0], // electric blue
  [0.4, 0.2, 1.0], // violet
  [0.85, 0.85, 1.0], // white-blue
  [1.0, 1.0, 0.95], // bright white core
  [1.0, 0.85, 0.7], // warm white
  [1.0, 0.3, 0.6], // hot pink
  [1.0, 0.0, 0.3], // crimson
  [1.0, 0.0, 0.0], // far right: PURE RED
];

/** Smoothly interpolated palette sampling driven by a SPATIAL selector
 * (typically u or v). Neighboring particles end up with similar colors, so
 * dense overlapping zones aggregate into saturated red / blue / cyan / etc
 * instead of averaging out to white. */
function aggregateColors(
  N: number,
  palette: RGB[],
  spatial: Float32Array,
  jitterSeed: Float32Array,
  jitterAmt = 0.03
) {
  const col = new Float32Array(N * 3);
  const len = palette.length;
  for (let i = 0; i < N; i++) {
    const f = spatial[i] * (len - 1);
    const s0 = Math.floor(f);
    const s1 = Math.min(s0 + 1, len - 1);
    const t = f - s0;
    const c0 = palette[s0];
    const c1 = palette[s1];
    const j = (jitterSeed[i] - 0.5) * 2 * jitterAmt;
    col[i * 3] = clamp01(c0[0] + (c1[0] - c0[0]) * t + j);
    col[i * 3 + 1] = clamp01(c0[1] + (c1[1] - c0[1]) * t + j);
    col[i * 3 + 2] = clamp01(c0[2] + (c1[2] - c0[2]) * t + j);
  }
  return col;
}

function clamp01(x: number) {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

// Ring: aggregate by angle (u) → wide color arcs around the ring.
function colorRing(N: number, u: Float32Array, r: Float32Array) {
  return aggregateColors(N, PALETTE_RING, u, r, 0.03);
}

function colorSphere(
  N: number,
  _u: Float32Array,
  v: Float32Array,
  r: Float32Array
) {
  // Pure-color vertical gradient matching the reference screenshot:
  //   v=0.00..0.06 — bright white-yellow hotspot (north pole)
  //   v=0.06..0.30 — PURE RED
  //   v=0.30..0.50 — red → magenta
  //   v=0.50..0.70 — magenta → violet
  //   v=0.70..0.88 — violet → electric blue
  //   v=0.88..1.00 — blue → cyan rim
  // Each segment uses pure primary colors so additive overlap preserves hue.
  const col = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const t = v[i];
    const j = (r[i] - 0.5) * 0.04;
    let R, G, B;
    if (t < 0.06) {
      R = 1.0; G = 1.0; B = 0.85; // hotspot
    } else if (t < 0.3) {
      // Pure red zone with quick fade from hotspot at the top
      const lt = (t - 0.06) / 0.24;
      R = 1.0;
      G = (1.0 - lt) * 0.85; // 0.85 → 0
      B = (1.0 - lt) * 0.65; // 0.65 → 0
    } else if (t < 0.5) {
      // Red → magenta (R stays at 1, B ramps up)
      const lt = (t - 0.3) / 0.2;
      R = 1.0;
      G = 0.0;
      B = lt; // 0 → 1
    } else if (t < 0.7) {
      // Magenta → violet (R fades, B stays high)
      const lt = (t - 0.5) / 0.2;
      R = 1.0 - lt * 0.5;
      G = 0.0;
      B = 1.0;
    } else if (t < 0.88) {
      // Violet → electric blue (R fades to near zero)
      const lt = (t - 0.7) / 0.18;
      R = 0.5 - lt * 0.4;
      G = lt * 0.3;
      B = 1.0;
    } else {
      // Blue → cyan (G ramps up)
      const lt = (t - 0.88) / 0.12;
      R = 0.1 - lt * 0.1;
      G = 0.3 + lt * 0.7;
      B = 1.0;
    }
    col[i * 3] = clamp01(R + j);
    col[i * 3 + 1] = clamp01(G + j);
    col[i * 3 + 2] = clamp01(B + j);
  }
  return col;
}

// Column: aggregate by height (v) → vertical color bands top→bottom.
function colorColumn(N: number, v: Float32Array, r: Float32Array) {
  return aggregateColors(N, PALETTE_COLUMN, v, r, 0.03);
}

// Nebula: aggregate by flow position (u) → color regions along the trail.
function colorNebula(N: number, u: Float32Array, r: Float32Array) {
  return aggregateColors(N, PALETTE_NEBULA, u, r, 0.03);
}

// Wave: aggregate by x position (u) → wide color stripes across the wave.
function colorWave(N: number, u: Float32Array, r: Float32Array) {
  return aggregateColors(N, PALETTE_WAVE, u, r, 0.03);
}

// Spiral: color by HORIZONTAL POSITION of the particle in the galaxy disk,
// not by seed. The palette is ordered left→right (cyan → blue → violet →
// white → pink → red), so the left side of the galaxy is dominantly blue,
// the centre is a bright white core, and the right side is dominantly red —
// matching the COSMOS reel reference.
function colorSpiral(
  N: number,
  _u: Float32Array,
  r: Float32Array,
  positions: Float32Array
) {
  const col = new Float32Array(N * 3);
  const len = PALETTE_SPIRAL.length;
  const HALF_W = 320; // approximate galaxy radius
  for (let i = 0; i < N; i++) {
    // -1 (far left) .. +1 (far right)
    const xNorm = positions[i * 3] / HALF_W;
    // Map to 0..1
    const t = clamp01((xNorm + 1) * 0.5);
    const f = t * (len - 1);
    const s0 = Math.floor(f);
    const s1 = Math.min(s0 + 1, len - 1);
    const lt = f - s0;
    const c0 = PALETTE_SPIRAL[s0];
    const c1 = PALETTE_SPIRAL[s1];
    const j = (r[i] - 0.5) * 0.04;
    col[i * 3] = clamp01(c0[0] + (c1[0] - c0[0]) * lt + j);
    col[i * 3 + 1] = clamp01(c0[1] + (c1[1] - c0[1]) * lt + j);
    col[i * 3 + 2] = clamp01(c0[2] + (c1[2] - c0[2]) * lt + j);
  }
  return col;
}

/* ── Tiny helpers ──────────────────────────────────────────────────────── */

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Bell weight for "how much are we currently in shape `shapeIdx`?". */
function shapeWeight(morphIdx: number, shapeIdx: number) {
  const d = morphIdx - shapeIdx;
  return Math.max(0, 1 - Math.abs(d));
}

/** Custom shader for all particle layers — replaces PointsMaterial.
 *
 * What it buys over PointsMaterial + canvas sprite:
 *  • per-particle size variety (aScale) — a real "sky" has big and small stars
 *  • per-particle twinkle (aPhase) — size AND brightness shimmer, GPU-side
 *  • procedural falloff (no texture fetch): `soft: 0` is a tight spark with a
 *    hot center, `soft: 1` is a wide gaussian-ish bloom for the halo layer
 *
 * Core + halo layers share geometry, so a particle's spark and bloom twinkle
 * in sync. Blending is switched between Additive/Normal by the theme observer.
 */
function makeParticleMaterial(opts: {
  size: number;
  opacity: number;
  twinkle: number;
  soft: 0 | 1;
  pixelRatio: number;
}): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: opts.size },
      uOpacity: { value: opts.opacity },
      uTwinkle: { value: opts.twinkle },
      uSoft: { value: opts.soft },
      uPixelRatio: { value: opts.pixelRatio },
    },
    vertexShader: /* glsl */ `
      attribute float aScale;
      attribute float aPhase;
      uniform float uTime;
      uniform float uSize;
      uniform float uTwinkle;
      uniform float uPixelRatio;
      varying vec3 vColor;
      varying float vTw;
      void main() {
        vColor = color;
        // 0..1 shimmer, unique speed + phase per particle
        float s = 0.5 + 0.5 * sin(uTime * (1.2 + aPhase * 0.35) + aPhase * 4.7);
        float tw = 1.0 - uTwinkle * s;
        vTw = 0.55 + 0.45 * tw;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float ps = uSize * aScale * (0.75 + 0.5 * tw);
        gl_PointSize = ps * uPixelRatio * (300.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      uniform float uSoft;
      varying vec3 vColor;
      varying float vTw;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        if (d > 1.0) discard;
        float fall = 1.0 - d;
        // spark: hot core + tight skirt; halo: wide soft bloom
        float spark = pow(fall, 3.0) + smoothstep(0.4, 0.0, d) * 0.55;
        float halo = pow(fall, 1.8);
        float a = mix(spark, halo, uSoft) * uOpacity * vTw;
        if (a < 0.004) discard;
        gl_FragColor = vec4(vColor, a);
      }
    `,
  });
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
