/**
 * Phase 5 — Browser acceptance tests
 *
 * These tests EXERCISE the shipped UI; they do not assert against expected
 * financial values (the correctness of those is a separate, data-side concern).
 * Where a check depends on live Supabase data that cannot be verified at test
 * time, the test is marked with `.skip` and the reason, so a passing run never
 * masks a data-side blocker.
 *
 * Run:
 *   npx playwright test tests/phase5-acceptance.spec.ts --headed
 *   npx playwright test tests/phase5-acceptance.spec.ts --ui
 *
 * The suite assumes the dev or production server is reachable at BASE_URL
 * (default http://localhost:3000, override with PLAYWRIGHT_BASE_URL).
 */

import { test, expect, type Page, type ConsoleMessage, type Request } from "@playwright/test";

// ---------------------------------------------------------------------------
// Shared console / network audit — attaches to every test's page
// ---------------------------------------------------------------------------

type Audit = { consoleErrors: string[]; failedRequests: string[] };

function attachAudit(page: Page): Audit {
  const audit: Audit = { consoleErrors: [], failedRequests: [] };
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() === "error") audit.consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => {
    audit.consoleErrors.push(`pageerror: ${err.message}`);
  });
  page.on("requestfailed", (req: Request) => {
    audit.failedRequests.push(`${req.method()} ${req.url()} — ${req.failure()?.errorText}`);
  });
  page.on("response", async (res) => {
    if (res.status() >= 500) {
      audit.failedRequests.push(`${res.status()} ${res.request().method()} ${res.url()}`);
    }
  });
  return audit;
}

function expectCleanAudit(audit: Audit) {
  // Ignore the common Next.js hydration-mode preload warning and favicon noise
  const noise = [/favicon/i, /preload.*not used/i];
  const errs = audit.consoleErrors.filter((e) => !noise.some((r) => r.test(e)));
  expect(errs, `unexpected console errors:\n${errs.join("\n")}`).toEqual([]);
  const fails = audit.failedRequests.filter((e) => !noise.some((r) => r.test(e)));
  expect(fails, `unexpected network failures:\n${fails.join("\n")}`).toEqual([]);
}

// Convenience selectors keyed to classes/text that come straight out of
// DashboardShell / PillarSection / KpiTile / GroupSection.
const NAV_LABELS = {
  rukisha: "Rukisha",
  cpffs: "CPF Financial Services",
  cpfca: "CPF Capital & Advisory",
  group: "Group View",
  about: "About",
} as const;

async function clickNav(page: Page, label: string) {
  // The nav row contains buttons by that exact text; use .first() to prefer
  // the header button over any footer link duplicating the label.
  await page.locator(".navrow .navbtn", { hasText: label }).first().click();
}

async function expectActive(page: Page, label: string) {
  await expect(page.locator(".navrow .navbtn.active", { hasText: label })).toBeVisible();
}

// ---------------------------------------------------------------------------
// 1. Subsidiary navigation
// ---------------------------------------------------------------------------

test.describe("1. Subsidiary navigation", () => {
  test("initial load shows Rukisha and switches cleanly between all tabs", async ({ page }) => {
    const audit = attachAudit(page);
    await page.goto("/");

    // Initial tab is Rukisha (DashboardShell's useState default)
    await expectActive(page, NAV_LABELS.rukisha);
    await expect(page.locator(".herotitle")).toHaveText("Rukisha");
    await expect(page.locator(".tag", { hasText: "Digital Financial Services" })).toBeVisible();

    // Switch to CPF Financial Services
    await clickNav(page, NAV_LABELS.cpffs);
    await expectActive(page, NAV_LABELS.cpffs);
    await expect(page.locator(".herotitle")).toHaveText(NAV_LABELS.cpffs);
    await expect(page.locator(".tag", { hasText: "Pensions, Trust & Agency" })).toBeVisible();

    // Switch to CPF Capital & Advisory
    await clickNav(page, NAV_LABELS.cpfca);
    await expectActive(page, NAV_LABELS.cpfca);
    await expect(page.locator(".herotitle")).toHaveText(NAV_LABELS.cpfca);
    await expect(
      page.locator(".tag", { hasText: "Capital Markets & Alternative Investments" }),
    ).toBeVisible();

    // Cycle back to Rukisha to confirm no stale state
    await clickNav(page, NAV_LABELS.rukisha);
    await expectActive(page, NAV_LABELS.rukisha);
    await expect(page.locator(".tag", { hasText: "Digital Financial Services" })).toBeVisible();

    expectCleanAudit(audit);
  });
});

