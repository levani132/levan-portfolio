"use client";

import { motion } from "framer-motion";
import { ExternalLink, Github, ShoppingCart, Palette } from "lucide-react";
import { useI18n } from "@/context/i18n";

export default function Projects() {
  const { t } = useI18n();

  const projects = [
    {
      icon: ShoppingCart,
      name: "ShopIt",
      url: "shopit.ge",
      titleKey: "projects.shopit.title",
      descKey: "projects.shopit.desc",
      roleKey: "projects.shopit.role",
      tech: [
        "Next.js 15",
        "NestJS",
        "MongoDB",
        "TypeScript",
        "Tailwind CSS",
        "NX Monorepo",
        "Redis",
        "Docker",
      ],
      link: "https://shopit.ge",
      github: null,
      gradient: "from-sky-500 to-blue-600",
    },
    {
      icon: Palette,
      name: "SoulArt",
      url: "soulart.ge",
      titleKey: "projects.soulart.title",
      descKey: "projects.soulart.desc",
      roleKey: "projects.soulart.role",
      tech: [
        "Next.js",
        "NestJS",
        "MongoDB",
        "TypeScript",
        "Stripe",
        "PayPal",
        "OpenAI",
        "PWA",
      ],
      link: "https://soulart.ge",
      github: null,
      gradient: "from-purple-500 to-pink-600",
    },
  ];

  return (
    <section id="projects" className="relative py-24 px-6">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <span className="text-sm font-medium uppercase tracking-widest text-sky-500">
            {t("projects.subtitle")}
          </span>
          <h2 className="mt-3 text-4xl font-bold text-zinc-900 dark:text-zinc-100">
            {t("projects.title")}
          </h2>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2">
          {projects.map((project, idx) => (
            <motion.div
              key={project.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-8 transition-all hover:border-sky-500/30 hover:shadow-2xl hover:shadow-sky-500/10 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-sky-500/30"
            >
              {/* Gradient overlay */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${project.gradient} opacity-0 transition-opacity group-hover:opacity-5`}
              />

              {/* Content */}
              <div className="relative">
                {/* Icon & URL */}
                <div className="mb-6 flex items-start justify-between">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${project.gradient} text-white shadow-lg`}>
                    <project.icon size={24} />
                  </div>
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-zinc-500 transition-colors hover:text-sky-500 dark:text-zinc-400"
                  >
                    {project.url} <ExternalLink size={14} className="ml-1 inline" />
                  </a>
                </div>

                {/* Title & Role */}
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {t(project.titleKey)}
                </h3>
                <p className="mt-2 text-sm font-medium text-sky-600 dark:text-sky-400">
                  {t(project.roleKey)}
                </p>

                {/* Description */}
                <p className="mt-4 leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {t(project.descKey)}
                </p>

                {/* Tech Stack */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {project.tech.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-full bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-600 dark:text-sky-400"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Action Links */}
                <div className="mt-6 flex gap-3">
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-all hover:border-sky-500/50 hover:bg-sky-500/10 hover:text-sky-600 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-sky-500/50 dark:hover:text-sky-400"
                  >
                    <ExternalLink size={14} /> {t("projects.visit")}
                  </a>
                  {project.github && (
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-all hover:border-sky-500/50 hover:bg-sky-500/10 hover:text-sky-600 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-sky-500/50 dark:hover:text-sky-400"
                    >
                      <Github size={14} /> {t("projects.github")}
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
