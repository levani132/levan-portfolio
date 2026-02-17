"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Mail, Linkedin, Github, ChevronDown } from "lucide-react";
import { useI18n } from "@/context/i18n";

/* ── Interactive Dot Grid ── */
type Pulse = { x: number; y: number; birth: number };

function InteractiveDotGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rawMouse = useRef({ x: -1000, y: -1000 });
  const smoothMouse = useRef({ x: -1000, y: -1000 });
  const intensity = useRef(0);
  const isOver = useRef(false);
  const pulses = useRef<Pulse[]>([]);
  const raf = useRef<number>(0);
  const lastFrameTime = useRef(0);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    // Check for prefers-reduced-motion
    prefersReducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Track mouse globally so hovering over hero content / nav still glows
    const handleMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      rawMouse.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      const inX = e.clientX >= rect.left && e.clientX <= rect.right;
      const inY = e.clientY >= rect.top && e.clientY <= rect.bottom;
      isOver.current = inX && inY;
    };

    // Click anywhere in the hero to spawn a pulse
    const handleClick = (e: MouseEvent) => {
      if (prefersReducedMotion.current) return;
      const rect = canvas.getBoundingClientRect();
      const inX = e.clientX >= rect.left && e.clientX <= rect.right;
      const inY = e.clientY >= rect.top && e.clientY <= rect.bottom;
      if (!inX || !inY) return;
      pulses.current.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        birth: performance.now(),
      });
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    window.addEventListener("click", handleClick, { passive: true });

    const LERP = 0.045;
    const FADE = 0.04;
    const PULSE_DURATION = 2400;
    const PULSE_RADIUS = 140;
    const TARGET_FPS = 30; // Cap at 30 FPS on mobile
    const FRAME_TIME = 1000 / TARGET_FPS;

    const draw = (currentTime: number) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Throttle frame rate for mobile
      if (currentTime - lastFrameTime.current < FRAME_TIME) {
        raf.current = requestAnimationFrame(draw);
        return;
      }
      lastFrameTime.current = currentTime;

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);
      }

      smoothMouse.current.x +=
        (rawMouse.current.x - smoothMouse.current.x) * LERP;
      smoothMouse.current.y +=
        (rawMouse.current.y - smoothMouse.current.y) * LERP;

      const targetIntensity = isOver.current ? 1 : 0;
      intensity.current += (targetIntensity - intensity.current) * FADE;

      const now = performance.now();
      pulses.current = pulses.current.filter(
        (p) => now - p.birth < PULSE_DURATION
      );

      ctx.clearRect(0, 0, w, h);

      const gap = 28;
      const baseRadius = 1.2;
      const influenceRadius = 150;
      const mx = smoothMouse.current.x;
      const my = smoothMouse.current.y;
      const intense = intensity.current;
      const isDark = document.documentElement.classList.contains("dark");
      const defaultFill = isDark
        ? "rgba(255,255,255,0.05)"
        : "rgba(0,0,0,0.04)";

      for (let x = gap / 2; x < w; x += gap) {
        for (let y = gap / 2; y < h; y += gap) {
          let pulseStrength = 0;
          for (const p of pulses.current) {
            const pdx = x - p.x;
            const pdy = y - p.y;
            const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
            if (pdist >= PULSE_RADIUS) continue;

            const age = (now - p.birth) / PULSE_DURATION;
            const beat = Math.sin(age * Math.PI * 6) * 0.5 + 0.5;
            const envelope = 1 - age;
            const spatial = 1 - pdist / PULSE_RADIUS;
            pulseStrength = Math.max(
              pulseStrength,
              beat * envelope * spatial * spatial * 1.8
            );
          }

          const dx = x - mx;
          const dy = y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          let cursorStrength = 0;
          let drawX = x;
          let drawY = y;

          if (dist < influenceRadius && intense > 0.01) {
            const t = 1 - dist / influenceRadius;
            cursorStrength = t * t * intense;
            const pull = cursorStrength * 3;
            drawX = x - (dx / dist) * pull;
            drawY = y - (dy / dist) * pull;
          }

          const strength = Math.max(cursorStrength, pulseStrength);

          if (strength > 0.01) {
            const glowSize = baseRadius + strength * 4;
            const alpha = 0.04 + strength * 0.7;

            ctx.beginPath();
            ctx.arc(drawX, drawY, glowSize + strength * 8, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(14, 165, 233, ${strength * 0.12})`;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(drawX, drawY, glowSize, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(14, 165, 233, ${alpha})`;
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.arc(x, y, baseRadius, 0, Math.PI * 2);
            ctx.fillStyle = defaultFill;
            ctx.fill();
          }
        }
      }

      raf.current = requestAnimationFrame(draw);
    };

    raf.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("click", handleClick);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ touchAction: "none" }}
    />
  );
}

