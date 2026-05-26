"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useI18n, type Locale } from "@/context/i18n";
import { useTheme } from "@/context/theme";
import { usePathname, useRouter } from "next/navigation";

export default function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { locale, t } = useI18n();
  const { theme, toggle: toggleTheme } = useTheme();

  const navLinks = [
    { label: t("nav.about"), href: "#about" },
    { label: t("nav.experience"), href: "#experience" },
    { label: t("nav.skills"), href: "#skills" },
    { label: t("nav.projects"), href: "#projects" },
    { label: t("nav.education"), href: "#education" },
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed inset-x-0 top-4 z-50 flex justify-center px-4"
    >
      {/* Liquid-glass pill — uses .glass-card for cross-theme handling */}
      <div
        className={`glass-card group relative flex w-full max-w-3xl items-center justify-between gap-3 rounded-full px-3 py-2 transition-all duration-500 ${
          scrolled ? "nav-pill-scrolled" : ""
        }`}
      >

        {/* Brand mark – glowing dot + initials */}
        <a
          href="#"
          className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold tracking-tight text-zinc-900 dark:text-white"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(56,189,248,0.9)]" />
          </span>
          <span className="hidden sm:inline">L<span className="text-sky-500 dark:text-sky-400">.</span>B</span>
        </a>

        {/* Center nav links */}
        <ul className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="rounded-full px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-black/5 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/5 dark:hover:text-white"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Right side – controls + CTA */}
        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher locale={locale} />
          <ThemeToggle theme={theme} toggle={toggleTheme} />
          <a
            href="mailto:lberoshvili9@gmail.com"
            className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 px-4 py-1.5 text-sm font-semibold text-zinc-950 shadow-[0_0_20px_rgba(56,189,248,0.45)] transition-all hover:shadow-[0_0_28px_rgba(56,189,248,0.7)]"
          >
            {t("nav.contact")}
          </a>
        </div>

        <button
          className="rounded-full p-2 text-zinc-700 hover:bg-black/5 hover:text-zinc-900 md:hidden dark:text-zinc-300 dark:hover:bg-white/5 dark:hover:text-white"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="glass-card absolute left-4 right-4 top-full mt-2 overflow-hidden rounded-2xl md:hidden"
          >
            <ul className="flex flex-col gap-1 p-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-xl px-4 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-black/5 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/5 dark:hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li className="mt-2 flex items-center justify-between px-2 py-2">
                <LanguageSwitcher locale={locale} />
                <ThemeToggle theme={theme} toggle={toggleTheme} />
              </li>
              <li>
                <a
                  href="mailto:lberoshvili9@gmail.com"
                  className="mt-1 block rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 px-4 py-3 text-center text-sm font-semibold text-zinc-950 shadow-[0_0_20px_rgba(56,189,248,0.45)]"
                  onClick={() => setMobileOpen(false)}
                >
                  {t("nav.contact")}
                </a>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

/* ── Language Switcher ── */
function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = (l: Locale) => {
    if (l === locale) return;
    const newPath = pathname.replace(/^\/(en|ka)/, `/${l}`);
    router.replace(newPath, { scroll: false });
  };

  return (
    <div className="relative flex h-8 items-center rounded-full border border-zinc-300/40 bg-black/[0.04] p-0.5 dark:border-white/10 dark:bg-white/5">
      {(["en", "ka"] as Locale[]).map((l) => (
        <button
          key={l}
          onClick={() => switchLocale(l)}
          className={`relative z-10 rounded-full px-2.5 py-1 text-xs font-semibold uppercase transition-colors ${
            locale === l
              ? "text-white"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          {locale === l && (
            <motion.span
              layoutId="lang-pill"
              className="absolute inset-0 rounded-full bg-sky-500"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative">{l === "en" ? "EN" : "KA"}</span>
        </button>
      ))}
    </div>
  );
}

/* ── Theme Toggle ── */
function ThemeToggle({
  theme,
  toggle,
}: {
  theme: string;
  toggle: () => void;
}) {
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="group relative flex h-8 w-14 items-center rounded-full border border-zinc-300/40 bg-black/[0.04] p-1 transition-colors dark:border-white/10 dark:bg-white/5"
    >
      {/* Sliding knob */}
      <motion.div
        layout
        className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm dark:bg-zinc-700"
        style={{ marginLeft: theme === "dark" ? "auto" : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
      >
        <AnimatePresence mode="wait">
          {theme === "dark" ? (
            <motion.div
              key="moon"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Moon size={12} className="text-sky-400" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Sun size={12} className="text-amber-500" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </button>
  );
}