/**
 * Phase 1 stub kernel module.
 * Exists ONLY as a Vitest target to verify BOOT-03 (test pipeline works).
 * Phase 2 replaces this with the real Interval / monzo / scale primitives.
 */
export function add(a: number, b: number): number {
  return a + b;
}
