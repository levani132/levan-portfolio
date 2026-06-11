/**
 * Shared resume data — single source of truth consumed by every theme
 * (cosmic / terminal / editorial). Text fields hold i18n dictionary keys;
 * render them through useI18n().t(). Literal fields (company names, tech,
 * URLs) are locale-independent.
 */

export interface Job {
  titleKey: string;
  /** Either a literal company name or an i18n key (t() falls back to the key
   * itself, so literal names pass through unchanged). */
  company: string;
  client?: string;
  periodKey: string;
  descKey: string;
  responsibilityKeys: string[];
  tech?: string[];
  teamKey?: string;
}

export const jobs: Job[] = [
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
    responsibilityKeys: [
      "exp.1.r0",
      "exp.1.r1",
      "exp.1.r2",
      "exp.1.r3",
      "exp.1.r4",
      "exp.1.r5",
    ],
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
    responsibilityKeys: [
      "exp.5.r0",
      "exp.5.r1",
      "exp.5.r2",
      "exp.5.r3",
      "exp.5.r4",
    ],
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

export interface Project {
  name: string;
  url: string;
  link: string;
  titleKey: string;
  descKey: string;
  roleKey: string;
  tech: string[];
}

export const projects: Project[] = [
  {
    name: "ShopIt",
    url: "shopit.ge",
    link: "https://shopit.ge",
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
  },
  {
    name: "SoulArt",
    url: "soulart.ge",
    link: "https://soulart.ge",
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
  },
];

export interface SkillCategory {
  titleKey: string;
  items: string[];
}

export const skillCategories: SkillCategory[] = [
  {
    titleKey: "skills.languages",
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
    titleKey: "skills.frameworks",
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
    titleKey: "skills.tools",
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
    titleKey: "skills.backend",
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
    titleKey: "skills.testing",
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
    titleKey: "skills.leadership",
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

export interface Degree {
  degreeKey: string;
  schoolKey: string;
  facultyKey: string;
  typeKey: string;
}

export const degrees: Degree[] = [
  {
    degreeKey: "edu.mba",
    schoolKey: "edu.school",
    facultyKey: "edu.faculty.business",
    typeKey: "edu.master",
  },
  {
    degreeKey: "edu.bachelor",
    schoolKey: "edu.school",
    facultyKey: "edu.faculty.macs",
    typeKey: "edu.bachelorType",
  },
];

export const contact = {
  email: "lberoshvili9@gmail.com",
  linkedin: "https://www.linkedin.com/in/levan-beroshvili-75753a110/",
  github: "https://github.com/levani132",
};
