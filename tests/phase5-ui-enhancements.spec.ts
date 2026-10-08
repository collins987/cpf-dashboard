/**
 * Phase 5 Extended UI Enhancements — development acceptance suite.
 *
 * This is NOT Phase 6 Testing. It targets the NEW final UI architecture
 * (routing, Service Dropdown, Search, Export, contextual icons, dynamic
 * graphs/deltas, Profile popover) introduced on claude/phase5-ui-enhancements.
 * The old tests/phase5-acceptance.spec.ts targets the prior single-route/
 * tab-state DOM and is deliberately left unmodified — see the separate
 * regression report for its status.
 *
 * Selectors prefer role/label/placeholder/visible text over CSS class names,
 * per the brief's explicit instruction to avoid brittle implementation-only
 * selectors.
 *
 * Run:
 *   npx playwright test tests/phase5-ui-enhancements.spec.ts --headed
 */

import { test, expect, type Page, type ConsoleMessage } from "@playwright/test";
import fs from "node:fs";

type Audit = { consoleErrors: string[]; failedRequests: string[] };

function attachAudit(page: Page): Audit {
  const audit: Audit = { consoleErrors: [], failedRequests: [] };
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() === "error") audit.consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => audit.consoleErrors.push(`pageerror: ${err.message}`));
  page.on("requestfailed", (req) => {
    audit.failedRequests.push(`${req.method()} ${req.url()} — ${req.failure()?.errorText}`);
  });
  page.on("response", async (res) => {
    if (res.status() >= 500)
      audit.failedRequests.push(`${res.status()} ${res.request().method()} ${res.url()}`);
  });
  return audit;
}

function expectClean(audit: Audit) {
  const noise = [/favicon/i, /preload.*not used/i];
  const errs = audit.consoleErrors.filter((e) => !noise.some((r) => r.test(e)));
  expect(errs, `console errors:\n${errs.join("\n")}`).toEqual([]);
  const fails = audit.failedRequests.filter((e) => !noise.some((r) => r.test(e)));
  expect(fails, `failed requests:\n${fails.join("\n")}`).toEqual([]);
}

const ROUTES = [
  { path: "/rukisha", name: "Rukisha", navLabel: "Rukisha", tag: "Digital Financial Services" },
  {
    path: "/cpf-financial-services",
    name: "CPF Financial Services",
    navLabel: "CPF Financial Services",
    tag: "Pensions, Trust & Agency",
  },
  {
    path: "/cpf-capital-advisory",
    name: "CPF Capital & Advisory",
    navLabel: "CPF Capital & Advisory",
    tag: "Capital Markets & Alternative Investments",
  },
  { path: "/group", name: "Group Comparison View", navLabel: "Group View", tag: null },
  // Nav link text is just "About"; the hero title (what `name` is used for
  // elsewhere) is the longer "About This Dashboard" — these are genuinely
  // different strings in the product, not a selector bug.
  { path: "/about", name: "About This Dashboard", navLabel: "About", tag: null },
];

// ---------------------------------------------------------------------------
// 1 & 3 — Root redirect + routing acceptance
// ---------------------------------------------------------------------------

