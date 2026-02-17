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
      transition={{ duration: 0.5 }}
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-zinc-200/50 bg-white/80 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-950/80"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <a
          href="#"
          className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100"
        >
          L<span className="text-violet-500">.</span>B
        </a>

        <ul className="hidden gap-8 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm font-medium text-zinc-600 transition-colors hover:text-violet-500 dark:text-zinc-400 dark:hover:text-violet-400"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          {/* Language switcher */}
          <LanguageSwitcher locale={locale} />

          {/* Theme toggle */}
          <ThemeToggle theme={theme} toggle={toggleTheme} />

          <a
            href="mailto:levan@example.com"
            className="ml-2 rounded-full bg-violet-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-600"
          >
            {t("nav.contact")}
          </a>
        </div>

        <button
          className="text-zinc-700 md:hidden dark:text-zinc-300"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-zinc-200/50 bg-white/95 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-950/95 md:hidden"
          >
            <ul className="flex flex-col gap-1 p-4">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-lg px-4 py-3 text-sm font-medium text-zinc-600 transition-colors hover:bg-violet-500/10 hover:text-violet-500 dark:text-zinc-400"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              {/* Mobile controls row */}
              <li className="mt-2 flex items-center justify-between px-4 py-2">
                <LanguageSwitcher locale={locale} />
                <ThemeToggle theme={theme} toggle={toggleTheme} />
              </li>
              <li>
                <a
                  href="mailto:levan@example.com"
                  className="mt-2 block rounded-full bg-violet-500 px-4 py-3 text-center text-sm font-medium text-white"
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
    <div className="relative flex h-8 items-center rounded-full border border-zinc-200 bg-zinc-100 p-0.5 dark:border-zinc-700 dark:bg-zinc-800">
      {(["en", "ka"] as Locale[]).map((l) => (
        <button
          key={l}
          onClick={() => switchLocale(l)}
          className={`relative z-10 rounded-full px-2.5 py-1 text-xs font-semibold uppercase transition-colors ${
            locale === l
              ? "text-white"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          {locale === l && (
            <motion.span
              layoutId="lang-pill"
              className="absolute inset-0 rounded-full bg-violet-500"
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
      className="group relative flex h-8 w-14 items-center rounded-full border border-zinc-200 bg-zinc-100 p-1 transition-colors dark:border-zinc-700 dark:bg-zinc-800"
    >
      {/* Sliding knob */}
      <motion.div
        layout
        className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm dark:bg-zinc-600"
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
              <Moon size={12} className="text-violet-400" />
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