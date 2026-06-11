"use client";

/**
 * OdysseyTheme — a scroll-driven cinematic journey through a 3D night world.
 *
 * The camera rides a curve past seven hand-built scenes (neon sign, dev room,
 * server corridor, guitar stage, the real-life car timeline in a garage,
 * a snowboard slope under an aurora, and a rooftop with pool + fireplace
 * overlooking a city). Each scene's lights switch on as you arrive; HTML
 * resume chapters float over the world in dark glass cards.
 *
 * Activate with NEXT_PUBLIC_THEME=odyssey or visit /odyssey.
 */

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/context/i18n";
import {
  jobs,
  projects,
  skillCategories,
  degrees,
  contact,
} from "@/data/resume";
import { createOdysseyWorld, CHAPTERS } from "./world";
import "./odyssey.css";

export default function OdysseyTheme() {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const mountRef = useRef<HTMLDivElement>(null);
  const [chapter, setChapter] = useState(0);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const world = createOdysseyWorld(mount, { reducedMotion });

    const onScroll = () => {
      const doc = document.documentElement;
      const max = Math.max(1, doc.scrollHeight - window.innerHeight);
      const p = Math.min(1, Math.max(0, window.scrollY / max));
      world.setScroll(p);
      setChapter(Math.round(p * (CHAPTERS - 1)));
    };
    const onMouse = (e: MouseEvent) => {
      world.setMouse(
        (e.clientX / window.innerWidth) * 2 - 1,
        (e.clientY / window.innerHeight) * 2 - 1
      );
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMouse, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouse);
      world.dispose();
    };
  }, []);

  const scrollToChapter = (i: number) => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    window.scrollTo({
      top: (i / (CHAPTERS - 1)) * max,
      behavior: "smooth",
    });
  };

  const otherLocale = locale === "en" ? "ka" : "en";
  const chapterLabels = [
    "intro",
    t("nav.about"),
    t("nav.experience"),
    t("nav.skills"),
    t("nav.projects"),
    t("nav.education"),
    t("nav.contact"),
  ];

  return (
    <div className="theme-odyssey">
      {/* WebGL world behind everything */}
      <div ref={mountRef} className="ody-canvas" aria-hidden />

      {/* Fixed HUD */}
      <header className="ody-header">
        <span>
          L.B — {chapterLabels[chapter]} · {chapter + 1}/{CHAPTERS}
        </span>
        <a href={pathname.replace(/^\/(en|ka)/, `/${otherLocale}`)}>
          {locale.toUpperCase()} → {otherLocale.toUpperCase()}
        </a>
      </header>
      <nav className="ody-rail" aria-label="Chapters">
        {chapterLabels.map((label, i) => (
          <button
            key={label}
            className={chapter === i ? "active" : ""}
            aria-label={label}
            onClick={() => scrollToChapter(i)}
          />
        ))}
      </nav>

      {/* Scroll chapters — one viewport each, riding over the 3D world */}
      <main className="ody-sections">
        {/* 0 · HERO — the 3D neon sign carries the name; HTML stays minimal */}
        <section className="ody-section align-center align-bottom">
          <div className="ody-hero">
            <div className="sub">
              {t("hero.title")} · {t("hero.status")}
            </div>
            <div className="ody-scroll-hint">▼ {t("hero.scroll")} ▼</div>
          </div>
        </section>

        {/* 1 · ABOUT — dev room */}
        <section className="ody-section align-right">
          <div className="ody-card">
            <div className="ody-kicker">
              <span className="n">01</span> — {t("about.label")}
            </div>
            <h2 className="ody-title">{t("about.heading")}</h2>
            <p className="ody-body">{t("about.desc")}</p>
            <div style={{ marginTop: 12 }}>
              {[
                "about.microfe",
                "about.e2e",
                "about.communication",
                "about.docs",
              ].map((k) => (
                <span className="ody-chip" key={k}>
                  {t(k)}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* 2 · EXPERIENCE — server corridor */}
        <section className="ody-section align-left">
          <div className="ody-card wide">
            <div className="ody-kicker">
              <span className="n">02</span> — {t("exp.label")}
            </div>
            <h2 className="ody-title">{t("exp.heading")}</h2>
            <div style={{ marginTop: 14 }}>
              {jobs.map((job, i) => (
                <div className="ody-job" key={i}>
                  <div className="period">{t(job.periodKey)}</div>
                  <div>
                    <div className="role">{t(job.titleKey)}</div>
                    <div className="co">
                      {t(job.company)}
                      {job.client ? ` · ${job.client}` : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3 · SKILLS — guitar stage */}
        <section className="ody-section align-right">
          <div className="ody-card wide">
            <div className="ody-kicker">
              <span className="n">03</span> — {t("skills.label")}
            </div>
            <h2 className="ody-title">{t("skills.heading")}</h2>
            <div style={{ marginTop: 10 }}>
              {skillCategories.map((cat) => (
                <div key={cat.titleKey} style={{ marginTop: 10 }}>
                  <div className="ody-kicker" style={{ fontSize: 10 }}>
                    {t(cat.titleKey)}
                  </div>
                  <div>
                    {cat.items.map((item) => (
                      <span className="ody-chip" key={item}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4 · PROJECTS — garage */}
        <section className="ody-section align-left">
          <div className="ody-card wide">
            <div className="ody-kicker">
              <span className="n">04</span> — {t("projects.subtitle")}
            </div>
            <h2 className="ody-title">{t("projects.title")}</h2>
            {projects.map((p) => (
              <div key={p.name} style={{ marginTop: 16 }}>
                <a
                  className="ody-link"
                  href={p.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontWeight: 700 }}
                >
                  {p.name} ↗
                </a>
                <span style={{ color: "#5f6b82", fontSize: 12 }}>
                  {" "}
                  · {t(p.roleKey)}
                </span>
                <p className="ody-body" style={{ marginTop: 6 }}>
                  {t(p.descKey)}
                </p>
                <div>
                  {p.tech.slice(0, 6).map((tech) => (
                    <span className="ody-chip" key={tech}>
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            <p
              className="ody-body"
              style={{ marginTop: 16, fontStyle: "italic", fontSize: 12 }}
            >
              Garage history: W203 &apos;04 → W204 &apos;12 → Forester
              Wilderness &apos;22 → next one loading…
            </p>
          </div>
        </section>

        {/* 5 · EDUCATION — snow slope */}
        <section className="ody-section align-right">
          <div className="ody-card">
            <div className="ody-kicker">
              <span className="n">05</span> — {t("edu.label")}
            </div>
            <h2 className="ody-title">{t("edu.heading")}</h2>
            {degrees.map((d) => (
              <div key={d.degreeKey} style={{ marginTop: 14 }}>
                <span className="ody-chip">{t(d.typeKey)}</span>
                <div style={{ fontWeight: 600, marginTop: 6 }}>
                  {t(d.degreeKey)}
                </div>
                <div style={{ color: "#8c97ad", fontSize: 13 }}>
                  {t(d.schoolKey)} — {t(d.facultyKey)}
                </div>
              </div>
            ))}
            <p
              className="ody-body"
              style={{ marginTop: 16, fontStyle: "italic", fontSize: 12 }}
            >
              Off-season campus: Jones Frontier 2025, fresh powder, no
              meetings.
            </p>
          </div>
        </section>

        {/* 6 · CONTACT — rooftop */}
        <section className="ody-section align-center">
          <div className="ody-card" style={{ textAlign: "center" }}>
            <div className="ody-kicker">
              <span className="n">06</span> — {t("nav.contact")}
            </div>
            <h2 className="ody-title">{t("hero.getInTouch")}</h2>
            <p className="ody-body">
              {t("hero.firstName")} {t("hero.lastName")} · {t("hero.title")}
            </p>
            <div style={{ marginTop: 18, display: "flex", gap: 18, justifyContent: "center" }}>
              <a className="ody-link" href={`mailto:${contact.email}`}>
                Email
              </a>
              <a
                className="ody-link"
                href={contact.linkedin}
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
              </a>
              <a
                className="ody-link"
                href={contact.github}
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
            </div>
            <p className="ody-body" style={{ marginTop: 18, fontSize: 11 }}>
              © {new Date().getFullYear()} — {t("footer.rights")}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