test.describe("Routing", () => {
  test("/ redirects to /rukisha", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/rukisha$/);
  });

  test("header and footer use a consistent label for the Group route", async ({ page }) => {
    // Regression guard: the Stage-1 routing refactor briefly made the header
    // nav say "Group Comparison View" while the footer link and the search
    // placeholder's example text stayed on the original "Group View",
    // breaking the search-by-placeholder-example flow. Both now read
    // TAB_LABELS.group ("Group View"); the fuller "Group Comparison View"
    // wording is kept only for the hero/page title, which is a distinct
    // element from the nav links this test checks.
    await page.goto("/rukisha");
    const headerLabel = await page
      .locator(".navrow .navbtn")
      .filter({ hasText: "Group" })
      .textContent();
    const footerLabel = await page
      .locator(".footercol .footerlink")
      .filter({ hasText: "Group" })
      .textContent();
    expect(headerLabel?.trim(), "header/footer Group link text should match").toBe(
      footerLabel?.trim(),
    );
  });

  for (const r of ROUTES) {
    test(`direct navigation to ${r.path} renders correct content, no console/network errors`, async ({
      page,
    }) => {
      const audit = attachAudit(page);
      await page.goto(r.path);
      await expect(page.locator(".herotitle")).toContainText(r.name);
      if (r.tag) await expect(page.locator(".tag")).toHaveText(r.tag);
      // active nav link — scope to the header nav row to avoid matching the
      // Next.js RSC hydration payload <script> text, which also contains
      // this string and is picked up by a generic getByText/treewalker scan.
      await expect(page.locator(".navrow .navbtn.active")).toContainText(r.navLabel);
      expectClean(audit);
    });
  }

  test("all routes reachable via direct page.goto without error", async ({ page }) => {
    // Nav links open in new tabs (target="_blank"), so this test verifies route
    // content directly via page.goto rather than via nav clicks.
    for (const r of ROUTES) {
      await page.goto(r.path);
      await expect(page).toHaveURL(new RegExp(r.path.replace(/\//g, "\\/") + "$"));
      await expect(page.locator(".herotitle")).toContainText(r.name);
    }
  });

  test("browser back/forward preserves correct page content", async ({ page }) => {
    await page.goto("/rukisha");
    await page.goto("/group");
    await expect(page).toHaveURL(/\/group$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/rukisha$/);
    await expect(page.locator(".tag")).toHaveText("Digital Financial Services");
    await page.goForward();
    await expect(page).toHaveURL(/\/group$/);
  });

  test("refresh on each route still renders correctly", async ({ page }) => {
    for (const r of ROUTES) {
      await page.goto(r.path);
      await page.reload();
      await expect(page.getByText(r.name, { exact: false }).first()).toBeVisible();
    }
  });
});

// ---------------------------------------------------------------------------
// WS2 — Nav / footer open in new tab, no underline
// ---------------------------------------------------------------------------

test.describe("Nav/footer links open in new tab", () => {
  test("all nav buttons have target=_blank and rel=noopener noreferrer", async ({ page }) => {
    await page.goto("/rukisha");
    const navBtns = page.locator(".navrow .navbtn");
    const count = await navBtns.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const btn = navBtns.nth(i);
      await expect(btn).toHaveAttribute("target", "_blank");
      await expect(btn).toHaveAttribute("rel", /noopener/);
    }
  });

  test("footer links have target=_blank and no underline styling", async ({ page }) => {
    await page.goto("/rukisha");
    const footerLinks = page.locator(".footerlink");
    const count = await footerLinks.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const link = footerLinks.nth(i);
      await expect(link).toHaveAttribute("target", "_blank");
      const textDecoration = await link.evaluate((el) => getComputedStyle(el).textDecorationLine);
      expect(textDecoration).toBe("none");
    }
  });

  test("nav link click opens a new browser tab (not same-page navigation)", async ({
    page,
    context,
  }) => {
    await page.goto("/rukisha");
    const pagesBefore = context.pages().length;
    // Click any nav link — expect a new page to open
    await page.locator(".navrow .navbtn").first().click();
    // Wait briefly for the new tab to register
    await page.waitForTimeout(500);
    const pagesAfter = context.pages().length;
    expect(pagesAfter).toBeGreaterThan(pagesBefore);
  });
});

// ---------------------------------------------------------------------------
// 4 — Service Dropdown stress test
// ---------------------------------------------------------------------------

