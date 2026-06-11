"use client";

/**
 * EditorialTheme — brutalist ink & acid.
 *
 * Awwwards-style editorial design: viewport-filling Anton typography with
 * scroll parallax, an acid-yellow rotated marquee, hover-invert career rows,
 * counter-scrolling skill marquees, giant project plates and a screaming
 * "LET'S TALK" footer. Custom blend-mode cursor on desktop.
 *
 * Activate with NEXT_PUBLIC_THEME=editorial.
 */

import { useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { usePathname } from "next/navigation";
import { useI18n } from "@/context/i18n";
import {
  jobs,
  projects,
  skillCategories,
  degrees,
  contact,
} from "@/data/resume";
import "./editorial.css";

/* ── Custom cursor (desktop only — hidden via CSS on touch) ── */
function Cursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 38, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 500, damping: 38, mass: 0.5 });
  const [hot, setHot] = useState(false);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    const over = (e: MouseEvent) => {
      const el = e.target;
      setHot(el instanceof Element && !!el.closest("a, button"));
    };
    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mouseover", over, { passive: true });
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
    };
  }, [x, y]);

  return (
    <motion.div
      className="ed-cursor"
      style={{ x: sx, y: sy }}
      animate={{ scale: hot ? 3 : 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
    />
  );
}

/* ── Section heading: "01 — LABEL" + display title ── */
function SectionHead({
  index,
  label,
  title,
}: {
  index: string;
  label: string;
  title: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mb-12"
    >
      <div className="ed-mono mb-4">
        <span className="ed-index">{index}</span>
        <span className="mx-3 text-[var(--ed-dim)]">—</span>
        <span>{label}</span>
      </div>
      <h2 className="ed-display text-[clamp(2.6rem,7vw,5.5rem)]">{title}</h2>
    </motion.div>
  );
}

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
};

