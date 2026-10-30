import { afterEach, describe, expect, it } from "vitest";
import { authorizeGooglePlayPush } from "@/lib/google-rtdn-auth";

const SECRET = "test-webhook-secret-value";

afterEach(() => {
  delete process.env.GOOGLE_RTDN_WEBHOOK_SECRET;
});

describe("authorizeGooglePlayPush", () => {
  it("rejects the shared secret when it is only in the query string", async () => {
    process.env.GOOGLE_RTDN_WEBHOOK_SECRET = SECRET;
    const req = new Request(
      `https://themuslimman.com/api/webhooks/google-play-notifications?secret=${SECRET}`,
    );
    expect(await authorizeGooglePlayPush(req)).toBe("unauthorized");
  });

  it("accepts the shared secret from the X-Webhook-Secret header", async () => {
    process.env.GOOGLE_RTDN_WEBHOOK_SECRET = SECRET;
    const req = new Request("https://themuslimman.com/api/webhooks/google-play-notifications", {
      headers: { "x-webhook-secret": SECRET },
    });
    expect(await authorizeGooglePlayPush(req)).toBe("ok");
  });

  it("fails closed when no secret is configured and no OIDC token is sent", async () => {
    const req = new Request("https://themuslimman.com/api/webhooks/google-play-notifications");
    expect(await authorizeGooglePlayPush(req)).toBe("unconfigured");
  });
});
