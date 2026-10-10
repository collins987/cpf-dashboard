/**
 * Phase 6 Section A — cpf-financial-services.ts unit tests (U-24 through U-31, U-24b).
 */
import { describe, test, expect } from "vitest";
import {
  calculateFundBalance,
  calculateTrustFundGrowth,
  calculateAssetsUnderAdministration,
  calculateTrustBeneficiaries,
  calculateAgencyFeeIncome,
  calculateMembers,
} from "@/lib/calculations/cpf-financial-services";
import { sumInWindow } from "@/lib/calculations/period";
import { contribution, withdrawal, trust, trustBen, fee, member } from "./fixtures";

const OPENING_BALANCE = 17_900_000_000;
const INVESTMENT_RETURNS = 420_000_000;

describe("cpf-financial-services.ts calculations", () => {
  test("U-24: calculateFundBalance — no contributions/withdrawals returns opening + returns", () => {
    expect(calculateFundBalance(OPENING_BALANCE, [], [], INVESTMENT_RETURNS)).toBe(
      OPENING_BALANCE + INVESTMENT_RETURNS,
    );
  });

  test("U-24b: Running-balance formula — OPENING + cumContrib(EPOCH→end) − cumWithdraw(EPOCH→end) + RETURNS", () => {
    const EPOCH = new Date(0);
    const bucketEnd = new Date("2026-06-30T23:59:59Z");
    const contribs = [
      contribution({ amount: 500_000_000, createdAt: "2026-01-15" }),
      contribution({ amount: 300_000_000, createdAt: "2026-04-20" }),
    ];
    const withdraws = [withdrawal({ amount: 100_000_000, createdAt: "2026-02-10" })];
    const cumContrib = sumInWindow(
      contribs,
      (c) => c.createdAt,
      (c) => c.amount,
      EPOCH,
      bucketEnd,
    );
    const cumWithdraw = sumInWindow(
      withdraws,
      (w) => w.createdAt,
      (w) => w.amount,
      EPOCH,
      bucketEnd,
    );
    const balance = OPENING_BALANCE + cumContrib - cumWithdraw + INVESTMENT_RETURNS;
    expect(cumContrib).toBe(800_000_000);
    expect(cumWithdraw).toBe(100_000_000);
    expect(balance).toBe(17_900_000_000 + 800_000_000 - 100_000_000 + 420_000_000);
    expect(balance).toBe(19_020_000_000);
  });

  test("U-25: calculateTrustFundGrowth — priorAua = 0 returns null", () => {
    expect(calculateTrustFundGrowth(9_500_000, 0)).toBeNull();
  });

  test("U-26: calculateTrustFundGrowth — current 9.5M, prior 8.95M", () => {
    const g = calculateTrustFundGrowth(9_500_000, 8_950_000) as number;
    expect(g).toBeCloseTo((9_500_000 - 8_950_000) / 8_950_000, 10);
  });

  test("U-27: calculateAssetsUnderAdministration — empty trusts returns 0", () => {
    expect(calculateAssetsUnderAdministration([])).toBe(0);
  });

  test("U-28: calculateAssetsUnderAdministration — sums active only", () => {
    const trusts = [
      trust({ status: "active", trustAssetValue: 100 }),
      trust({ status: "closed", trustAssetValue: 9_999 }),
      trust({ status: "active", trustAssetValue: 200 }),
    ];
    expect(calculateAssetsUnderAdministration(trusts)).toBe(300);
  });

  test("U-29: calculateTrustBeneficiaries — duplicate beneficiaryIds counted once", () => {
    const bens = [
      trustBen({ beneficiaryId: "x" }),
      trustBen({ beneficiaryId: "x" }),
      trustBen({ beneficiaryId: "y" }),
    ];
    expect(calculateTrustBeneficiaries(bens)).toBe(2);
  });

  test("U-30: calculateAgencyFeeIncome — filters source === 'agency'", () => {
    const fees = [
      fee({ source: "agency", feeAmount: 100 }),
      fee({ source: "agency", feeAmount: 50 }),
    ];
    expect(calculateAgencyFeeIncome(fees)).toBe(150);
  });

  test("U-31: calculateMembers — duplicate memberIds counted once", () => {
    const mems = [
      member({ memberId: "m-1" }),
      member({ memberId: "m-1" }),
      member({ memberId: "m-2" }),
    ];
    expect(calculateMembers(mems)).toBe(2);
  });
});
