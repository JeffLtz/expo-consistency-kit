/**
 * Drive an Expo web app with your installed Chrome — no browser download.
 *
 * Setup (once, in a scratch dir so your app's deps stay clean):
 *   mkdir -p /tmp/pw && cd /tmp/pw && npm init -y && npm i playwright-core
 *
 * Run:
 *   npx expo start --web --port 8090       # in the app
 *   node drive-web.js http://localhost:8090
 *
 * Adapt the DRIVE section to reach the screen you changed, then LOOK at the
 * screenshots — don't just check the exit code. Styling bugs (dropped
 * classNames, stretched layouts) render "successfully".
 */
const { chromium } = require("playwright-core");

const url = process.argv[2] ?? "http://localhost:8090";

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 480, height: 900 } });

  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push("console.error: " + m.text());
  });

  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500); // let entrance animations settle
  await page.screenshot({ path: "01-landing.png" });

  // ── DRIVE ──────────────────────────────────────────────────────────────
  // Examples:
  //   await page.getByText("Frequency", { exact: true }).click();
  //   await page.getByTestId("play-button").click();
  //   await page.waitForTimeout(1200);
  //   await page.screenshot({ path: "02-after-click.png" });
  // ───────────────────────────────────────────────────────────────────────

  console.log(errors.length ? "ERRORS:\n" + errors.join("\n") : "NO-PAGE-ERRORS");
  await browser.close();
})().catch((e) => {
  console.error("DRIVE-FAILED", e);
  process.exit(1);
});
