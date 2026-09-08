ALTER TYPE "SubscriptionPlan" RENAME TO "SubscriptionPlan_old";

CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'PREMIUM');

ALTER TABLE "users" ALTER COLUMN "subscription_plan" DROP DEFAULT;

ALTER TABLE "users"
ALTER COLUMN "subscription_plan" TYPE "SubscriptionPlan"
USING (
  CASE
    WHEN "subscription_plan"::text IN ('SUBS2', 'PREMIUM') THEN 'PREMIUM'::"SubscriptionPlan"
    ELSE 'FREE'::"SubscriptionPlan"
  END
);

ALTER TABLE "users" ALTER COLUMN "subscription_plan" SET DEFAULT 'FREE';

DROP TYPE "SubscriptionPlan_old";
