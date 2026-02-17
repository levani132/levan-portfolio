"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Building2 } from "lucide-react";
import { useI18n } from "@/context/i18n";

interface Job {
  titleKey: string;
  company: string;
  client?: string;
  periodKey: string;
  descKey: string;
  responsibilityKeys: string[];
  tech?: string[];
  teamKey?: string;
}

const jobs: Job[] = [
  {
    titleKey: "exp.0.title",
    company: "EPAM Systems",
    client: "Gilbert Orchards",
    periodKey: "exp.0.period",
    descKey: "exp.0.desc",
    responsibilityKeys: ["exp.0.r0"],
  },
  {
    titleKey: "exp.1.title",
    company: "EPAM Systems",
    client: "Thomson Reuters",
    periodKey: "exp.1.period",
    descKey: "exp.1.desc",
    responsibilityKeys: ["exp.1.r0", "exp.1.r1", "exp.1.r2", "exp.1.r3", "exp.1.r4", "exp.1.r5"],
    tech: [".NET", "Razor MVC", "jQuery", "Angular", "React", "CSS"],
    teamKey: "exp.1.team",
  },
  {
    titleKey: "exp.2.title",
    company: "Microsoft",
    client: "Skype",
    periodKey: "exp.2.period",
    descKey: "exp.2.desc",
    responsibilityKeys: ["exp.2.r0", "exp.2.r1", "exp.2.r2"],
    tech: ["React Native"],
    teamKey: "exp.2.team",
  },
  {
    titleKey: "exp.3.title",
    company: "Microsoft",
    client: "TakeLessons",
    periodKey: "exp.3.period",
    descKey: "exp.3.desc",
    responsibilityKeys: ["exp.3.r0", "exp.3.r1", "exp.3.r2", "exp.3.r3"],
    tech: ["Next.js", "React", "TypeScript"],
  },
  {
    titleKey: "exp.4.title",
    company: "Bank of Georgia",
    periodKey: "exp.4.period",
    descKey: "exp.4.desc",
    responsibilityKeys: ["exp.4.r0", "exp.4.r1", "exp.4.r2"],
    tech: ["Angular", "TypeScript"],
  },
  {
    titleKey: "exp.5.title",
    company: "Bank of Georgia",
    periodKey: "exp.5.period",
    descKey: "exp.5.desc",
    responsibilityKeys: ["exp.5.r0", "exp.5.r1", "exp.5.r2", "exp.5.r3", "exp.5.r4"],
    tech: ["Angular", "TypeScript", "RxJS"],
  },
  {
    titleKey: "exp.6.title",
    company: "exp.6.company",
    periodKey: "exp.6.period",
    descKey: "exp.6.desc",
    responsibilityKeys: ["exp.6.r0", "exp.6.r1", "exp.6.r2"],
    tech: ["Vue.js", "PHP", "Laravel"],
  },
  {
    titleKey: "exp.7.title",
    company: "exp.7.company",
    periodKey: "exp.7.period",
    descKey: "exp.7.desc",
    responsibilityKeys: ["exp.7.r0", "exp.7.r1", "exp.7.r2"],
    tech: [".NET", "Angular", "AngularJS"],
  },
  {
    titleKey: "exp.8.title",
    company: "exp.8.company",
    periodKey: "exp.8.period",
    descKey: "exp.8.desc",
    responsibilityKeys: ["exp.8.r0", "exp.8.r1", "exp.8.r2"],
    tech: [".NET", "Angular", "AngularJS"],
  },
];

function JobCard({ job, index }: { job: Job; index: number }) {
  const [expanded, setExpanded] = useState(index < 3);
  const { t } = useI18n();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      className="group relative"
    >
      {/* Timeline connector */}
      <div className="absolute left-4.75 top-12 bottom-0 w-px bg-linear-to-b from-violet-500/50 to-transparent dark:from-violet-500/30" />

      <div className="relative flex gap-6">
        {/* Timeline dot */}
        <div className="relative z-10 mt-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-violet-500/30 bg-white dark:bg-zinc-950">
          <Building2 size={16} className="text-violet-500" />
        </div>

        {/* Content card */}
        <div className="flex-1 pb-10">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full text-left"
          >
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 transition-all hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/5 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-violet-500/30">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="text-sm font-medium text-violet-500">
                    {t(job.periodKey)}
                  </div>
                  <h3 className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    {t(job.titleKey)}
                  </h3>
                  <div className="mt-0.5 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                    <span>{t(job.company)}</span>
                    {job.client && (
                      <>
                        <span className="text-zinc-300 dark:text-zinc-700">
                          ·
                        </span>
                        <span>{job.client}</span>
                      </>
                    )}
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: expanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-2 text-zinc-400"
                >
                  <ChevronDown size={18} />
                </motion.div>
              </div>

              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {t(job.descKey)}
                    </p>
                    <ul className="mt-3 space-y-1.5">
                      {job.responsibilityKeys.map((rKey, i) => (
                        <li
                          key={i}
                          className="flex gap-2 text-sm text-zinc-600 dark:text-zinc-400"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500/50" />
                          {t(rKey)}
                        </li>
                      ))}
                    </ul>
                    {job.tech && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {job.tech.map((t) => (
                          <span
                            key={t}
                            className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-600 dark:text-violet-400"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    {job.teamKey && (
                      <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
                        {t("exp.team")} {t(job.teamKey)}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function Experience() {
  const { t } = useI18n();

  return (
    <section id="experience" className="px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-sm font-medium uppercase tracking-widest text-violet-500">
            {t("exp.label")}
          </span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            {t("exp.heading")}
          </h2>
        </motion.div>

        <div className="mt-12">
          {jobs.map((job, i) => (
            <JobCard key={i} job={job} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}