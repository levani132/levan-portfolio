import { chromium } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";
import fs from "node:fs";

const URL = process.env.AUDIT_URL || "http://localhost:3000/en";
const OUT = "audit-screenshots";
fs.mkdirSync(OUT, { recursive: true });

const viewports = [
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "mobile-375", width: 375, height: 812 },
];

const report = { url: URL, viewports: {}, axe: null, overflow: {} };

const browser = await chromium.launch();

for (const vp of viewports) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  const messages = [];
  page.on("console", (msg) => {
    const type = msg.type();
    if (type === "error" || type === "warning")
      messages.push({ type, text: msg.text() });
  });
  page.on("pageerror", (err) =>
    messages.push({ type: "pageerror", text: err.message })
  );

  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500); // let entrance animations + counters settle

  // Scroll through every section to trigger in-view animations / lazy work
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 600) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(250);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  // Detect horizontal overflow
  const overflow = await page.evaluate(() => {
    const de = document.documentElement;
    const docW = de.clientWidth;
    const offenders = [];
    for (const el of Array.from(document.querySelectorAll("*"))) {
      const r = el.getBoundingClientRect();
      if (r.right > docW + 1 || r.left < -1) {
        if (r.width > 0 && r.height > 0)
          offenders.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className || "").toString().slice(0, 60),
            right: Math.round(r.right),
            docW,
          });
      }
    }
    return {
      scrollW: de.scrollWidth,
      clientW: de.clientWidth,
      hasOverflow: de.scrollWidth > de.clientWidth + 1,
      offenders: offenders.slice(0, 15),
    };
  });
  report.overflow[vp.name] = overflow;

  await page.screenshot({
    path: `${OUT}/${vp.name}.png`,
    fullPage: true,
  });

  report.viewports[vp.name] = { console: messages };
  await ctx.close();
}

// axe-core on desktop
{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  report.axe = {
    violations: results.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        html: n.html.slice(0, 160),
        summary: n.failureSummary,
      })),
    })),
  };
  await ctx.close();
}

await browser.close();
fs.writeFileSync("audit-report.json", JSON.stringify(report, null, 2));
console.log("AUDIT DONE");
console.log(
  "Overflow:",
  Object.entries(report.overflow)
    .map(([k, v]) => `${k}=${v.hasOverflow}`)
    .join(" ")
);
console.log(
  "Console msgs:",
  Object.entries(report.viewports)
    .map(([k, v]) => `${k}=${v.console.length}`)
    .join(" ")
);
console.log("Axe violations:", report.axe.violations.length);
for (const v of report.axe.violations)
  console.log(`  - [${v.impact}] ${v.id} (${v.nodes.length} nodes)`);