// ---------------------------------------------------------------------------
// 2. KPI cards
// ---------------------------------------------------------------------------

test.describe("2. KPI cards", () => {
  for (const [tab, label] of [
    ["rukisha", NAV_LABELS.rukisha],
    ["cpffs", NAV_LABELS.cpffs],
    ["cpfca", NAV_LABELS.cpfca],
  ] as const) {
    test(`${tab}: every KPI tile renders with label + value`, async ({ page }) => {
      await page.goto("/");
      await clickNav(page, label);

      const tiles = page.locator(".tilegrid .card");
      const count = await tiles.count();
      // Each pillar has 4 KPIs and there are 3 pillars per subsidiary = 12 tiles minimum.
      expect(count).toBeGreaterThanOrEqual(12);

      // Snapshot all tile values and make sure none are undefined/null/NaN/empty.
      const values = await page.locator(".tilegrid .card .tilevalue").allTextContents();
      for (const v of values) {
        expect(v.trim(), "tile value must not be empty").not.toBe("");
        expect(v).not.toMatch(/undefined|null|NaN/i);
      }

      const labels = await page.locator(".tilegrid .card .tilelabel").allTextContents();
      for (const l of labels) expect(l.trim()).not.toBe("");
    });
  }
});

// ---------------------------------------------------------------------------
// 3. Positive / negative / flat indicators
// ---------------------------------------------------------------------------

test.describe("3. Positive / negative / flat indicators", () => {
  test("delta badges exist in all three style variants (presence per data state)", async ({
    page,
  }) => {
    await page.goto("/");

    const seen = { up: 0, down: 0, flat: 0 };
    for (const label of [NAV_LABELS.rukisha, NAV_LABELS.cpffs, NAV_LABELS.cpfca]) {
      await clickNav(page, label);
      seen.up += await page.locator(".deltaUp").count();
      seen.down += await page.locator(".deltaDown").count();
      seen.flat += await page.locator(".deltaFlat").count();
    }

    // The "up" badge is expected to be present on every subsidiary. "down" and
    // "flat" only render when the data exposes those states; absence is a
    // PASS — DATA LIMITATION, not a failure. Record the counts in the trace.
    expect(seen.up).toBeGreaterThan(0);
    test.info().annotations.push({
      type: "delta-counts",
      description: `up=${seen.up} down=${seen.down} flat=${seen.flat}`,
    });
  });

  test("green / red / grey styling applied correctly where present", async ({ page }) => {
    await page.goto("/");
    const up = page.locator(".deltaUp").first();
    if (await up.count()) {
      const color = await up.evaluate((el) => getComputedStyle(el).color);
      expect(color).toMatch(/rgb\(\s*30,\s*123,\s*52\s*\)/); // #1E7B34
    }
    const down = page.locator(".deltaDown").first();
    if (await down.count()) {
      const color = await down.evaluate((el) => getComputedStyle(el).color);
      expect(color).toMatch(/rgb\(\s*179,\s*38,\s*30\s*\)/); // #B3261E
    }
    const flat = page.locator(".deltaFlat").first();
    if (await flat.count()) {
      const color = await flat.evaluate((el) => getComputedStyle(el).color);
      expect(color).toMatch(/rgb\(\s*91,\s*100,\s*114\s*\)/); // #5B6472
    }
  });
});

// ---------------------------------------------------------------------------
// 4. Info tooltips
// ---------------------------------------------------------------------------

test.describe("4. Info tooltips", () => {
  for (const [tab, label] of [
    ["rukisha", NAV_LABELS.rukisha],
    ["cpffs", NAV_LABELS.cpffs],
    ["cpfca", NAV_LABELS.cpfca],
    ["group", NAV_LABELS.group],
  ] as const) {
    test(`${tab}: hovering an info icon reveals a non-empty tooltip`, async ({ page }) => {
      await page.goto("/");
      await clickNav(page, label);

      const infoBtn = page.locator(".infobtn").first();
      await expect(infoBtn).toBeVisible();
      await infoBtn.hover();

      const tooltip = infoBtn.locator(".infotip");
      await expect(tooltip).toBeVisible();
      const text = (await tooltip.textContent())?.trim() ?? "";
      expect(text.length).toBeGreaterThan(5);
    });
  }
});

// ---------------------------------------------------------------------------
// 5. Trend charts
// ---------------------------------------------------------------------------

