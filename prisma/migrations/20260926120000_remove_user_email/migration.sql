-- Discord authentication uses the stable provider account ID and does not
-- request or retain the account's email address.
DROP INDEX "User_email_key";

ALTER TABLE "User"
DROP COLUMN "email",
DROP COLUMN "emailVerified";
