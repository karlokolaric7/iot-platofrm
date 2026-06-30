/**
 * Token Bucket Rate Limiter for Deno / Supabase Edge Functions.
 * Highly efficient in-memory rate limiting with automatic expiry to prevent memory leaks.
 */

interface Bucket {
  tokens: number;
  lastRefill: number;
}

export class RateLimiter {
  private buckets = new Map<string, Bucket>();
  private maxTokens: number;
  private refillRate: number; // tokens per millisecond
  private expiryMs: number;

  /**
   * @param maxTokens Maximum burst capacity of the bucket.
   * @param refillIntervalMs Time window in milliseconds for a full refill.
   */
  constructor(maxTokens: number, refillIntervalMs: number) {
    this.maxTokens = maxTokens;
    this.refillRate = maxTokens / refillIntervalMs;
    this.expiryMs = refillIntervalMs;

    // Run periodic cleanup every 5 minutes to prevent memory leaks
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Attempts to consume a token for a given key.
   * @returns true if allowed, false if rate limited.
   */
  public consume(key: string): { allowed: boolean; remaining: number; resetMs: number } {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = { tokens: this.maxTokens, lastRefill: now };
      this.buckets.set(key, bucket);
    } else {
      // Refill tokens based on elapsed time
      const elapsed = now - bucket.lastRefill;
      const refilled = elapsed * this.refillRate;
      bucket.tokens = Math.min(this.maxTokens, bucket.tokens + refilled);
      bucket.lastRefill = now;
    }

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      const resetMs = Math.max(0, Math.ceil((this.maxTokens - bucket.tokens) / this.refillRate));
      return {
        allowed: true,
        remaining: Math.floor(bucket.tokens),
        resetMs
      };
    }

    const resetMs = Math.max(0, Math.ceil((1 - bucket.tokens) / this.refillRate));
    return {
      allowed: false,
      remaining: 0,
      resetMs
    };
  }

  /**
   * Prunes expired buckets to free up memory.
   */
  private cleanup() {
    const now = Date.now();
    for (const [key, bucket] of this.buckets.entries()) {
      if (now - bucket.lastRefill > this.expiryMs) {
        this.buckets.delete(key);
      }
    }
  }
}

// Global rate limiter instances (persisted in Deno's global context between warm-started requests)
export const ipLimiter = new RateLimiter(100, 60 * 1000);     // 100 requests per minute per IP
export const deviceLimiter = new RateLimiter(10, 60 * 1005); // 10 requests per minute per DevEUI
