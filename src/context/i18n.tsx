"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";

export type Locale = "en" | "ka";

/* ────────────────────────────────────────── */
/*  Translation dictionary                     */
/* ────────────────────────────────────────── */
const dict = {
  /* ── Navigation ── */
  "nav.about": { en: "About", ka: "ჩემს შესახებ" },
  "nav.experience": { en: "Experience", ka: "გამოცდილება" },
  "nav.skills": { en: "Skills", ka: "უნარები" },
  "nav.education": { en: "Education", ka: "განათლება" },
  "nav.contact": { en: "Contact", ka: "კონტაქტი" },

  /* ── Hero ── */
  "hero.status": { en: "Currently at EPAM Systems", ka: "ამჟამად EPAM Systems-ში" },
  "hero.firstName": { en: "Levan", ka: "ლევან" },
  "hero.lastName": { en: "Beroshvili", ka: "ბეროშვილი" },
  "hero.title": { en: "Lead Software Engineer", ka: "წამყვანი პროგრამული ინჟინერი" },
  "hero.desc": {
    en: "8+ years building scalable front-end architectures and leading engineering teams at companies like",
    ka: "8+ წლიანი გამოცდილება მასშტაბური ფრონტ-ენდ არქიტექტურების შექმნასა და საინჟინრო გუნდების ხელმძღვანელობაში კომპანიებში, როგორიცაა",
  },
  "hero.and": { en: "and", ka: "და" },
  "hero.getInTouch": { en: "Get in touch", ka: "დამიკავშირდით" },
  "hero.scroll": { en: "Scroll to explore", ka: "ქვემოთ ჩასქროლვა" },
  "hero.years": { en: "Years", ka: "წელი" },
  "hero.companies": { en: "Companies", ka: "კომპანია" },
  "hero.roles": { en: "Roles", ka: "პოზიცია" },
  "hero.degrees": { en: "Degrees", ka: "ხარისხი" },

  /* ── About ── */
  "about.label": { en: "About Me", ka: "ჩემს შესახებ" },
  "about.heading": { en: "What I Bring to the Table", ka: "რას ვთავაზობ" },
  "about.desc": {
    en: "Lead Software Engineer with 8+ years of experience in front-end development, scalable infrastructure design, and cross-functional team leadership. Passionate about writing clear documentation to future-proof projects and enhance team collaboration.",
    ka: "წამყვანი პროგრამული ინჟინერი 8+ წლიანი გამოცდილებით ფრონტ-ენდ განვითარებაში, მასშტაბური ინფრასტრუქტურის დიზაინსა და ჯვარედინი გუნდების ხელმძღვანელობაში. მომავლისთვის მზა დოკუმენტაციების წერა გუნდური თანამშრომლობის გასაძლიერებლად.",
  },
  "about.communication": { en: "Communication", ka: "კომუნიკაცია" },
  "about.communication.desc": {
    en: "Effective communication skills ensuring multiple teams achieve the same goal seamlessly.",
    ka: "ეფექტური კომუნიკაციის უნარები, რომლებიც უზრუნველყოფენ მრავალი გუნდის ერთიანი მიზნის მიღწევას.",
  },
  "about.motivation": { en: "Team Motivation", ka: "გუნდის მოტივაცია" },
  "about.motivation.desc": {
    en: "Motivating teams to achieve their goals without stress and with high efficiency.",
    ka: "გუნდების მოტივაცია მიზნების მისაღწევად სტრესის გარეშე და მაღალი ეფექტურობით.",
  },
  "about.reliability": { en: "Reliability", ka: "საიმედოობა" },
  "about.reliability.desc": {
    en: "Always reliable to finish the job despite its complexity.",
    ka: "ყოველთვის საიმედო სამუშაოს დასასრულებლად, მიუხედავად მისი სირთულისა.",
  },
  "about.microfe": { en: "Micro Front-End Architecture", ka: "მიკრო ფრონტ-ენდ არქიტექტურა" },
  "about.microfe.desc": {
    en: "Creating scalable infrastructure of micro front-end architecture that can withstand time and team size from scratch.",
    ka: "მასშტაბური მიკრო ფრონტ-ენდ არქიტექტურის ინფრასტრუქტურის შექმნა ნულიდან.",
  },
  "about.e2e": { en: "E2E System Design", ka: "E2E სისტემის დიზაინი" },
  "about.e2e.desc": {
    en: "Creating architecture for complex systems that can cover whole end-to-end flow.",
    ka: "კომპლექსური სისტემების არქიტექტურის შექმნა, რომელიც მთლიან ფლოუს მოიცავს.",
  },
  "about.docs": { en: "Documentation", ka: "დოკუმენტაცია" },
  "about.docs.desc": {
    en: "Writing documentation for easier understanding and future-proofing the work.",
    ka: "მარტივად აღსაქმელი დოკუმენტაციის წერა პროექტის მომავლის უზრუნველსაყოფად.",
  },

  /* ── Experience ── */
  "exp.label": { en: "Career", ka: "კარიერა" },
  "exp.heading": { en: "Work Experience", ka: "სამუშაო გამოცდილება" },
  "exp.team": { en: "Team:", ka: "გუნდი:" },
  "exp.present": { en: "Present", ka: "დღემდე" },

  /* Job 0 – EPAM / Gilbert Orchards */
  "exp.0.title": { en: "Team Lead & Delivery Manager", ka: "გუნდის ლიდერი და მიწოდების მენეჯერი" },
  "exp.0.period": { en: "Apr 2025 — Present", ka: "აპრ 2025 — დღემდე" },
  "exp.0.desc": {
    en: "Building an internal application for Gilbert Orchards related to supply chain visibility.",
    ka: "Gilbert Orchards-ის შიდა აპლიკაციის შექმნა, რომელიც მიწოდების ჯაჭვის ხილვადობას უკავშირდება.",
  },
  "exp.0.r0": {
    en: "Leading the development team to create both FE and BE solutions for Gilbert's supply chain application.",
    ka: "დეველოპმენტის გუნდის ხელმძღვანელობა FE და BE გადაწყვეტილებების შესაქმნელად Gilbert-ის მიწოდების ჯაჭვის აპლიკაციისთვის.",
  },

  /* Job 1 – EPAM / Thomson Reuters */
  "exp.1.title": { en: "Team Lead", ka: "გუნდის ლიდერი" },
  "exp.1.period": { en: "Sep 2024 — Mar 2025", ka: "სექ 2024 — მარ 2025" },
  "exp.1.desc": {
    en: "Running accessibility defects remediations for UFile, a tax management web application for Canada under Thomson Reuters' Tax & Accounting department.",
    ka: "UFile-ის ხელმისაწვდომობის დეფექტების გამოსწორება — კანადის საგადასახადო მართვის ვებ-აპლიკაცია Thomson Reuters-ის საგადასახადო და ბუღალტრული აღრიცხვის დეპარტამენტში.",
  },
  "exp.1.r0": {
    en: "Managed work intake, distribution, and execution for the development team.",
    ka: "სამუშაოს მიღების, განაწილებისა და შესრულების მართვა დეველოპმენტის გუნდისთვის.",
  },
  "exp.1.r1": {
    en: "Maintained efficient communication within the team and with client managers.",
    ka: "ეფექტური კომუნიკაციის შენარჩუნება გუნდში და კლიენტის მენეჯერებთან.",
  },
  "exp.1.r2": {
    en: "Addressed cross-browser compatibility issues with CSS.",
    ka: "CSS-ის ბრაუზერთა თავსებადობის პრობლემების გადაჭრა.",
  },
  "exp.1.r3": {
    en: "Conducted tech research, analyzed findings, and proposed optimized solutions.",
    ka: "ტექნიკური კვლევის ჩატარება, შედეგების ანალიზი და ოპტიმიზებული გადაწყვეტილებების შეთავაზება.",
  },
  "exp.1.r4": {
    en: "Managed multiple tasks under tight deadlines with patience and diligence.",
    ka: "მრავალი ამოცანის მართვა მჭიდრო ვადებში მოთმინებითა და სიზუსტით.",
  },
  "exp.1.r5": {
    en: "Collaborated with a diverse team of 6 to 10 members.",
    ka: "თანამშრომლობა 6-დან 10 წევრამდე მრავალფეროვან გუნდთან.",
  },
  "exp.1.team": { en: "6–10 members", ka: "6–10 წევრი" },

  /* Job 2 – Microsoft / Skype */
  "exp.2.title": { en: "Lead Developer", ka: "წამყვანი დეველოპერი" },
  "exp.2.period": { en: "Jan 2023 — Aug 2024", ka: "იან 2023 — აგვ 2024" },
  "exp.2.desc": {
    en: "Integrated ChatGPT and related features into Skype, including Copilot and Designer (image creator).",
    ka: "ChatGPT-ისა და მასთან დაკავშირებული ფუნქციების ინტეგრაცია Skype-ში, მათ შორის Copilot და Designer (გამოსახულების შემქმნელი).",
  },
  "exp.2.r0": {
    en: "Implemented UI for natural integration of Copilot in Skype.",
    ka: "Copilot-ის Skype-ში ბუნებრივი ინტეგრაციისთვის UI-ის იმპლემენტაცია.",
  },
  "exp.2.r1": {
    en: "Communicated with other teams across the organization for getting relevant APIs and information.",
    ka: "კომუნიკაცია ორგანიზაციის სხვა გუნდებთან შესაბამისი API-ების და ინფორმაციის მისაღებად.",
  },
  "exp.2.r2": {
    en: "Wrote documentation and data flow diagrams for implemented features.",
    ka: "იმპლემენტირებული ფუნქციების დოკუმენტაციისა და მონაცემთა ნაკადის დიაგრამების შექმნა.",
  },
  "exp.2.team": { en: "5 developers, 1 PM, 1 EM", ka: "5 დეველოპერი, 1 PM, 1 EM" },

  /* Job 3 – Microsoft / TakeLessons */
  "exp.3.title": { en: "Team Lead & Engineer", ka: "გუნდის ლიდერი და ინჟინერი" },
  "exp.3.period": { en: "Mar 2022 — Jan 2023", ka: "მარ 2022 — იან 2023" },
  "exp.3.desc": {
    en: "Rewrote takelessons.com to a modern stack — a platform connecting tutors to students.",
    ka: "takelessons.com-ის თანამედროვე სტეკზე გადაწერა — პლატფორმა, რომელიც რეპეტიტორებს სტუდენტებთან აკავშირებს.",
  },
  "exp.3.r0": {
    en: "Developed key parts of the website and prepared low-level components for the new architecture.",
    ka: "ვებსაიტის ძირითადი ნაწილების შემუშავება და ახალი არქიტექტურისთვის დაბალი დონის კომპონენტების მომზადება.",
  },
  "exp.3.r1": {
    en: "Communicated with the business side to ensure correct alignment on requirements.",
    ka: "ბიზნეს მხარესთან კომუნიკაცია მოთხოვნების სწორი გასწორებისთვის.",
  },
  "exp.3.r2": {
    en: "Distributed work across the team.",
    ka: "სამუშაოს განაწილება გუნდში.",
  },
  "exp.3.r3": {
    en: "Led MVP release of the website's Indian variant.",
    ka: "ვებსაიტის ინდოეთის ვარიანტის MVP რელიზის ხელმძღვანელობა.",
  },

  /* Job 4 – Bank of Georgia (Head) */
  "exp.4.title": { en: "Head of Software Engineering Unit", ka: "პროგრამული ინჟინერიის ერთეულის ხელმძღვანელი" },
  "exp.4.period": { en: "Jan 2022 — Jun 2022", ka: "იან 2022 — ივნ 2022" },
  "exp.4.desc": {
    en: "Managed a unit of engineers focused on Angular projects for the bank's Core Banking Systems.",
    ka: "Angular პროექტებზე ფოკუსირებული ინჟინრების ერთეულის მართვა ბანკის Core Banking Systems-ისთვის.",
  },
  "exp.4.r0": {
    en: "Oversaw all development activities and ensured project objectives were met.",
    ka: "ყველა დეველოპმენტის აქტივობის ზედამხედველობა და პროექტის მიზნების მიღწევის უზრუნველყოფა.",
  },
  "exp.4.r1": {
    en: "Coordinated efforts, optimized workflows, and maintained high-quality standards.",
    ka: "ძალისხმევის კოორდინაცია, სამუშაო პროცესების ოპტიმიზაცია და მაღალი ხარისხის სტანდარტების შენარჩუნება.",
  },
  "exp.4.r2": {
    en: "Led project planning and ensured timely delivery of scalable Angular-based applications.",
    ka: "პროექტის დაგეგმვის ხელმძღვანელობა და Angular-ზე დაფუძნებული მასშტაბური აპლიკაციების დროული მიწოდების უზრუნველყოფა.",
  },

  /* Job 5 – Bank of Georgia (Lead) */
  "exp.5.title": { en: "Lead Software Engineer", ka: "წამყვანი პროგრამული ინჟინერი" },
  "exp.5.period": { en: "Jan 2019 — Jan 2022", ka: "იან 2019 — იან 2022" },
  "exp.5.desc": {
    en: "Core Banking Systems (CBS) — an internal project for front and back office employees to manage banking products.",
    ka: "Core Banking Systems (CBS) — შიდა პროექტი ფრონტ და ბექ ოფისის თანამშრომლებისთვის საბანკო პროდუქტების სამართავად.",
  },
  "exp.5.r0": {
    en: "Collaborated with feature teams including Accounts & Deposits and Cash Operations to deliver high-quality projects.",
    ka: "თანამშრომლობა ფუნქციონალურ გუნდებთან, მათ შორის ანგარიშები და დეპოზიტები და ნაღდი ფულის ოპერაციები, მაღალი ხარისხის პროექტების მისაწოდებლად.",
  },
  "exp.5.r1": {
    en: "Acted as chapter leader to standardize development practices across teams.",
    ka: "ჩაპტერ ლიდერის როლის შესრულება გუნდებს შორის დეველოპმენტის პრაქტიკების სტანდარტიზაციისთვის.",
  },
  "exp.5.r2": {
    en: "Ensured consistent use of frameworks and libraries to maintain uniformity.",
    ka: "ფრეიმვორკებისა და ბიბლიოთეკების თანმიმდევრული გამოყენების უზრუნველყოფა ერთგვაროვნების შესანარჩუნებლად.",
  },
  "exp.5.r3": {
    en: "Regularly updated libraries and frameworks to latest versions for performance and security.",
    ka: "ბიბლიოთეკებისა და ფრეიმვორკების რეგულარული განახლება უახლეს ვერსიებამდე წარმადობისა და უსაფრთხოებისთვის.",
  },
  "exp.5.r4": {
    en: "Promoted and enforced best practices among developers to improve code quality.",
    ka: "საუკეთესო პრაქტიკების წახალისება და აღსრულება დეველოპერებს შორის კოდის ხარისხის გასაუმჯობესებლად.",
  },

  /* Job 6 – National Archives */
  "exp.6.title": { en: "Full Stack Developer", ka: "ფულ სტეკ დეველოპერი" },
  "exp.6.company": { en: "National Archives of Georgia", ka: "საქართველოს ეროვნული არქივი" },
  "exp.6.period": { en: "Aug 2018 — Jul 2019", ka: "აგვ 2018 — ივლ 2019" },
  "exp.6.desc": {
    en: "Developed an archive exploration system helping researchers efficiently explore and annotate archived documents.",
    ka: "არქივის კვლევის სისტემის შემუშავება, რომელიც მკვლევარებს არქივირებული დოკუმენტების ეფექტურად შესწავლასა და ანოტირებაში ეხმარება.",
  },
  "exp.6.r0": {
    en: "Developed the front-end application using Vue.js for a seamless user experience.",
    ka: "ფრონტ-ენდ აპლიკაციის შემუშავება Vue.js-ის გამოყენებით შეუფერხებელი მომხმარებლის გამოცდილებისთვის.",
  },
  "exp.6.r1": {
    en: "Designed and implemented most of the back-end architecture.",
    ka: "ბექ-ენდ არქიტექტურის უმეტესი ნაწილის დიზაინი და იმპლემენტაცია.",
  },
  "exp.6.r2": {
    en: "Played a dual role in front-end and back-end development.",
    ka: "ორმაგი როლის შესრულება ფრონტ-ენდ და ბექ-ენდ დეველოპმენტში.",
  },

  /* Job 7 – Georgian Railway (Developer) */
  "exp.7.title": { en: "Full Stack Developer", ka: "ფულ სტეკ დეველოპერი" },
  "exp.7.company": { en: "Georgian Railway", ka: "საქართველოს რკინიგზა" },
  "exp.7.period": { en: "Jul 2017 — Jul 2018", ka: "ივლ 2017 — ივლ 2018" },
  "exp.7.desc": {
    en: "Managed cargo movement within the organization — tracking, scheduling, and optimization of cargo transportation.",
    ka: "ტვირთის გადაადგილების მართვა ორგანიზაციის შიგნით — ტრეკინგი, დაგეგმვა და ტვირთის ტრანსპორტირების ოპტიმიზაცია.",
  },
  "exp.7.r0": {
    en: "Developed projects using .NET and Angular/AngularJS frameworks.",
    ka: "პროექტების შემუშავება .NET და Angular/AngularJS ფრეიმვორკების გამოყენებით.",
  },
  "exp.7.r1": {
    en: "Collaborated on designing and implementing application features.",
    ka: "აპლიკაციის ფუნქციების დიზაინსა და იმპლემენტაციაზე თანამშრომლობა.",
  },
  "exp.7.r2": {
    en: "Coordinated with cross-functional teams to align technical solutions with business objectives.",
    ka: "ჯვარედინ გუნდებთან კოორდინაცია ტექნიკური გადაწყვეტილებების ბიზნეს მიზნებთან გასწორებისთვის.",
  },

  /* Job 8 – Georgian Railway (Intern) */
  "exp.8.title": { en: "Engineering Intern", ka: "ინჟინერიის სტაჟიორი" },
  "exp.8.company": { en: "Georgian Railway", ka: "საქართველოს რკინიგზა" },
  "exp.8.period": { en: "Mar 2017 — Jul 2017", ka: "მარ 2017 — ივლ 2017" },
  "exp.8.desc": {
    en: "Assisted in the development and maintenance of the cargo movement management system.",
    ka: "ტვირთის გადაადგილების მართვის სისტემის შემუშავებასა და მოვლაში დახმარება.",
  },
  "exp.8.r0": {
    en: "Assisted senior engineers in development using .NET and Angular/AngularJS.",
    ka: "უფროსი ინჟინრების დახმარება .NET და Angular/AngularJS-ის გამოყენებით დეველოპმენტში.",
  },
  "exp.8.r1": {
    en: "Supported troubleshooting and debugging efforts.",
    ka: "პრობლემების აღმოფხვრისა და დებაგინგის მხარდაჭერა.",
  },
  "exp.8.r2": {
    en: "Contributed to code reviews and maintained coding standards.",
    ka: "კოდის რევიუებში მონაწილეობა და კოდირების სტანდარტების შენარჩუნება.",
  },

  /* ── Skills ── */
  "skills.label": { en: "Expertise", ka: "ექსპერტიზა" },
  "skills.heading": { en: "Skills & Technologies", ka: "უნარები და ტექნოლოგიები" },
  "skills.languages": { en: "Languages", ka: "ენები" },
  "skills.frameworks": { en: "Frameworks", ka: "ფრეიმვორკები" },
  "skills.tools": { en: "Tools & Styling", ka: "ხელსაწყოები და სტილები" },
  "skills.backend": { en: "Backend & Data", ka: "ბექენდი და მონაცემები" },
  "skills.testing": { en: "Testing & DevOps", ka: "ტესტირება და DevOps" },
  "skills.leadership": { en: "Leadership", ka: "ლიდერშიფი" },

  /* ── Education ── */
  "edu.label": { en: "Education", ka: "განათლება" },
  "edu.heading": { en: "Academic Background", ka: "აკადემიური ფონი" },
  "edu.mba": { en: "Master of Business Administration (MBA)", ka: "ბიზნეს ადმინისტრირების მაგისტრი (MBA)" },
  "edu.bachelor": {
    en: "Bachelor in Mathematics & Computer Science",
    ka: "მათემატიკისა და კომპიუტერული მეცნიერების ბაკალავრი",
  },
  "edu.school": { en: "Free University of Tbilisi", ka: "თბილისის თავისუფალი უნივერსიტეტი" },
  "edu.faculty.business": { en: "Business School", ka: "ბიზნეს სკოლა" },
  "edu.faculty.macs": {
    en: "Mathematics and Computer Science (MACS)",
    ka: "მათემატიკა და კომპიუტერული მეცნიერება (MACS)",
  },
  "edu.master": { en: "Master", ka: "მაგისტრი" },
  "edu.bachelorType": { en: "Bachelor", ka: "ბაკალავრი" },

  /* ── Footer ── */
  "footer.title": { en: "Lead Software Engineer", ka: "წამყვანი პროგრამული ინჟინერი" },
  "footer.rights": { en: "All rights reserved.", ka: "ყველა უფლება დაცულია." },
} as const;

/* ────────────────────────────────────────── */
/*  Context                                    */
/* ────────────────────────────────────────── */
interface I18nCtx {
  locale: Locale;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nCtx | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback(
    (key: string) => (dict as Record<string, Record<string, string>>)[key]?.[locale] ?? key,
    [locale]
  );

  const value = useMemo(() => ({ locale, t }), [locale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be inside I18nProvider");
  return ctx;
}
