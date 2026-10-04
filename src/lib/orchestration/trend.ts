import { seededRandom, randomInt } from "../fixtures/random";

/**
 * A plausible ascending 6-point trend (0-100, last point highest), for the
 * sparkline when only a current snapshot is available in fixtures, not true
 * monthly history. Deterministic per seed. Real historical trends will
 * replace this once the Infrastructure/Data layer reads monthly rows from a
 * provisioned Supabase project.
 */
export function syntheticTrend(seed: number): number[] {
  const rand = seededRandom(seed);
  const points: number[] = [];
  let value = randomInt(rand, 55, 70);
  for (let i = 0; i < 6; i++) {
    points.push(Math.min(value, 100));
    value += randomInt(rand, 3, 10);
  }
  points[5] = 100; // the latest point is always the current (highest) value
  return points;
}