export default function EditorialTheme() {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const otherLocale = locale === "en" ? "ka" : "en";

  const { scrollY } = useScroll();
  const heroX1 = useTransform(scrollY, [0, 900], [0, -160]);
  const heroX2 = useTransform(scrollY, [0, 900], [0, 160]);
  const [openJob, setOpenJob] = useState<number | null>(null);

  const stripItems = [
    t("hero.title"),
    "MICROSOFT",
    "BANK OF GEORGIA",
    "EPAM SYSTEMS",
    "8+ YEARS",
    "TBILISI",
  ];

  const marqueeRows = [
    skillCategories[0].items.concat(skillCategories[3].items),
    skillCategories[1].items,
    skillCategories[2].items.concat(skillCategories[4].items),
  ];

  return (
    <div className="theme-editorial">
      <Cursor />
      <div className="ed-noise" aria-hidden />

      {/* ── Header ── */}
      <header className="ed-header fixed inset-x-0 top-0 z-50 flex items-center justify-between px-5 py-4 sm:px-8">
        <a href="#top" className="ed-mono">
          L.B — ©2026
        </a>
        <nav className="ed-mono hidden gap-6 md:flex">
          <a href="#about">{t("nav.about")}</a>
          <a href="#work">{t("nav.experience")}</a>
          <a href="#skills">{t("nav.skills")}</a>
          <a href="#projects">{t("nav.projects")}</a>
          <a href="#contact">{t("nav.contact")}</a>
        </nav>
        <a
          className="ed-mono"
          href={pathname.replace(/^\/(en|ka)/, `/${otherLocale}`)}
        >
          {locale.toUpperCase()} → {otherLocale.toUpperCase()}
        </a>
      </header>

      {/* ── Hero ── */}
      <section
        id="top"
        className="relative flex min-h-screen flex-col justify-center overflow-hidden px-4 pt-20 sm:px-8"
      >
        <div className="ed-mono mb-6 text-[var(--ed-dim)]">
          {t("hero.status")} ● {t("hero.title")}
        </div>
        <motion.h1
          style={{ x: heroX1 }}
          className="ed-display whitespace-nowrap text-[clamp(4.5rem,22vw,20rem)]"
        >
          {t("hero.firstName")}
        </motion.h1>
        <motion.div
          style={{ x: heroX2 }}
          className="ed-display ed-outline whitespace-nowrap text-[clamp(3rem,13.5vw,12.5rem)]"
        >
          {t("hero.lastName")}
        </motion.div>

        <div className="mt-14 flex flex-wrap items-end justify-between gap-6">
          <p className="max-w-md text-base leading-relaxed text-[var(--ed-dim)]">
            {t("hero.desc")} Microsoft, Bank of Georgia {t("hero.and")} EPAM
            Systems.
          </p>
          <div className="ed-mono text-right">
            <div>EST. 2017</div>
            <div className="ed-index">TBILISI — GEORGIA</div>
            <div className="mt-2">↓ SCROLL</div>
          </div>
        </div>
      </section>

      {/* ── Acid strip ── */}
      <div className="ed-strip my-10 py-3">
        <div className="ed-marquee">
          {[0, 1].map((i) => (
            <div className="ed-marquee-track" key={i} aria-hidden={i === 1}>
              {stripItems.map((item) => (
                <span
                  key={item}
                  className="ed-display mx-6 text-2xl sm:text-3xl"
                >
                  {item} <span className="mx-4">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── 01 About ── */}
      <section id="about" className="px-4 py-28 sm:px-8">
        <SectionHead
          index="01"
          label={t("about.label")}
          title={t("about.heading")}
        />
        <motion.p
          {...reveal}
          className="max-w-3xl text-xl leading-relaxed sm:text-2xl"
        >
          {t("about.desc")}
        </motion.p>

        <div className="mt-16 grid gap-x-10 sm:grid-cols-2">
          {(
            [
              ["about.microfe", "about.microfe.desc"],
              ["about.e2e", "about.e2e.desc"],
              ["about.communication", "about.communication.desc"],
              ["about.motivation", "about.motivation.desc"],
              ["about.reliability", "about.reliability.desc"],
              ["about.docs", "about.docs.desc"],
            ] as const
          ).map(([titleKey, descKey], i) => (
            <motion.div
              {...reveal}
              transition={{ ...reveal.transition, delay: (i % 2) * 0.08 }}
              key={titleKey}
              className="border-t border-[var(--ed-line)] py-6"
            >
              <div className="flex items-baseline gap-4">
                <span className="ed-mono ed-index">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="ed-display text-xl sm:text-2xl">
                  {t(titleKey)}
                </h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[var(--ed-dim)]">
                {t(descKey)}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── 02 Experience ── */}
      <section id="work" className="px-4 py-28 sm:px-8">
        <SectionHead
          index="02"
          label={t("exp.label")}
          title={t("exp.heading")}
        />
        <div>
          {jobs.map((job, i) => {
            const open = openJob === i;
            return (
              <motion.div {...reveal} key={i} className="ed-row">
                <button
                  className="grid w-full grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1 px-2 py-6 text-left sm:grid-cols-[180px_1fr_auto] sm:px-4"
                  onClick={() => setOpenJob(open ? null : i)}
                >
                  <span className="ed-mono ed-dim-text order-2 sm:order-1">
                    {t(job.periodKey)}
                  </span>
                  <span className="order-1 sm:order-2">
                    <span className="ed-display block text-2xl sm:text-3xl">
                      {t(job.titleKey)}
                    </span>
                    <span className="ed-dim-text text-sm">
                      {t(job.company)}
                      {job.client ? ` — ${job.client}` : ""}
                    </span>
                  </span>
                  <span className="ed-arrow order-3 text-2xl">↗</span>
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-2 pb-7 sm:px-4 sm:pl-[204px]">
                        <p className="max-w-2xl text-sm leading-relaxed">
                          {t(job.descKey)}
                        </p>
                        <ul className="mt-4 max-w-2xl space-y-1.5">
                          {job.responsibilityKeys.map((rk) => (
                            <li key={rk} className="ed-dim-text text-sm">
                              — {t(rk)}
                            </li>
                          ))}
                        </ul>
                        {job.tech && (
                          <div className="ed-mono mt-4">
                            {job.tech.join(" / ")}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── 03 Skills — counter-scrolling marquees ── */}
      <section id="skills" className="py-28">
        <div className="px-4 sm:px-8">
          <SectionHead
            index="03"
            label={t("skills.label")}
            title={t("skills.heading")}
          />
        </div>
        <div className="space-y-4">
          {marqueeRows.map((row, ri) => (
            <div className="ed-marquee" key={ri}>
              {[0, 1].map((dup) => (
                <div
                  className={`ed-marquee-track ${ri % 2 ? "rev" : ""}`}
                  style={{ animationDuration: `${34 + ri * 9}s` }}
                  key={dup}
                  aria-hidden={dup === 1}
                >
                  {row.map((item, ii) => (
                    <span
                      key={item}
                      className={`ed-display mx-5 whitespace-nowrap text-[clamp(2rem,5vw,4rem)] ${
                        ii % 2 ? "ed-outline" : ""
                      }`}
                    >
                      {item}
                      <span className="ed-index mx-5 align-middle text-2xl">
                        ✦
                      </span>
                    </span>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="ed-mono mt-10 px-4 text-[var(--ed-dim)] sm:px-8">
          + {skillCategories[5].items.join(" · ")}
        </div>
      </section>

      {/* ── 04 Projects ── */}
      <section id="projects" className="px-4 py-28 sm:px-8">
        <SectionHead
          index="04"
          label={t("projects.subtitle")}
          title={t("projects.title")}
        />
        <div className="grid gap-6 lg:grid-cols-2">
          {projects.map((p, i) => (
            <motion.a
              {...reveal}
              transition={{ ...reveal.transition, delay: i * 0.1 }}
              key={p.name}
              href={p.link}
              target="_blank"
              rel="noopener noreferrer"
              className="ed-project group block p-8 sm:p-10"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="ed-mono ed-dim-text">{p.url}</span>
                <span className="ed-proj-arrow text-4xl leading-none">↗</span>
              </div>
              <h3 className="ed-display mt-10 text-[clamp(3rem,8vw,6rem)]">
                {p.name}
              </h3>
              <div className="ed-mono ed-index mt-2">{t(p.roleKey)}</div>
              <p className="ed-dim-text mt-6 max-w-xl text-sm leading-relaxed">
                {t(p.descKey)}
              </p>
              <div className="ed-mono mt-8">{p.tech.join(" / ")}</div>
            </motion.a>
          ))}
        </div>
      </section>

      {/* ── 05 Education ── */}
      <section id="education" className="px-4 py-28 sm:px-8">
        <SectionHead
          index="05"
          label={t("edu.label")}
          title={t("edu.heading")}
        />
        <div>
          {degrees.map((d) => (
            <motion.div
              {...reveal}
              key={d.degreeKey}
              className="ed-row grid grid-cols-[1fr_auto] items-baseline gap-x-6 px-2 py-6 sm:grid-cols-[180px_1fr_auto] sm:px-4"
            >
              <span className="ed-mono ed-dim-text order-2 sm:order-1">
                {t(d.typeKey)}
              </span>
              <span className="order-1 sm:order-2">
                <span className="ed-display block text-xl sm:text-2xl">
                  {t(d.degreeKey)}
                </span>
                <span className="ed-dim-text text-sm">
                  {t(d.schoolKey)} — {t(d.facultyKey)}
                </span>
              </span>
              <span className="ed-arrow order-3 text-2xl">✦</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Contact / Footer ── */}
      <footer id="contact" className="px-4 pb-10 pt-20 sm:px-8">
        <div className="ed-mono mb-6 text-[var(--ed-dim)]">
          06 — {t("nav.contact")}
        </div>
        <a
          href={`mailto:${contact.email}`}
          className="ed-cta ed-display text-[clamp(3.4rem,14vw,13rem)]"
        >
          LET&apos;S TALK ↗
        </a>
        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--ed-line)] pt-6">
          <div className="ed-mono flex gap-6">
            <a href={`mailto:${contact.email}`} className="hover:text-[var(--ed-acid)]">
              EMAIL
            </a>
            <a
              href={contact.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--ed-acid)]"
            >
              LINKEDIN
            </a>
            <a
              href={contact.github}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--ed-acid)]"
            >
              GITHUB
            </a>
          </div>
          <div className="ed-mono text-[var(--ed-dim)]">
            © {new Date().getFullYear()} {t("hero.firstName")}{" "}
            {t("hero.lastName")} — {t("footer.rights")}
          </div>
        </div>
      </footer>
    </div>
  );
}
