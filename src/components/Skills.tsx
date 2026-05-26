"use client";

import { motion } from "framer-motion";
import { Code2, Wrench, TestTube, Layout, Server, Users } from "lucide-react";
import { useI18n } from "@/context/i18n";

const allTech = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Angular",
  "React Native",
  "Vue.js",
  "Node.js",
  "HTML5",
  "CSS3",
  "Tailwind CSS",
  "Redux",
  "RxJS",
  "Jest",
  "Cypress",
  "MongoDB",
  "MySQL",
  "GraphQL",
  "REST API",
  "Webpack",
  "ElectronJS",
  "Ionic",
  ".NET",
  "Python",
  "PHP",
  "Git",
  "Azure DevOps",
  "Storybook",
  "Laravel",
  "AngularJS",
  "jQuery",
];

const categories = [
  {
    icon: Code2,
    title: "Languages",
    items: [
      "JavaScript",
      "TypeScript",
      "HTML5",
      "CSS3",
      "C#",
      "Python",
      "PHP",
      "Java",
      "C++",
    ],
  },
  {
    icon: Layout,
    title: "Frameworks",
    items: [
      "React",
      "Next.js",
      "React Native",
      "Angular",
      "AngularJS",
      "Vue.js",
      "Ionic",
      "ElectronJS",
      "Laravel",
      "ASP.NET MVC",
    ],
  },
  {
    icon: Wrench,
    title: "Tools & Styling",
    items: [
      "Tailwind CSS",
      "SASS/SCSS",
      "LESS",
      "Redux",
      "RxJS",
      "Webpack",
      "Gulp",
      "Storybook",
      "jQuery",
      "Lodash",
    ],
  },
  {
    icon: Server,
    title: "Backend & Data",
    items: [
      "Node.js",
      "MongoDB",
      "MySQL",
      "SQL",
      "REST API",
      "GraphQL",
      "Web Services",
    ],
  },
  {
    icon: TestTube,
    title: "Testing & DevOps",
    items: [
      "Jest",
      "Karma",
      "Jasmine",
      "Cypress",
      "Git",
      "GitHub",
      "BitBucket",
      "Azure DevOps",
      "NPM",
    ],
  },
  {
    icon: Users,
    title: "Leadership",
    items: [
      "Team Management",
      "Agile",
      "Onboarding",
      "Estimation",
      "Prompt Engineering",
      "Technical Documentation",
    ],
  },
];

export default function Skills() {
  const { t } = useI18n();

  const localCategories = [
    { ...categories[0], title: t("skills.languages") },
    { ...categories[1], title: t("skills.frameworks") },
    { ...categories[2], title: t("skills.tools") },
    { ...categories[3], title: t("skills.backend") },
    { ...categories[4], title: t("skills.testing") },
    { ...categories[5], title: t("skills.leadership") },
  ];

  return (
    <section id="skills" className="overflow-hidden py-24">
      <div className="mx-auto max-w-5xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-sm font-medium uppercase tracking-widest text-sky-500">
            {t("skills.label")}
          </span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            {t("skills.heading")}
          </h2>
        </motion.div>
      </div>

      {/* Marquee ticker */}
      <div className="relative mt-12">
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-linear-to-r from-white/80 to-transparent dark:from-black/70" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-linear-to-l from-white/80 to-transparent dark:from-black/70" />
        <div className="flex overflow-hidden">
          <div className="animate-marquee flex shrink-0 items-center gap-4 pr-4">
            {[...allTech, ...allTech].map((tech, i) => (
              <span
                key={`${tech}-${i}`}
                className="glass-card whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Category grid */}
      <div className="mx-auto mt-16 max-w-5xl px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {localCategories.map((cat, i) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="glass-card rounded-2xl p-5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-500">
                  <cat.icon size={18} />
                </div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {cat.title}
                </h3>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {cat.items.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-zinc-600 ring-1 ring-inset ring-white/10 dark:text-zinc-300"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}