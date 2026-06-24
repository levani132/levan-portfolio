# Resume Site Audit — cosmic theme (`/en`)

**Date:** 2026-06-24
**Target:** `http://localhost:3000/en` (root → `/en`, default `cosmic` theme), Next.js 16 dev server on Node 22
**Tooling:** Playwright (Chromium) + `@axe-core/playwright`, both added as devDependencies. Reproducible via `node audit.mjs` (writes `audit-report.json` + screenshots).
**Viewports:** 1440×900 (desktop), 768×1024 (tablet), 375×812 (mobile)

Screenshots in [`/audit-screenshots`](audit-screenshots): `desktop-1440.png`, `tablet-768.png`, `mobile-375.png`, `mobile-about-closeup.png`.

---

## Summary

| # | Area | Result | Action |
|---|------|--------|--------|
| 1 | Layout @ 3 viewports | No horizontal overflow; no overlap/clipping | ✅ pass |
| 2 | Console | Only benign WebGL driver perf warnings | ✅ no fix needed |
| 3 | Accessibility (axe) | 1 serious violation: `link-name` (2 nodes) | ✅ fixed |
| 3b | Contrast over bright nebula | Non-card text at risk over bright regions | ✅ fixed |
| 4 | SSR / no-JS | Counters OK; **5 of 9 role descriptions missing from SSR** | ✅ fixed |
| 5 | Meta tags | Stale "Lead Software Engineer / Frontend" | ✅ fixed |
| 6 | Empty experience cards | 6 of 9 cards rendered with no description | ✅ fixed |

Post-fix re-run: **0 axe violations, 0 overflow, 0 app console errors.**

---

## 1. Layout / responsive (screenshots)

Programmatic check (`documentElement.scrollWidth > clientWidth`) and per-element bounding-box scan for elements extending past the viewport:

| Viewport | Horizontal overflow | Offenders |
|----------|--------------------|-----------|
| 1440 | none | none |
| 768 | none | none |
| 375 | none | none |

Visual review of full-page screenshots: no overlapping elements, no clipped text, no broken grids. The hero stats grid, About bento, experience timeline, skills grid, projects, and education all reflow cleanly down to 375px. **No layout fixes required.**

## 2. Console

Captured on load and after scrolling through every section, at all three viewports.

- **Desktop:** 4 × `[WebGL] GL Driver Message (…Performance…): GPU stall due to ReadPixels`
- **Tablet / Mobile:** 0

These are **performance hints emitted by the headless Chromium SwiftShader GL driver**, not application errors. Confirmed no `readPixels`/`getImageData`/`preserveDrawingBuffer` calls exist in app code — the message comes from the driver compositing the WebGL canvas in a GPU-less CI environment and does not occur for users on real hardware/browsers. **No app errors; no fix needed.**

## 3. Accessibility — axe-core

Ran `wcag2a, wcag2aa, wcag21a, wcag21aa`.

**Violation (serious): `link-name` — 2 nodes.** The hero's LinkedIn and GitHub links are icon-only (`<Linkedin/>`, `<Github/>` SVGs) with no text and no `aria-label`, so they expose no accessible name to screen readers / are unlabeled in the tab order.

- `a[href*="linkedin"]` and `a[href*="levani132"]` in `src/components/Hero.tsx`.

**Fix:** added `aria-label="LinkedIn profile"` / `aria-label="GitHub profile"`. (Footer's social links already have visible text labels — fine.)

→ Re-run: **0 violations.**

### 3b. Color contrast over the bright animated background

This needs a human/visual check: the background is a `<canvas>` WebGL nebula, which **axe cannot evaluate** — it computes contrast against the CSS background (transparent) and so reports no contrast failures. That is a tooling blind spot, not a pass.

Visual finding (clearest on `mobile-375.png`): bright orange/green/magenta nebula regions drift directly behind page text. Two cases:

- **Text inside glass cards** (all experience bullets, skill chips, project/education cards, hero stats): the card background is `#000000cb` (~80% black), so text keeps a dark backing and stays well above 4.5:1 even when the nebula is bright behind the card. See `mobile-about-closeup.png` — card copy is crisp over a vivid nebula. **OK.**
- **Text NOT in a card** (section labels + headings, hero subtitle/description, About intro paragraph): light-grey/`sky-500` text sat directly over the canvas. Over the bright nebula regions this dropped well below AA.

**Fix (prioritizing readability, per request):**
- Added a `.legible` utility (dark text-shadow halo in dark mode, light halo in light mode) and applied it to the exposed text: hero subtitle/description/last-name, every section label + heading, and the About intro.
- Raised the base grey of the hero subtitle/description and About intro one step (`zinc-500/400 → zinc-600/700` light, `→ zinc-300` dark) for additional headroom.
- The vivid cosmos is preserved; only the text legibility is hardened.

## 4. SSR / no-JS check

Fetched server-rendered HTML with `curl` (no JS execution).

- **Stat counters:** present and correct in SSR — `8+`, `5`, `9`, `2`. (Earlier fix initializes the counter to its real value; the count-up is enhancement-only.) ✅
- **Role descriptions — FAIL (before fix):** the cosmic `Experience` accordion rendered each card's description *inside* a `{expanded && …}` block, and only the first 3 cards default to expanded (`useState(index < 3)`). So **6 of 9 role descriptions (TakeLessons, both Bank of Georgia roles, National Archives, both Georgian Railway roles) were entirely absent from the server HTML** and only appeared after a JS click — invisible to crawlers and no-JS users.

**Fix:** moved the description `<p>` out of the collapsible region so it always renders. Only the detail (bullets / tech / team) remains behind the toggle.

→ Re-check (`curl`): all 9 role descriptions now present in SSR HTML.

## 5. Meta tags

**Before (stale, contradicted the page):**
- `<title>`: "Levan Beroshvili — Lead Software Engineer"
- description: "…Specializing in React, Next.js, Angular, React Native, and TypeScript."
- keywords: included "Frontend Developer", front-end-only stack

**After (fixed, in `src/app/layout.tsx`):**
- `<title>`: **"Levan Beroshvili — Lead Full-Stack Engineer"**
- description: full-stack framing — React/Next.js front-ends + Node.js/NestJS services (MongoDB, Redis, Docker), team leadership at Microsoft/Bank of Georgia/EPAM, AI integration in Skype.
- keywords: Full-Stack Engineer, Staff Engineer, Product Engineer, Node.js, NestJS, MongoDB added; "Frontend Developer" removed.

Verified present in SSR HTML.

## 6. Empty experience cards

Same root cause as #4 — cards 4–9 showed only title/company/period with no body, reading as blank (the senior "Head of Software Engineering Unit" among them). The always-render-description fix resolves this: **every role now shows a description**, with bullets/tech/team expandable. No empty cards remain.

---

## Files changed

- `src/app/layout.tsx` — meta title / description / keywords → full-stack.
- `src/components/Hero.tsx` — `aria-label` on icon links; `.legible` + higher-contrast grey on subtitle/description/last-name.
- `src/components/Experience.tsx` — description always rendered (SSR + no empty cards); `.legible` on section header.
- `src/components/About.tsx` / `Skills.tsx` / `Projects.tsx` / `Education.tsx` — `.legible` on section labels/headings (+ About intro contrast bump).
- `src/app/globals.css` — `.legible` legibility-halo utility (dark + light variants).

## Notes / not changed

- WebGL "ReadPixels" console warnings are environment-specific (headless GL driver) and not actionable.
- The accordion still defaults the 3 most recent roles to fully expanded; older roles show their description and expand for detail on click.
