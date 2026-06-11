"use client";

/**
 * TerminalTheme — "levan_os" — a full-screen retro CRT terminal portfolio.
 *
 * The whole site is an interactive shell: it boots like an old machine,
 * prints an ASCII banner, auto-runs `neofetch`, then hands the visitor a
 * real prompt with history, tab-completion and a dozen commands (plus a few
 * easter eggs). Scanlines, vignette, phosphor glow and a drifting refresh
 * band sell the tube-monitor illusion.
 *
 * Activate with NEXT_PUBLIC_THEME=terminal.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/context/i18n";
import {
  jobs,
  projects,
  skillCategories,
  degrees,
  contact,
} from "@/data/resume";
import "./terminal.css";

const BANNER = `██╗     ███████╗██╗   ██╗ █████╗ ███╗   ██╗
██║     ██╔════╝██║   ██║██╔══██╗████╗  ██║
██║     █████╗  ██║   ██║███████║██╔██╗ ██║
██║     ██╔══╝  ╚██╗ ██╔╝██╔══██║██║╚██╗██║
███████╗███████╗ ╚████╔╝ ██║  ██║██║ ╚████║
╚══════╝╚══════╝  ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═══╝`;

const NEOFETCH_LOGO = `██╗     ██████╗
██║     ██╔══██╗
██║     ██████╔╝
██║     ██╔══██╗
███████╗██████╔╝
╚══════╝╚═════╝`;

const BOOT_LINES: Array<[text: string, delay: number]> = [
  ["LEVAN_OS BIOS v8.0 — initializing...", 0],
  ["Memory check: 8+ years of experience .......... OK", 350],
  ["Loading kernel: typescript-5.x ................ OK", 250],
  ["Mounting /career (5 companies, 9 roles) ....... OK", 250],
  ["Mounting /education (2 degrees) ............... OK", 200],
  ["Starting services: react next angular ......... OK", 250],
  ["Network: tbilisi.ge → world ................... CONNECTED", 250],
  ["", 150],
  ["Boot complete. Welcome, visitor.", 200],
];

const COMMANDS = [
  "help",
  "about",
  "experience",
  "skills",
  "projects",
  "education",
  "contact",
  "neofetch",
  "banner",
  "whoami",
  "theme",
  "lang",
  "clear",
] as const;

const CHIPS = [
  "help",
  "about",
  "experience",
  "skills",
  "projects",
  "education",
  "contact",
  "neofetch",
  "sudo hire-me",
  "clear",
];

interface Line {
  id: number;
  node: ReactNode;
}

const PROMPT = (
  <>
    <span className="crt-prompt-user">visitor@levan.dev</span>
    <span className="crt-dim">:</span>
    <span className="crt-prompt-path">~</span>
    <span className="crt-dim">$ </span>
  </>
);

export default function TerminalTheme() {
  const { t, locale } = useI18n();
  const pathname = usePathname();

  const [lines, setLines] = useState<Line[]>([]);
  const [ready, setReady] = useState(false);
  const [input, setInput] = useState("");
  const [clock, setClock] = useState("");

  const idRef = useRef(0);
  const screenRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<string[]>([]);
  const histIdxRef = useRef(-1);
  const bootDoneRef = useRef(false);

  const push = useCallback((...nodes: ReactNode[]) => {
    setLines((prev) => [
      ...prev,
      ...nodes.map((node) => ({ id: idRef.current++, node })),
    ]);
  }, []);

  /* ── Command outputs ──────────────────────────────────────────────────── */

  const printNeofetch = useCallback(() => {
    const info: Array<[string, string]> = [
      ["OS", "levan_os 8.0 LTS (Tbilisi build)"],
      ["Host", "EPAM Systems"],
      ["Kernel", "typescript-5.x"],
      ["Uptime", "8+ years in production"],
      ["Packages", "31 (npm), 2 (degrees)"],
      ["Shell", "next.js 16 / react 19"],
      ["Resolution", "Lead × Engineer"],
      ["CPU", "React / Next.js / Angular"],
      ["GPU", "three.js (try the cosmic theme)"],
      ["Memory", "Microsoft · Bank of Georgia · EPAM"],
    ];
    push(
      <div className="flex flex-wrap gap-x-10 gap-y-3 py-2">
        <pre className="crt-banner" style={{ fontSize: "11px" }}>
          {NEOFETCH_LOGO}
        </pre>
        <div>
          <div>
            <span className="crt-amber">visitor</span>
            <span className="crt-dim">@</span>
            <span className="crt-amber">levan.dev</span>
          </div>
          <div className="crt-dim">─────────────────</div>
          <div className="crt-cols">
            {info.map(([k, v]) => (
              <div key={k} style={{ display: "contents" }}>
                <span className="crt-cyan">{k}</span>
                <span className="crt-white">{v}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8 }}>
            <span style={{ color: "#4afa7b" }}>███</span>
            <span style={{ color: "#ffb347" }}>███</span>
            <span style={{ color: "#5ce8e3" }}>███</span>
            <span style={{ color: "#ff5f56" }}>███</span>
            <span style={{ color: "#d9ffe6" }}>███</span>
            <span style={{ color: "#2c9650" }}>███</span>
          </div>
        </div>
      </div>
    );
  }, [push]);

  const printHelp = useCallback(() => {
    const rows: Array<[string, string]> = [
      ["help", "show this list"],
      ["about", "who is this guy?"],
      ["experience", "career timeline (try: experience 2)"],
      ["skills", "tech stack & expertise"],
      ["projects", "side projects with live links"],
      ["education", "academic background"],
      ["contact", "email / linkedin / github"],
      ["neofetch", "system information"],
      ["theme", "about the 3 visual themes of this site"],
      ["lang", "switch language (en/ka)"],
      ["clear", "wipe the screen"],
    ];
    push(
      <span className="crt-amber">Available commands:</span>,
      <div className="crt-cols">
        {rows.map(([c, d]) => (
          <div key={c} style={{ display: "contents" }}>
            <span className="crt-cyan">{c}</span>
            <span className="crt-dim">{d}</span>
          </div>
        ))}
      </div>,
      <span className="crt-dim">
        Hints: ↑/↓ history · Tab completes · there are hidden commands…
      </span>
    );
  }, [push]);

  const printAbout = useCallback(() => {
    push(
      <span className="crt-amber"># {t("about.heading")}</span>,
      <span className="crt-white">{t("about.desc")}</span>,
      "",
      <span>
        <span className="crt-cyan">{"->"} </span>
        {t("about.microfe")}: <span className="crt-dim">{t("about.microfe.desc")}</span>
      </span>,
      <span>
        <span className="crt-cyan">{"->"} </span>
        {t("about.e2e")}: <span className="crt-dim">{t("about.e2e.desc")}</span>
      </span>,
      <span>
        <span className="crt-cyan">{"->"} </span>
        {t("about.communication")}: <span className="crt-dim">{t("about.communication.desc")}</span>
      </span>,
      <span>
        <span className="crt-cyan">{"->"} </span>
        {t("about.docs")}: <span className="crt-dim">{t("about.docs.desc")}</span>
      </span>
    );
  }, [push, t]);

  const printExperience = useCallback(
    (arg?: string) => {
      const idx = arg ? parseInt(arg, 10) : NaN;
      if (!Number.isNaN(idx) && jobs[idx]) {
        const job = jobs[idx];
        push(
          <span className="crt-amber">
            [{idx}] {t(job.titleKey)} @ {t(job.company)}
            {job.client ? ` (${job.client})` : ""}
          </span>,
          <span className="crt-dim">{t(job.periodKey)}</span>,
          <span className="crt-white">{t(job.descKey)}</span>,
          ...job.responsibilityKeys.map((rk) => (
            <span key={rk}>
              <span className="crt-cyan"> • </span>
              <span className="crt-dim">{t(rk)}</span>
            </span>
          )),
          job.tech ? (
            <span>
              <span className="crt-cyan">stack:</span>{" "}
              <span className="crt-white">{job.tech.join(" · ")}</span>
            </span>
          ) : (
            ""
          )
        );
        return;
      }
      push(
        <span className="crt-amber"># {t("exp.heading")}</span>,
        <div className="crt-cols">
          {jobs.map((job, i) => (
            <div key={i} style={{ display: "contents" }}>
              <span className="crt-dim">[{i}] {t(job.periodKey)}</span>
              <span>
                <span className="crt-white">{t(job.titleKey)}</span>
                <span className="crt-dim"> @ </span>
                <span className="crt-cyan">
                  {t(job.company)}
                  {job.client ? ` (${job.client})` : ""}
                </span>
              </span>
            </div>
          ))}
        </div>,
        <span className="crt-dim">Details: experience &lt;index&gt; — e.g. `experience 2`</span>
      );
    },
    [push, t]
  );

  const printSkills = useCallback(() => {
    push(
      <span className="crt-amber"># {t("skills.heading")}</span>,
      ...skillCategories.map((cat) => (
        <span key={cat.titleKey}>
          <span className="crt-cyan">{t(cat.titleKey)}:</span>{" "}
          <span className="crt-white">{cat.items.join(" · ")}</span>
        </span>
      ))
    );
  }, [push, t]);

  const printProjects = useCallback(() => {
    push(
      <span className="crt-amber"># {t("projects.title")}</span>,
      ...projects.flatMap((p) => [
        <span key={p.name}>
          <span className="crt-white">{t(p.titleKey)}</span>
        </span>,
        <span key={p.name + "-role"} className="crt-dim">
          {t(p.roleKey)}
        </span>,
        <span key={p.name + "-desc"} className="crt-dim">
          {t(p.descKey)}
        </span>,
        <span key={p.name + "-link"}>
          <span className="crt-cyan">{"->"} </span>
          <a
            className="crt-link"
            href={p.link}
            target="_blank"
            rel="noopener noreferrer"
          >
            {p.url}
          </a>
          <span className="crt-dim">  [{p.tech.join(", ")}]</span>
        </span>,
        <span key={p.name + "-gap"}> </span>,
      ])
    );
  }, [push, t]);

  const printEducation = useCallback(() => {
    push(
      <span className="crt-amber"># {t("edu.heading")}</span>,
      ...degrees.flatMap((d) => [
        <span key={d.degreeKey}>
          <span className="crt-cyan">[{t(d.typeKey)}]</span>{" "}
          <span className="crt-white">{t(d.degreeKey)}</span>
        </span>,
        <span key={d.degreeKey + "-school"} className="crt-dim">
          {"   "}{t(d.schoolKey)} — {t(d.facultyKey)}
        </span>,
      ])
    );
  }, [push, t]);

  const printContact = useCallback(() => {
    push(
      <span className="crt-amber"># {t("nav.contact")}</span>,
      <span>
        <span className="crt-cyan">email    </span>
        <a className="crt-link" href={`mailto:${contact.email}`}>
          {contact.email}
        </a>
      </span>,
      <span>
        <span className="crt-cyan">linkedin </span>
        <a
          className="crt-link"
          href={contact.linkedin}
          target="_blank"
          rel="noopener noreferrer"
        >
          /in/levan-beroshvili
        </a>
      </span>,
      <span>
        <span className="crt-cyan">github   </span>
        <a
          className="crt-link"
          href={contact.github}
          target="_blank"
          rel="noopener noreferrer"
        >
          /levani132
        </a>
      </span>
    );
  }, [push, t]);

  /* ── The shell ────────────────────────────────────────────────────────── */

  const run = useCallback(
    (raw: string) => {
      const cmdline = raw.trim();
      push(
        <span>
          {PROMPT}
          <span className="crt-white">{cmdline}</span>
        </span>
      );
      if (!cmdline) return;
      historyRef.current.push(cmdline);
      histIdxRef.current = historyRef.current.length;

      const [cmd, ...args] = cmdline.split(/\s+/);
      switch (cmd.toLowerCase()) {
        case "help":
          printHelp();
          break;
        case "about":
          printAbout();
          break;
        case "experience":
        case "exp":
          printExperience(args[0]);
          break;
        case "skills":
          printSkills();
          break;
        case "projects":
          printProjects();
          break;
        case "education":
        case "edu":
          printEducation();
          break;
        case "contact":
          printContact();
          break;
        case "neofetch":
          printNeofetch();
          break;
        case "banner":
          push(<pre className="crt-banner">{BANNER}</pre>);
          break;
        case "whoami":
          push(
            <span className="crt-white">
              {t("hero.firstName")} {t("hero.lastName")} — {t("hero.title")}
            </span>,
            <span className="crt-dim">({t("hero.status")})</span>
          );
          break;
        case "theme": {
          const themes: Array<[name: string, desc: string]> = [
            ["cosmic", "liquid glass + 8,400 morphing particles"],
            ["terminal", "you are here."],
            ["editorial", "brutalist typography, acid ink"],
            ["odyssey", "3D night-world the camera drives through"],
          ];
          push(
            <span className="crt-amber">This site ships 4 full designs:</span>,
            ...themes.map(([name, desc]) => (
              <span key={name}>
                <a className="crt-link" href={`/${locale}/${name}`}>
                  /{name}
                </a>
                <span className="crt-dim">  {desc}</span>
              </span>
            )),
            <span className="crt-dim">
              Root URL serves NEXT_PUBLIC_THEME (default: cosmic)
            </span>
          );
          break;
        }
        case "lang": {
          const other = locale === "en" ? "ka" : "en";
          push(
            <span>
              <span className="crt-dim">Current: {locale}. Switch {"->"} </span>
              <a
                className="crt-link"
                href={pathname.replace(/^\/(en|ka)/, `/${other}`)}
              >
                /{other}
              </a>
            </span>
          );
          break;
        }
        case "clear":
          setLines([]);
          return;
        case "sudo":
          if (args.join(" ") === "hire-me") {
            push(
              <span className="crt-amber">[sudo] permission granted ✓</span>,
              <span className="crt-white">
                Excellent decision. Initiating handshake…
              </span>,
              <span>
                <span className="crt-cyan">{"->"} </span>
                <a className="crt-link" href={`mailto:${contact.email}`}>
                  {contact.email}
                </a>
              </span>
            );
          } else {
            push(
              <span className="crt-dim">
                visitor is not in the sudoers file. This incident will be
                reported. (try: sudo hire-me)
              </span>
            );
          }
          break;
        case "ls":
          push(
            <span>
              <span className="crt-cyan">career/  projects/  </span>
              <span className="crt-white">resume.txt  README.md  </span>
              <span className="crt-dim">.secrets</span>
            </span>
          );
          break;
        case "cat":
          if (args[0] === "resume.txt") printAbout();
          else if (args[0] === ".secrets")
            push(
              <span className="crt-dim">
                cat: .secrets: Permission denied (try `sudo hire-me`)
              </span>
            );
          else if (args[0] === "README.md")
            push(
              <span className="crt-white">
                # Levan Beroshvili — {t("hero.title")}. Type `help`.
              </span>
            );
          else
            push(
              <span className="crt-dim">
                cat: {args[0] ?? ""}: No such file or directory
              </span>
            );
          break;
        case "rm":
          push(
            <span className="crt-dim">
              Nice try. Protected by 8+ years of code-review instincts.
            </span>
          );
          break;
        case "exit":
          push(
            <span className="crt-dim">
              There is no escape. (Well — there&apos;s the cosmic theme.)
            </span>
          );
          break;
        case "pwd":
          push(<span className="crt-white">/home/visitor/levan-portfolio</span>);
          break;
        default:
          push(
            <span className="crt-dim">
              {cmd}: command not found — type `help`
            </span>
          );
      }
    },
    [
      push,
      printHelp,
      printAbout,
      printExperience,
      printSkills,
      printProjects,
      printEducation,
      printContact,
      printNeofetch,
      t,
      locale,
      pathname,
    ]
  );

  /* ── Boot sequence ────────────────────────────────────────────────────── */

  useEffect(() => {
    if (bootDoneRef.current) return;
    bootDoneRef.current = true;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const finishBoot = () => {
      push(
        <pre className="crt-banner" key="banner">{BANNER}</pre>,
        <span className="crt-white">
          {t("hero.title")} · Microsoft / Bank of Georgia / EPAM Systems
        </span>,
        ""
      );
      push(
        <span>
          {PROMPT}
          <span className="crt-white">neofetch</span>
        </span>
      );
      printNeofetch();
      push(
        <span className="crt-dim">
          Type `help` to explore — or just click a command below.
        </span>,
        ""
      );
      setReady(true);
    };

    if (reduced) {
      push(
        ...BOOT_LINES.map(([text], i) => (
          <span key={i} className="crt-dim">
            {text}
          </span>
        ))
      );
      finishBoot();
      return;
    }

    const timeouts: ReturnType<typeof setTimeout>[] = [];
    let elapsed = 400;
    for (const [text, delay] of BOOT_LINES) {
      elapsed += delay;
      timeouts.push(
        setTimeout(() => {
          push(<span className="crt-dim">{text}</span>);
        }, elapsed)
      );
    }
    timeouts.push(setTimeout(finishBoot, elapsed + 450));
    return () => timeouts.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Plumbing: clock, autoscroll, focus ───────────────────────────────── */

  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleTimeString(locale === "ka" ? "ka-GE" : "en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    tick();
    const id = setInterval(tick, 20000);
    return () => clearInterval(id);
  }, [locale]);

  useEffect(() => {
    const el = screenRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const focusInput = useCallback(() => {
    // Don't steal focus from text selection or link clicks
    const sel = window.getSelection();
    if (sel && sel.toString()) return;
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (ready) focusInput();
  }, [ready, focusInput]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      run(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const h = historyRef.current;
      if (h.length === 0) return;
      histIdxRef.current = Math.max(0, histIdxRef.current - 1);
      setInput(h[histIdxRef.current] ?? "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const h = historyRef.current;
      histIdxRef.current = Math.min(h.length, histIdxRef.current + 1);
      setInput(h[histIdxRef.current] ?? "");
    } else if (e.key === "Tab") {
      e.preventDefault();
      const match = COMMANDS.find((c) => c.startsWith(input.toLowerCase()));
      if (match && input) setInput(match);
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  const otherLocale = locale === "en" ? "ka" : "en";

  return (
    <div className="theme-terminal crt-flicker" onClick={focusInput}>
      {/* Status bar */}
      <div className="crt-statusbar">
        <span>
          <span className="dot" style={{ background: "#ff5f56" }} />
          <span className="dot" style={{ background: "#ffbd2e" }} />
          <span className="dot" style={{ background: "#27c93f" }} />
        </span>
        <span className="hidden sm:inline">
          levan@portfolio:~ — {t("hero.title")}
        </span>
        <span>
          <a className="lang-active" href="#">
            {locale.toUpperCase()}
          </a>
          {" / "}
          <a href={pathname.replace(/^\/(en|ka)/, `/${otherLocale}`)}>
            {otherLocale.toUpperCase()}
          </a>
          {clock && <span> · {clock}</span>}
        </span>
      </div>

      {/* Screen */}
      <div className="crt-screen" ref={screenRef}>
        {lines.map((line) => (
          <div className="crt-line" key={line.id}>
            {line.node}
          </div>
        ))}

        {ready && (
          <div className="crt-line">
            {PROMPT}
            <span className="crt-white">{input}</span>
            <span className="crt-cursor" />
          </div>
        )}

        <input
          ref={inputRef}
          className="crt-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          aria-label="Terminal input"
        />
      </div>

      {/* CRT overlays */}
      <div className="crt-glowband" aria-hidden />
      <div className="crt-scanlines" aria-hidden />
      <div className="crt-vignette" aria-hidden />

      {/* Command chips */}
      {ready && (
        <div className="crt-chips">
          {CHIPS.map((c) => (
            <button
              key={c}
              className="crt-chip"
              onClick={(e) => {
                e.stopPropagation();
                run(c);
                focusInput();
              }}
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
