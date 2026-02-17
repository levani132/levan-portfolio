"use client";

import { motion } from "framer-motion";
import {
  MessageSquare,
  Zap,
  Shield,
  Blocks,
  GitBranch,
  FileText,
} from "lucide-react";
import { useI18n } from "@/context/i18n";

export default function About() {
  const { t } = useI18n();

  const cards = [
    {
      icon: MessageSquare,
      title: t("about.communication"),
      description: t("about.communication.desc"),
      span: "sm:col-span-2",
    },
    {
      icon: Zap,
      title: t("about.motivation"),
      description: t("about.motivation.desc"),
      span: "",
    },
    {
      icon: Shield,
      title: t("about.reliability"),
      description: t("about.reliability.desc"),
      span: "",
    },
    {
      icon: Blocks,
      title: t("about.microfe"),
      description: t("about.microfe.desc"),
      span: "sm:col-span-2",
    },
    {
      icon: GitBranch,
      title: t("about.e2e"),
      description: t("about.e2e.desc"),
      span: "",
    },
    {
      icon: FileText,
      title: t("about.docs"),
      description: t("about.docs.desc"),
      span: "",
    },
  ];

  return (
    <section id="about" className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-sm font-medium uppercase tracking-widest text-sky-500">
            {t("about.label")}
          </span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            {t("about.heading")}
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            {t("about.desc")}
          </p>
        </motion.div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {cards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={`group rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:border-sky-500/30 hover:shadow-lg hover:shadow-sky-500/5 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-sky-500/30 ${card.span}`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500 transition-colors group-hover:bg-sky-500/20">
                <card.icon size={20} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {card.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {card.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}