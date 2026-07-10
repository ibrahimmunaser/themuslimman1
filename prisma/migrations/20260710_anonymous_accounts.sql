-- Apple Guideline 5.1.1(v): purchases must not require registration with
-- personal info. Adds a flag so a device-linked "guest" User row can be
-- created silently (no email/password) at the moment of purchase, and later
-- optionally upgraded to a real account without losing purchase history.
ALTER TABLE "User" ADD COLUMN "isAnonymous" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "User_isAnonymous_idx" ON "User"("isAnonymous");
