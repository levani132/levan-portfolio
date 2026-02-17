"use client";

import { useI18n } from "@/context/i18n";

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div>
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              L<span className="text-sky-500">.</span>B
            </span>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {t("footer.title")}
            </p>
          </div>
          <div className="flex gap-8 text-sm text-zinc-500 dark:text-zinc-400">
            <a
              href="mailto:levan@example.com"
              className="transition-colors hover:text-sky-500"
            >
              Email
            </a>
            <a
              href="https://linkedin.com/in/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-sky-500"
            >
              LinkedIn
            </a>
            <a
              href="https://github.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-sky-500"
            >
              GitHub
            </a>
          </div>
        </div>
        <div className="mt-8 border-t border-zinc-200 pt-8 text-center text-sm text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
          &copy; {new Date().getFullYear()} Levan Beroshvili. {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
}