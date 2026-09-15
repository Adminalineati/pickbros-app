CREATE TYPE "PickMarket" AS ENUM ('MONEYLINE', 'EXACT_SCORE', 'TOTAL');

CREATE TYPE "PickMarketPosition" AS ENUM ('FAVORITO', 'UNDERDOG', 'EVEN');

ALTER TYPE "PickSelection" ADD VALUE 'DRAW';
ALTER TYPE "PickSelection" ADD VALUE 'OVER';
ALTER TYPE "PickSelection" ADD VALUE 'UNDER';

ALTER TABLE "picks"
ADD COLUMN "market" "PickMarket" NOT NULL DEFAULT 'MONEYLINE',
ADD COLUMN "stake_pick_coins" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN "home_score" INTEGER,
ADD COLUMN "away_score" INTEGER,
ADD COLUMN "total_line" DOUBLE PRECISION,
ADD COLUMN "odds_american" INTEGER,
ADD COLUMN "implied_probability" DOUBLE PRECISION,
ADD COLUMN "market_position" "PickMarketPosition",
ADD COLUMN "odds_snapshot" JSONB,
ADD COLUMN "locked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "picks" ALTER COLUMN "locked_at" DROP DEFAULT;

CREATE UNIQUE INDEX "wallet_ledger_activation_grant"
ON "wallet_ledger" ("user_id")
WHERE "reason" = 'ACCOUNT_ACTIVATION' AND "currency" = 'PICKCOINS';
