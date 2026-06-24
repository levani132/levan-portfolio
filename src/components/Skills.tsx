"use client";

import { motion } from "framer-motion";
import { Code2, Wrench, TestTube, Layout, Server, Users } from "lucide-react";
import { useI18n } from "@/context/i18n";

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
          <span className="legible text-sm font-medium uppercase tracking-widest text-sky-500">
            {t("skills.label")}
          </span>
          <h2 className="legible mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            {t("skills.heading")}
          </h2>
        </motion.div>
      </div>

      {/* Category grid */}
      <div className="mx-auto mt-12 max-w-5xl px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {localCategories.map((cat, i) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="glass-card glass-lift rounded-2xl p-5"
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