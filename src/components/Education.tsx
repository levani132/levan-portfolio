"use client";

import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";
import { useI18n } from "@/context/i18n";

const degrees = [
  {
    degree: "Master of Business Administration (MBA)",
    school: "Free University of Tbilisi",
    faculty: "Business School",
    type: "Master",
  },
  {
    degree: "Bachelor in Mathematics & Computer Science",
    school: "Free University of Tbilisi",
    faculty: "Mathematics and Computer Science (MACS)",
    type: "Bachelor",
  },
];

export default function Education() {
  const { t } = useI18n();

  const localDegrees = [
    {
      degree: t("edu.mba"),
      school: t("edu.school"),
      faculty: t("edu.faculty.business"),
      type: t("edu.master"),
    },
    {
      degree: t("edu.bachelor"),
      school: t("edu.school"),
      faculty: t("edu.faculty.macs"),
      type: t("edu.bachelorType"),
    },
  ];

  return (
    <section id="education" className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-sm font-medium uppercase tracking-widest text-sky-500">
            {t("edu.label")}
          </span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            {t("edu.heading")}
          </h2>
        </motion.div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {localDegrees.map((edu, i) => (
            <motion.div
              key={edu.degree}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:border-sky-500/30 hover:shadow-lg hover:shadow-sky-500/5 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-sky-500/30"
            >
              {/* Gradient accent */}
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-sky-500/5 transition-all group-hover:bg-sky-500/10" />

              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500">
                  <GraduationCap size={24} />
                </div>
                <div className="mt-4">
                  <span className="inline-block rounded-full bg-sky-500/10 px-3 py-0.5 text-xs font-medium text-sky-600 dark:text-sky-400">
                    {edu.type}
                  </span>
                  <h3 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    {edu.degree}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {edu.school}
                  </p>
                  <p className="mt-0.5 text-sm text-zinc-400 dark:text-zinc-500">
                    {edu.faculty}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}