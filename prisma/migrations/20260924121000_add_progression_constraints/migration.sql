-- Progression integrity constraints that Prisma schema syntax cannot express.
ALTER TABLE "UnlimitedAttempt"
ADD CONSTRAINT "UnlimitedAttempt_totalScore_check"
CHECK ("totalScore" BETWEEN 0 AND 25000);

ALTER TABLE "UnlimitedRoundGuess"
ADD CONSTRAINT "UnlimitedRoundGuess_roundNumber_check"
CHECK ("roundNumber" BETWEEN 1 AND 5),
ADD CONSTRAINT "UnlimitedRoundGuess_distance_check"
CHECK ("distance" >= 0),
ADD CONSTRAINT "UnlimitedRoundGuess_score_check"
CHECK ("score" BETWEEN 0 AND 5000);

ALTER TABLE "XPTransaction"
ADD CONSTRAINT "XPTransaction_amount_check"
CHECK ("amount" > 0);

-- Stable identifiers only. Names, descriptions, and rewards live in the domain catalog.
INSERT INTO "Achievement" ("id") VALUES
  ('FIRST_STEPS'),
  ('DAILY_INITIATE'),
  ('BULLSEYE'),
  ('KEEN_EYE'),
  ('SCHOLAR_OF_THE_ERA'),
  ('TENURE'),
  ('TWENTY_FIVE_K');
