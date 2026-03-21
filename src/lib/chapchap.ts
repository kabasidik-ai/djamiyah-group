import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

type RateEntry = {
  count: number;
  resetAt: number;
};

const rateStore = new Map<string, RateEntry>();

export const CHAPCHAP_RATE_LIMIT_MAX = 100;
export const CHAPCHAP_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1h

export function sanitizeText(value: string, maxLength = 120): string {
  return value
    .normalize("NFKC")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}

export function checkRateLimit(
  scope: string,
  key: string,
  max = CHAPCHAP_RATE_LIMIT_MAX,
  windowMs = CHAPCHAP_RATE_LIMIT_WINDOW_MS
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const bucketKey = `${scope}:${key}`;
  const existing = rateStore.get(bucketKey);

  if (!existing || now > existing.resetAt) {
    const resetAt = now + windowMs;
    rateStore.set(bucketKey, { count: 1, resetAt });
    return { allowed: true, remaining: max - 1, resetAt };
  }

  existing.count += 1;
  rateStore.set(bucketKey, existing);

  return {
    allowed: existing.count <= max,
    remaining: Math.max(0, max - existing.count),
    resetAt: existing.resetAt,
  };
}

export function verifyChapchapHmac(rawBody: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const normalized = signature.trim().toLowerCase();
  const provided = normalized.startsWith("sha256=")
    ? normalized.replace(/^sha256=/, "")
    : normalized;

  if (!/^[a-f0-9]+$/i.test(provided) || provided.length !== expected.length) {
    return false;
  }

  const expectedBuffer = Buffer.from(expected, "utf8");
  const providedBuffer = Buffer.from(provided, "utf8");
  return timingSafeEqual(expectedBuffer, providedBuffer);
}

export async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  timeoutMs = 30_000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export function ensureSameOrigin(request: Request, siteUrl: string): boolean {
  const allowedOrigin = new URL(siteUrl).origin;
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  if (!origin && !referer) return false;
  if (origin && origin !== allowedOrigin) return false;
  if (referer && !referer.startsWith(allowedOrigin)) return false;
  return true;
}

export function withSecurityHeaders(response: NextResponse, siteUrl: string): NextResponse {
  const origin = new URL(siteUrl).origin;
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://chapchappay.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  );
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, X-CCP-Signature, CCP-Signature, X-Signature");
  if (siteUrl.startsWith("https://")) {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
  return response;
}

export function secureJson(
  payload: unknown,
  siteUrl: string,
  init?: ResponseInit
): NextResponse {
  return withSecurityHeaders(NextResponse.json(payload, init), siteUrl);
}
