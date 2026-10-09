/**
 * Phase 6 Section A — group.ts unit tests (U-41 through U-44).
 */
import { describe, test, expect } from "vitest";
import {
  calculateTotalActiveClients,
  getLatestPensionLinkSummary,
  calculateHeadlineAum,
} from "@/lib/calculations/group";
import { linkSummary } from "./fixtures";

describe("group.ts calculations", () => {
  test("U-41: calculateTotalActiveClients — simple sum, NOT deduplicated (ADR-0002)", () => {
    const snapshots = [
      { headlineAum: 0, activeClients: 1000 },
      { headlineAum: 0, activeClients: 2000 },
      { headlineAum: 0, activeClients: 500 },
    ];
    expect(calculateTotalActiveClients(snapshots)).toBe(3500);
  });

  test("U-42: getLatestPensionLinkSummary — empty rows returns null", () => {
    expect(getLatestPensionLinkSummary([])).toBeNull();
  });

  test("U-43: getLatestPensionLinkSummary — multiple rows returns latest (sorted desc)", () => {
    const rows = [
      linkSummary({ period: "2026-04", linkedSaversCount: 100 }),
      linkSummary({ period: "2026-06", linkedSaversCount: 300 }),
      linkSummary({ period: "2026-05", linkedSaversCount: 200 }),
    ];
    expect(getLatestPensionLinkSummary(rows)?.linkedSaversCount).toBe(300);
  });

  test("U-44: calculateHeadlineAum — empty components returns 0", () => {
    expect(calculateHeadlineAum([])).toBe(0);
  });
});