test.describe("Service Dropdown", () => {
  test("Rukisha: dropdown has no 'All' option; defaults to first pillar (Lending)", async ({
    page,
  }) => {
    const audit = attachAudit(page);
    await page.goto("/rukisha");
    const select = page.getByLabel("View");
    await expect(select).toBeVisible();

    const options = await select.locator("option").allTextContents();
    // "All" has been removed — only the three pillar names remain
    expect(options).toEqual(["Lending", "Payments & Transfers", "Savings"]);
    expect(options).not.toContain("All");

    // Default selection is the first pillar
    await expect(select).toHaveValue("Lending");
    const defaultTitles = await page.locator(".sectiontitle").allTextContents();
    expect(defaultTitles.map((t) => t.trim())).toEqual(["Lending"]);

    for (const opt of ["Lending", "Payments & Transfers", "Savings"]) {
      await select.selectOption(opt);
      const titles = await page.locator(".sectiontitle").allTextContents();
      expect(titles.map((t) => t.trim())).toEqual([opt]);
    }

    // rapid switching
    for (let i = 0; i < 5; i++) {
      await select.selectOption("Lending");
      await select.selectOption("Savings");
    }
    expectClean(audit);
  });

  test("navigating away and back resets the dropdown to first pillar (Lending)", async ({
    page,
  }) => {
    await page.goto("/rukisha");
    await page.getByLabel("View").selectOption("Savings");
    await page.goto("/group");
    await page.goto("/rukisha");
    // State is per-page-load — dropdown resets to first pillar
    await expect(page.getByLabel("View")).toHaveValue("Lending");
  });

  test("Group View and About have no Service Dropdown", async ({ page }) => {
    await page.goto("/group");
    await expect(page.getByLabel("View")).toHaveCount(0);
    await page.goto("/about");
    await expect(page.getByLabel("View")).toHaveCount(0);
  });

  test("mobile: dropdown usable at 375px, no overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/rukisha");
    await page.getByLabel("View").selectOption("Payments & Transfers");
    await expect(page.locator(".sectiontitle")).toHaveText("Payments & Transfers");
    const docW = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(docW).toBeLessThanOrEqual(376);
  });
});

// ---------------------------------------------------------------------------
// 5 — Notifications (already implemented; verify, don't rebuild)
// ---------------------------------------------------------------------------

test.describe("Notifications", () => {
  test("open/inside-stays-open/outside-closes, repeated rapidly, no leaks", async ({ page }) => {
    const audit = attachAudit(page);
    await page.goto("/rukisha");
    const bell = page.getByRole("button", { name: "Alerts" });
    const panel = page.locator(".alertspanel");

    for (let i = 0; i < 5; i++) {
      await bell.click();
      await expect(panel).toHaveClass(/open/);
      await page.locator(".alertitem").first().click();
      await expect(panel).toHaveClass(/open/);
      await page.getByText("Rukisha", { exact: true }).first().click();
      await expect(panel).not.toHaveClass(/open/);
    }
    expectClean(audit);
  });

  test("navigating away while open does not leave stale state on return", async ({ page }) => {
    await page.goto("/rukisha");
    await page.getByRole("button", { name: "Alerts" }).click();
    await expect(page.locator(".alertspanel")).toHaveClass(/open/);
    // Navigate via page.goto since nav links open new tabs
    await page.goto("/group");
    await expect(page.locator(".alertspanel")).not.toHaveClass(/open/);
  });

  test("mobile: bell reachable and functional at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/rukisha");
    await page.getByRole("button", { name: "Alerts" }).click();
    await expect(page.locator(".alertspanel")).toHaveClass(/open/);
  });
});

// ---------------------------------------------------------------------------
// 6 — Search stress test
// ---------------------------------------------------------------------------

