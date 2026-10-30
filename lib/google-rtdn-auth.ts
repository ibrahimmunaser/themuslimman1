import { timingSafeEqual } from "crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";

const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function bearerToken(req: Request): string {
  const header = req.headers.get("authorization") ?? "";
  if (!header.toLowerCase().startsWith("bearer ")) return "";
  return header.slice(7).trim();
}

/**
 * Pub/Sub push authentication.
 *
 * Prefer a Google-signed OIDC token (Authorization: Bearer <jwt>) with
 * audience equal to this endpoint URL and no query string. A shared secret
 * is accepted only from the X-Webhook-Secret header or a non-JWT bearer
 * token — never from ?secret=, which lands in access logs and Referer headers.
 */
export async function authorizeGooglePlayPush(
  req: Request,
): Promise<"ok" | "unconfigured" | "unauthorized"> {
  const token = bearerToken(req);
  if (token.split(".").length === 3) {
    try {
      const url = new URL(req.url);
      const audience =
        process.env.GOOGLE_RTDN_OIDC_AUDIENCE || `${url.origin}${url.pathname}`;
      const { payload } = await jwtVerify(token, GOOGLE_JWKS, {
        issuer: ["https://accounts.google.com", "accounts.google.com"],
        audience,
      });
      const verified = payload.email_verified;
      if (verified !== true && verified !== "true") return "unauthorized";
      const expectedEmail = process.env.GOOGLE_RTDN_OIDC_EMAIL;
      if (expectedEmail && payload.email !== expectedEmail) return "unauthorized";
      return "ok";
    } catch (error) {
      console.warn("[google-play-notifications] OIDC token rejected:", error instanceof Error ? error.message : "invalid");
    }
  }

  const secret = process.env.GOOGLE_RTDN_WEBHOOK_SECRET;
  if (!secret) return "unconfigured";

  const headerSecret = req.headers.get("x-webhook-secret") ?? "";
  const bearerSecret = token.split(".").length === 3 ? "" : token;
  const provided = headerSecret || bearerSecret;
  if (provided && timingSafeEqualStr(provided, secret)) return "ok";
  return "unauthorized";
}