function AnimatedCounter({
  target,
  suffix = "",
}: {
  target: number;
  suffix?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

export default function Hero() {
  const { t } = useI18n();

  const stats = [
    { value: 8, suffix: "+", label: t("hero.years") },
    { value: 5, suffix: "", label: t("hero.companies") },
    { value: 9, suffix: "", label: t("hero.roles") },
    { value: 2, suffix: "", label: t("hero.degrees") },
  ];

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-x-clip px-6 pt-20">
      {/* Animated gradient orbs – extends below hero so blurs aren't clipped */}
      <div className="pointer-events-none absolute -bottom-40 left-0 right-0 top-0">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-sky-500/20 blur-[60px] sm:blur-[100px] md:blur-[120px]"
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-cyan-500/20 blur-[60px] sm:blur-[100px] md:blur-[120px]"
        />
        <motion.div
          animate={{ x: [0, 15, 0], y: [0, 15, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-[60px] md:blur-[100px]"
        />
      </div>

      {/* Interactive dot grid */}
      <InteractiveDotGrid />

      <div className="relative z-10 mx-auto max-w-5xl text-center">
        {/* Status badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-4 py-1.5 text-sm text-sky-600 dark:text-sky-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500" />
            </span>
            {t("hero.status")}
          </span>
        </motion.div>

        {/* Name with gradient */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-8 text-6xl font-bold tracking-tight sm:text-7xl lg:text-8xl"
        >
          <span className="gradient-text">{t("hero.firstName")}</span>
          <br />
          <span className="text-zinc-900 dark:text-zinc-100">{t("hero.lastName")}</span>
        </motion.h1>

        {/* Title */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-6 text-xl font-medium text-zinc-500 dark:text-zinc-400 sm:text-2xl"
        >
          {t("hero.title")}
        </motion.p>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400"
        >
          {t("hero.desc")}{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-200">
            Microsoft
          </span>
          ,{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-200">
            Bank&nbsp;of&nbsp;Georgia
          </span>
          {" "}{t("hero.and")}{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-200">
            EPAM&nbsp;Systems
          </span>
          .
        </motion.p>

        {/* Stats bento grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="mx-auto mt-12 grid max-w-lg grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="group rounded-2xl border border-zinc-200 bg-white/50 p-4 backdrop-blur-sm transition-all hover:border-sky-500/30 hover:shadow-lg hover:shadow-sky-500/5 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-sky-500/30"
            >
              <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </div>
              <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Social links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.9 }}
          className="mt-10 flex items-center justify-center gap-4"
        >
          <a
            href="mailto:levan@example.com"
            className="flex items-center gap-2 rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 transition-all hover:border-sky-500/50 hover:bg-sky-500/10 hover:text-sky-600 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-sky-500/50 dark:hover:text-sky-400"
          >
            <Mail size={16} /> {t("hero.getInTouch")}
          </a>
          <a
            href="https://linkedin.com/in/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-zinc-200 p-2.5 text-zinc-500 transition-all hover:border-sky-500/50 hover:bg-sky-500/10 hover:text-sky-600 dark:border-zinc-800 dark:hover:border-sky-500/50 dark:hover:text-sky-400"
          >
            <Linkedin size={18} />
          </a>
          <a
            href="https://github.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-zinc-200 p-2.5 text-zinc-500 transition-all hover:border-sky-500/50 hover:bg-sky-500/10 hover:text-sky-600 dark:border-zinc-800 dark:hover:border-sky-500/50 dark:hover:text-sky-400"
          >
            <Github size={18} />
          </a>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="mt-20"
        >
          <a
            href="#about"
            className="inline-flex flex-col items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-sky-500"
          >
            {t("hero.scroll")}
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ChevronDown size={20} />
            </motion.div>
          </a>
        </motion.div>
      </div>
    </section>
  );
}