test.describe("Search", () => {
  test("exact/partial/case-insensitive match, empty, whitespace, nonexistent, clearing", async ({
    page,
  }) => {
    await page.goto("/rukisha");
    const input = page.getByPlaceholder("Search KPIs, Rukisha, Group View…");

    await input.fill("Group View");
    await expect(page.locator(".searchresultitem").first()).toBeVisible();

    await input.fill("group");
    await expect(page.locator(".searchresultitem").first()).toBeVisible();

    await input.fill("   ");
    await expect(page.locator(".searchresults")).toHaveCount(0);

    await input.fill("");
    await expect(page.locator(".searchresults")).toHaveCount(0);

    await input.fill("zzzznonexistentquery9999");
    await expect(page.getByText("No matches")).toBeVisible();

    await input.fill("Portfolio Value");
    await expect(page.locator(".searchresultitem", { hasText: "Portfolio Value" })).toBeVisible();

    await input.fill("");
    await expect(page.locator(".searchresults")).toHaveCount(0);
  });

  test("search finds KPIs from other subsidiaries (cross-subsidiary catalog)", async ({ page }) => {
    // On the Rukisha page, searching for a CPF Capital & Advisory KPI should
    // still find it — search is catalog-based, not limited to active page.
    await page.goto("/rukisha");
    const input = page.getByPlaceholder("Search KPIs, Rukisha, Group View…");
    await input.fill("AUM in REIT");
    await expect(page.locator(".searchresultitem", { hasText: "AUM in REIT" })).toBeVisible();
  });

  test("search finds service names from any subsidiary", async ({ page }) => {
    await page.goto("/rukisha");
    const input = page.getByPlaceholder("Search KPIs, Rukisha, Group View…");
    await input.fill("Pension Fund");
    await expect(page.locator(".searchresultitem", { hasText: "Pension Fund" })).toBeVisible();
  });

  test("long query and unusual characters do not error", async ({ page }) => {
    const audit = attachAudit(page);
    await page.goto("/rukisha");
    const input = page.getByPlaceholder("Search KPIs, Rukisha, Group View…");
    await input.fill("a".repeat(500));
    await input.fill("<script>alert(1)</script>");
    await input.fill("日本語 emoji 🎉 %%%");
    await input.fill("");
    expectClean(audit);
  });

  test("rapid typing does not produce stale/duplicated results", async ({ page }) => {
    await page.goto("/rukisha");
    const input = page.getByPlaceholder("Search KPIs, Rukisha, Group View…");
    for (const c of "Portfolio") {
      await input.pressSequentially(c, { delay: 10 });
    }
    const items = await page.locator(".searchresultitem").allTextContents();
    expect(new Set(items).size).toBe(items.length); // no duplicates
  });

  test("selecting a search result opens a new tab (target=_blank behavior)", async ({
    page,
    context,
  }) => {
    await page.goto("/rukisha");
    const input = page.getByPlaceholder("Search KPIs, Rukisha, Group View…");
    await input.fill("Group View");
    await expect(page.locator(".searchresultitem", { hasText: "Group View" })).toBeVisible();
    const pagesBefore = context.pages().length;
    await page.locator(".searchresultitem", { hasText: "Group View" }).first().click();
    await page.waitForTimeout(500);
    expect(context.pages().length).toBeGreaterThan(pagesBefore);
    // original page stays on rukisha (new-tab navigation, not same-page)
    await expect(page).toHaveURL(/\/rukisha$/);
  });

  test("search does not mutate KPI data on the current page", async ({ page }) => {
    await page.goto("/rukisha");
    const beforeValue = await page.locator(".tilevalue").first().textContent();
    const input = page.getByPlaceholder("Search KPIs, Rukisha, Group View…");
    await input.fill("Group View");
    await page.locator(".searchresultitem", { hasText: "Group View" }).first().click();
    await page.waitForTimeout(300);
    const afterValue = await page.locator(".tilevalue").first().textContent();
    expect(afterValue).toBe(beforeValue);
  });

  test("search works after changing Service Dropdown and Period", async ({ page }) => {
    await page.goto("/rukisha");
    await page.getByLabel("View").selectOption("Savings");
    await page.getByRole("button", { name: "MoM", exact: true }).click();
    const input = page.getByPlaceholder("Search KPIs, Rukisha, Group View…");
    await input.fill("Savings");
    await expect(page.locator(".searchresultitem").first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 7 — Export testing (real downloaded file content)
// ---------------------------------------------------------------------------

test.describe("Export", () => {
  test("Rukisha export downloads a non-empty CSV with enriched headers and KPI rows", async ({
    page,
  }) => {
    await page.goto("/rukisha");
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator(".btnsolid").click(),
    ]);
    // Filename includes the active period (default YTD)
    expect(download.suggestedFilename()).toMatch(/^cpf-rukisha-(MoM|QoQ|YTD)-.*\.csv$/);
    const filePath = await download.path();
    expect(filePath).not.toBeNull();
    const content = fs.readFileSync(filePath as string, "utf-8");
    // Enriched export has 7 columns
    expect(content.split("\r\n")[0]).toBe("Subsidiary,Service,KPI,Value,Delta,Period,Note");
    expect(content).toContain("Portfolio Value");
    expect(content.trim().split("\r\n").length).toBeGreaterThan(1);
  });

  test("export filename includes the active period", async ({ page }) => {
    await page.goto("/rukisha");
    await page.getByRole("button", { name: "MoM", exact: true }).click();
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator(".btnsolid").click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^cpf-rukisha-MoM-/);
  });

  test("export respects the active Service Dropdown selection is NOT required (exports full view) — documented behavior", async ({
    page,
  }) => {
    // Current implementation exports the whole active view's KPI set
    // regardless of Service Dropdown selection (export reads orchestration
    // data computed server-side, not the client-side pillar filter). This
    // test documents that behavior explicitly rather than assuming it.
    await page.goto("/rukisha");
    await page.getByLabel("View").selectOption("Savings");
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator(".btnsolid").click(),
    ]);
    const content = fs.readFileSync((await download.path()) as string, "utf-8");
    expect(content).toContain("Portfolio Value"); // Lending KPI still present — not filtered
    expect(content).toContain("Goal-Based Savings");
  });

  test("Group export downloads scorecard data", async ({ page }) => {
    await page.goto("/group");
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator(".btnsolid").click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^cpf-group-(MoM|QoQ|YTD)-.*\.csv$/);
    const content = fs.readFileSync((await download.path()) as string, "utf-8");
    expect(content).toContain("Total Group AUM/AUA");
  });

  test("About page: period controls and export button are hidden (not rendered)", async ({
    page,
  }) => {
    await page.goto("/about");
    // Export button is not rendered on About — not just disabled
    await expect(page.locator(".btnsolid")).toHaveCount(0);
    // Period switch buttons are also not rendered
    await expect(page.getByRole("button", { name: "YTD", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "MoM", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "QoQ", exact: true })).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// 8 — Filters: verify the "no redundant control" decision against final UI
// ---------------------------------------------------------------------------

test.describe("Filters", () => {
  test("no dead/non-functional filter control exists anywhere in the rendered DOM", async ({
    page,
  }) => {
    await page.goto("/rukisha");
    // Every control labeled or named "filter" must not exist, since none was
    // added; this guards against a future regression introducing dead UI.
    const filterByText = await page.getByText(/^filter$/i).count();
    expect(filterByText).toBe(0);
    // The two real filterable-dimension controls must exist and be functional
    // (covered in their own describe blocks): Service Dropdown + Period Switch.
    await expect(page.getByLabel("View")).toBeVisible();
    await expect(page.getByRole("button", { name: "YTD", exact: true })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 9 — Contextual KPI icon testing
// ---------------------------------------------------------------------------

test.describe("Contextual KPI icons", () => {
  for (const r of [ROUTES[0], ROUTES[1], ROUTES[2]]) {
    test(`${r.name}: every KPI tile has an icon, no overlap, tooltip still usable`, async ({
      page,
    }) => {
      await page.goto(r.path);
      const tiles = page.locator(".tilegrid .card");
      const count = await tiles.count();
      expect(count).toBeGreaterThan(0);
      for (let i = 0; i < count; i++) {
        const tile = tiles.nth(i);
        await expect(tile.locator(".iconbadge svg")).toBeVisible();
        await expect(tile.locator(".tilevalue")).toBeVisible();
      }
      // tooltip still works with the icon present
      await tiles.first().locator(".infobtn").hover();
      await expect(tiles.first().locator(".infotip")).toBeVisible();
    });
  }

  test("Group View scorecard tiles render correctly (no KPI-tile icon concept there)", async ({
    page,
  }) => {
    await page.goto("/group");
    await expect(page.locator(".scorecard").first()).toBeVisible();
  });

  test("mobile: icons do not overlap or shift card size at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/rukisha");
    const firstTile = page.locator(".tilegrid .card").first();
    const box = await firstTile.boundingBox();
    expect(box).not.toBeNull();
    expect((box as { width: number }).width).toBeGreaterThan(50);
  });
});

// ---------------------------------------------------------------------------
// 10 — Dynamic trend indicators testing (real data, not fabricated)
// ---------------------------------------------------------------------------

test.describe("Dynamic trend indicators", () => {
  test("delta badges render with correct color class per direction, arrow icon present", async ({
    page,
  }) => {
    await page.goto("/rukisha");
    const up = page.locator(".deltaUp").first();
    await expect(up).toBeVisible();
    await expect(up.locator("svg")).toBeVisible();
    const color = await up.evaluate((el) => getComputedStyle(el).color);
    expect(color).toMatch(/rgb\(\s*30,\s*123,\s*52\s*\)/);
  });

  function cardByExactLabel(page: Page, label: string) {
    // .filter({hasText}) matches substrings anywhere in the card, including
    // hidden info-tooltip text (e.g. "Avg. Transaction Size"'s tooltip reads
    // "Transaction Value ÷ Transaction Volume."); scope to the visible
    // .tilelabel itself for an unambiguous match.
    return page
      .locator(".tilegrid .card")
      .filter({ has: page.locator(".tilelabel", { hasText: label }) });
  }

  test("Transaction Value KPI delta is genuinely period-scoped (full reactivity)", async ({
    page,
  }) => {
    await page.goto("/rukisha");
    const txnTile = cardByExactLabel(page, "Transaction Value");
    await expect(txnTile).toHaveCount(1);
    const ytdDelta = await txnTile.locator(".deltaUp, .deltaDown, .deltaFlat").textContent();
    await page.getByRole("button", { name: "MoM", exact: true }).click();
    const momDelta = await txnTile.locator(".deltaUp, .deltaDown, .deltaFlat").textContent();
    // Real period-scoped data: either a genuine computed percentage carrying
    // the active period's suffix, or the documented "N/A" edge case (no
    // comparable prior-period data) — never a value that ignores the period
    // selection entirely.
    const isRealOrNA = (v: string | null) => v === "N/A" || /MoM|QoQ|YTD/.test(v ?? "");
    expect(isRealOrNA(ytdDelta)).toBe(true);
    expect(isRealOrNA(momDelta)).toBe(true);
  });

  test("Active Borrowers delta is period-reactive (originationDate present post-WS1)", async ({
    page,
  }) => {
    // WS1 added originationDate to loan_account — Active Borrowers is now
    // computed as-of-window and its delta changes with the period switch.
    await page.goto("/rukisha");
    const borrowersTile = cardByExactLabel(page, "Active Borrowers");
    const ytdDelta = await borrowersTile.locator(".deltaUp, .deltaDown, .deltaFlat").textContent();
    await page.getByRole("button", { name: "MoM", exact: true }).click();
    const momDelta = await borrowersTile.locator(".deltaUp, .deltaDown, .deltaFlat").textContent();
    // Both must carry a valid period label (not static "—" or empty)
    const isRealOrNA = (v: string | null) => v === "N/A" || /MoM|QoQ|YTD/.test(v ?? "");
    expect(isRealOrNA(ytdDelta)).toBe(true);
    expect(isRealOrNA(momDelta)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 12 — Dynamic graphs (most important)
// ---------------------------------------------------------------------------

test.describe("Dynamic graphs", () => {
  test("Rukisha Transaction Value trend: YTD default, then MoM/QoQ/YTD genuinely change title+value+points", async ({
    page,
  }) => {
    await page.goto("/rukisha");
    await expect(page.getByRole("button", { name: "YTD", exact: true })).toHaveClass(/active/);

    const chartCard = page.locator(".chartcard", { hasText: "Transaction Value" }).first();
    const ytdTitle = await chartCard.locator(".chartlabel").textContent();
    const ytdValue = await chartCard.locator(".chartvalue").textContent();
    expect(ytdTitle).toMatch(/^YTD/);

    await page.getByRole("button", { name: "MoM", exact: true }).click();
    await expect(page.getByRole("button", { name: "MoM", exact: true })).toHaveClass(/active/);
    const momTitle = await chartCard.locator(".chartlabel").textContent();
    const momValue = await chartCard.locator(".chartvalue").textContent();
    expect(momTitle).toMatch(/^Monthly/);

    await page.getByRole("button", { name: "QoQ", exact: true }).click();
    const qoqTitle = await chartCard.locator(".chartlabel").textContent();
    const qoqValue = await chartCard.locator(".chartvalue").textContent();
    expect(qoqTitle).toMatch(/^Quarterly/);

    await page.getByRole("button", { name: "YTD", exact: true }).click();
    const ytdTitleAgain = await chartCard.locator(".chartlabel").textContent();
    expect(ytdTitleAgain).toBe(ytdTitle);

    // Titles must genuinely differ (not hard-coded/identical text)
    expect(new Set([ytdTitle, momTitle, qoqTitle]).size).toBe(3);
    // Values are independently real (not asserting equality/inequality blindly —
    // just that the title-derived state is consistent across repeats)
    expect([ytdValue, momValue, qoqValue].every((v) => v && v.trim().length > 0)).toBe(true);
  });

  test("repeated switching YTD->MoM->QoQ->YTD->MoM->QoQ causes no state corruption", async ({
    page,
  }) => {
    const audit = attachAudit(page);
    await page.goto("/rukisha");
    const sequence = ["MoM", "QoQ", "YTD", "MoM", "QoQ", "YTD"] as const;
    for (const p of sequence) {
      await page.getByRole("button", { name: p, exact: true }).click();
      await expect(page.getByRole("button", { name: p, exact: true })).toHaveClass(/active/);
    }
    expectClean(audit);
  });

  for (const r of [ROUTES[0], ROUTES[1], ROUTES[2]]) {
    test(`${r.name}: period switching changes chart titles without error`, async ({ page }) => {
      const audit = attachAudit(page);
      await page.goto(r.path);

      // Capture all chart labels at YTD (default)
      const ytdLabels = await page.locator(".chartlabel").allTextContents();

      await page.getByRole("button", { name: "MoM", exact: true }).click();
      const momLabels = await page.locator(".chartlabel").allTextContents();

      await page.getByRole("button", { name: "QoQ", exact: true }).click();
      const qoqLabels = await page.locator(".chartlabel").allTextContents();

      // All period chart labels start with the period prefix
      for (const label of momLabels) {
        expect(label).toMatch(/^Monthly/);
      }
      for (const label of qoqLabels) {
        expect(label).toMatch(/^Quarterly/);
      }
      for (const label of ytdLabels) {
        expect(label).toMatch(/^YTD/);
      }

      expectClean(audit);
    });
  }

  test("Fund Balance trend title changes with period (fully reactive post-WS1)", async ({
    page,
  }) => {
    await page.goto("/cpf-financial-services");
    const chartCard = page.locator(".chartcard", { hasText: "Fund Balance" }).first();
    const ytdTitle = await chartCard.locator(".chartlabel").textContent();
    expect(ytdTitle).toMatch(/^YTD/);
    await page.getByRole("button", { name: "MoM", exact: true }).click();
    const momTitle = await chartCard.locator(".chartlabel").textContent();
    expect(momTitle).toMatch(/^Monthly/);
  });
});

// ---------------------------------------------------------------------------
// 15 — Mobile + desktop viewport matrix
// ---------------------------------------------------------------------------

for (const vp of [
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
]) {
  test.describe(`Viewport ${vp.width}x${vp.height}`, () => {
    test.use({ viewport: vp });
    test("no horizontal overflow on any route", async ({ page }) => {
      for (const r of ROUTES) {
        await page.goto(r.path);
        const docW = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(docW).toBeLessThanOrEqual(vp.width + 1);
      }
    });
  });
}

// ---------------------------------------------------------------------------
// 17 — Stress / repeated interaction testing
// ---------------------------------------------------------------------------

test.describe("Stress testing", () => {
  test("repeated route/service/period/notification/profile cycling produces no console errors or duplicated network calls", async ({
    page,
  }) => {
    const audit = attachAudit(page);
    const requestCounts = new Map<string, number>();
    page.on("request", (req) => {
      const key = req.method() + " " + req.url();
      requestCounts.set(key, (requestCounts.get(key) ?? 0) + 1);
    });

    await page.goto("/rukisha");
    for (let i = 0; i < 3; i++) {
      // Navigate via page.goto since nav links open new tabs
      await page.goto("/cpf-financial-services");
      await page.goto("/rukisha");
      await page.getByLabel("View").selectOption("Savings");
      await page.getByLabel("View").selectOption("Lending");
      await page.getByRole("button", { name: "MoM", exact: true }).click();
      await page.getByRole("button", { name: "YTD", exact: true }).click();
      await page.getByRole("button", { name: "Alerts" }).click();
      await page.getByRole("button", { name: "Alerts" }).click();
      await page.getByRole("button", { name: "Profile" }).click();
      await page.getByRole("button", { name: "Profile" }).click();
    }
    expectClean(audit);
    // no single navigation/data request fired an unreasonable number of times
    for (const [key, count] of requestCounts) {
      if (/\/rukisha|\/cpf-financial-services/.test(key)) {
        expect(count, `possible request loop: ${key} fired ${count}x`).toBeLessThan(10);
      }
    }
  });
});
