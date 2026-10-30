// Simple in-memory fixed-window limiter. Good enough for a single Railway instance;
// counters reset on redeploy.

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export type RateLimitResult = { allowed: boolean; retryAfterSec: number };

export function rateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count++;
  return {
    allowed: bucket.count <= max,
    retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000),
  };
}

export function resetRateLimit(key: string) {
  buckets.delete(key);
}