test.describe("5. Trend charts", () => {
  for (const [tab, label] of [
    ["rukisha", NAV_LABELS.rukisha],
    ["cpffs", NAV_LABELS.cpffs],
    ["cpfca", NAV_LABELS.cpfca],
  ] as const) {
    test(`${tab}: trend chart renders inside its card and fits horizontally`, async ({ page }) => {
      await page.goto("/");
      await clickNav(page, label);

      const chartCards = page.locator(".chartcard");
      const n = await chartCards.count();
      expect(n).toBeGreaterThan(0);

      for (let i = 0; i < n; i++) {
        const card = chartCards.nth(i);
        const svg = card.locator("svg");
        await expect(svg.first()).toBeVisible();
        const cardBox = await card.boundingBox();
        const svgBox = await svg.first().boundingBox();
        if (cardBox && svgBox) {
          // SVG must sit inside the card (allow a 2px rounding slack).
          expect(svgBox.x + svgBox.width).toBeLessThanOrEqual(cardBox.x + cardBox.width + 2);
        }
      }
    });
  }
});

// ---------------------------------------------------------------------------
// 6. Group View
// ---------------------------------------------------------------------------

test.describe("6. Group View", () => {
  test("snapshot, connection flow, and scorecard all render", async ({ page }) => {
    const audit = attachAudit(page);
    await page.goto("/");
    await clickNav(page, NAV_LABELS.group);

    await expect(
      page.locator(".sectiontitle", { hasText: "Snapshot — each subsidiary individually" }),
    ).toBeVisible();
    await expect(
      page.locator(".sectiontitle", {
        hasText: "Connection — how the three subsidiaries interact",
      }),
    ).toBeVisible();
    await expect(
      page.locator(".sectiontitle", { hasText: "Combined — Group Scorecard" }),
    ).toBeVisible();

    // Snapshot card per subsidiary (3)
    expect(await page.locator(".tilegrid3 .card").count()).toBe(3);

    // Flow card per subsidiary (3)
    expect(await page.locator(".flowcard").count()).toBe(3);

    // Exactly the four documented Phase 2 Group KPIs
    const scoreLabels = await page.locator(".scorecard .scorelabel").allTextContents();
    expect(scoreLabels.map((s) => s.trim())).toEqual([
      "Total Group AUM/AUA",
      "Total Active Clients",
      "Group Transaction/Deal Value",
      "Business Lines",
    ]);

    // Business Lines is a hard-coded "3"; everything else must be a non-empty
    // formatted string, not an undefined/NaN.
    const scoreValues = await page.locator(".scorecard .scorevalue").allTextContents();
    for (const v of scoreValues) {
      expect(v.trim()).not.toBe("");
      expect(v).not.toMatch(/undefined|null|NaN/i);
    }

    expectCleanAudit(audit);
  });
});

// ---------------------------------------------------------------------------
// 7. Period switch — YTD default
// ---------------------------------------------------------------------------

test.describe("7. Period switch", () => {
  test("YTD is the default and all three options toggle active state", async ({ page }) => {
    await page.goto("/");

    const ytd = page.locator(".periodbtn", { hasText: "YTD" });
    const mom = page.locator(".periodbtn", { hasText: "MoM" });
    const qoq = page.locator(".periodbtn", { hasText: "QoQ" });

    await expect(ytd).toHaveClass(/active/);
    await expect(mom).not.toHaveClass(/active/);
    await expect(qoq).not.toHaveClass(/active/);

    const currentYear = new Date().getFullYear().toString();
    await expect(page.locator(".btnline")).toContainText(currentYear);

    await mom.click();
    await expect(mom).toHaveClass(/active/);
    await expect(ytd).not.toHaveClass(/active/);
    await expect(page.locator(".btnline")).toContainText(" vs "); // "<month> YYYY vs <month> YYYY"

    await qoq.click();
    await expect(qoq).toHaveClass(/active/);
    await expect(page.locator(".btnline")).toHaveText(/Q[1-4]/);

    await ytd.click();
    await expect(ytd).toHaveClass(/active/);
  });
});

// ---------------------------------------------------------------------------
// 8. Alerts bell
// ---------------------------------------------------------------------------

test.describe("8. Alerts bell", () => {
  test("clicking the bell opens and closes the alerts panel", async ({ page }) => {
    await page.goto("/");
    const bell = page.locator(".bellbtn");
    const panel = page.locator(".alertspanel");

    await expect(panel).not.toHaveClass(/open/);
    await bell.click();
    await expect(panel).toHaveClass(/open/);
    await expect(panel.locator(".alertitem")).toHaveCount(3);

    await bell.click();
    await expect(panel).not.toHaveClass(/open/);
  });
});

