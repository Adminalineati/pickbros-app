CREATE TYPE "SubscriptionPlan" AS ENUM ('SUBS1', 'SUBS2');

ALTER TABLE "users"
ADD COLUMN "password_hash" TEXT,
ADD COLUMN "subscription_plan" "SubscriptionPlan" NOT NULL DEFAULT 'SUBS1',
ALTER COLUMN "rank_id" DROP NOT NULL;
