CREATE TYPE "AccountStatus" AS ENUM (
  'PENDING_VERIFICATION',
  'ACTIVE',
  'SUSPENDED'
);

ALTER TABLE "users"
ADD COLUMN "first_name" TEXT,
ADD COLUMN "last_name" TEXT,
ADD COLUMN "date_of_birth" DATE,
ADD COLUMN "phone_number" TEXT,
ADD COLUMN "country" TEXT,
ADD COLUMN "state_region" TEXT,
ADD COLUMN "account_status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "email_verified_at" TIMESTAMP(3),
ADD COLUMN "phone_verified_at" TIMESTAMP(3),
ADD COLUMN "verification_hash" TEXT,
ADD COLUMN "verification_ends" TIMESTAMP(3),
ADD COLUMN "password_reset_hash" TEXT,
ADD COLUMN "password_reset_ends" TIMESTAMP(3),
ADD COLUMN "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "locked_until" TIMESTAMP(3);

UPDATE "users"
SET
  "first_name" = "display_name",
  "email_verified_at" = CURRENT_TIMESTAMP;

ALTER TABLE "users"
ALTER COLUMN "account_status" SET DEFAULT 'PENDING_VERIFICATION';

CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");
CREATE INDEX "users_account_status_idx" ON "users"("account_status");
CREATE INDEX "users_locked_until_idx" ON "users"("locked_until");