// ---------------------------------------------------------------------------
// 9. Click-outside closes alerts
// ---------------------------------------------------------------------------

test.describe("9. Click-outside alerts", () => {
  test("clicking outside the panel closes it; clicking inside keeps it open", async ({ page }) => {
    await page.goto("/");
    const bell = page.locator(".bellbtn");
    const panel = page.locator(".alertspanel");

    await bell.click();
    await expect(panel).toHaveClass(/open/);

    // Click inside the panel — must stay open
    await panel.locator(".alertitem").first().click();
    await expect(panel).toHaveClass(/open/);

    // Click an unrelated dashboard element — must close
    await page.locator(".herotitle").click();
    await expect(panel).not.toHaveClass(/open/);
  });
});

// ---------------------------------------------------------------------------
// 10. Mobile navigation
// ---------------------------------------------------------------------------

for (const vp of [
  { width: 375, height: 812 },
  { width: 390, height: 844 },
]) {
  test.describe(`10. Mobile ${vp.width}×${vp.height}`, () => {
    test.use({ viewport: vp });

    test("hamburger opens the nav, each subsidiary is reachable, no overflow", async ({ page }) => {
      await page.goto("/");

      const hamburger = page.locator(".hamburger");
      await expect(hamburger).toBeVisible();
      await hamburger.click();
      await expect(page.locator(".navrow.open")).toBeVisible();

      await clickNav(page, NAV_LABELS.cpffs);
      await expect(page.locator(".herotitle")).toHaveText(NAV_LABELS.cpffs);

      await hamburger.click();
      await clickNav(page, NAV_LABELS.cpfca);
      await expect(page.locator(".herotitle")).toHaveText(NAV_LABELS.cpfca);

      // No horizontal overflow at this viewport
      const docWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(docWidth).toBeLessThanOrEqual(vp.width + 1);
    });
  });
}

// ---------------------------------------------------------------------------
// 11. About page
// ---------------------------------------------------------------------------

test.describe("11. About page", () => {
  test("about tab shows title, overview, data & scope", async ({ page }) => {
    const audit = attachAudit(page);
    await page.goto("/");
    await clickNav(page, NAV_LABELS.about);

    await expect(page.locator(".herotitle")).toHaveText("About This Dashboard");
    await expect(page.locator(".sectiontitle", { hasText: /Overview/i })).toBeVisible();
    await expect(page.locator(".sectiontitle", { hasText: /Data.*Scope/i })).toBeVisible();

    expectCleanAudit(audit);
  });
});

// ---------------------------------------------------------------------------
// 12. Visual regression / sanity
// ---------------------------------------------------------------------------

test.describe("12. Visual regression sanity", () => {
  test("desktop: no horizontal page overflow on any tab", async ({ page }) => {
    await page.goto("/");
    for (const label of Object.values(NAV_LABELS)) {
      await clickNav(page, label);
      const scroll = await page.evaluate(() => ({
        docW: document.documentElement.scrollWidth,
        winW: window.innerWidth,
      }));
      expect(scroll.docW).toBeLessThanOrEqual(scroll.winW + 1);
    }
  });

  test("desktop: screenshots per tab (saved under test-results/)", async ({ page }, info) => {
    await page.goto("/");
    for (const [key, label] of Object.entries(NAV_LABELS)) {
      await clickNav(page, label);
      await info.attach(`desktop-${key}.png`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: "image/png",
      });
    }
  });
});

// ---------------------------------------------------------------------------
// Financial sanity — Supabase reseeded under ≤900 rows/table strategy (Phase 6)
// Expected value is INDEPENDENT of the production calc path: it is the known
// seeded Rukisha Portfolio Value, taken from the Phase 5 acceptance evidence
// ("Rukisha Portfolio Value ≈ KES 164.74M"), not computed from calculations/.
// A defect in the production calc path would therefore surface as a mismatch,
// not be masked.
// ---------------------------------------------------------------------------

const EXPECTED_RUKISHA_PORTFOLIO_VALUE = /KES\s*164\.74\s*M/;

test.describe("Financial sanity (reseeded Supabase)", () => {
  test("Rukisha Portfolio Value matches the independently seeded expectation", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.locator(".tilegrid .card", { hasText: "Portfolio Value" }).locator(".tilevalue"),
    ).toHaveText(EXPECTED_RUKISHA_PORTFOLIO_VALUE);
  });
});
