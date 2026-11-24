// In-memory limiter: fine for a single instance. Swap for Redis when scaling horizontally.
const hits = new Map<string, number[]>();
export function rateLimit(key: string, max = 20, windowMs = 60_000) {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  arr.push(now); hits.set(key, arr);
  return arr.length <= max;
}
