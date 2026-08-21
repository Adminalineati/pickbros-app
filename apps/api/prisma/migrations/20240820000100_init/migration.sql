-- CreateSchema
CREATE TYPE "WalletCurrency" AS ENUM ('PICKCOINS', 'PICKETS');
CREATE TYPE "LedgerDirection" AS ENUM ('CREDIT', 'DEBIT');
CREATE TYPE "League" AS ENUM ('MLB', 'NBA', 'NFL', 'CHAMPIONS');
CREATE TYPE "EventStatus" AS ENUM ('SCHEDULED', 'LIVE', 'FINAL', 'CANCELED');
CREATE TYPE "PickSelection" AS ENUM ('HOME', 'AWAY');
CREATE TYPE "PickResult" AS ENUM ('PENDING', 'WIN', 'LOSS', 'VOID');
CREATE TYPE "ProductCategory" AS ENUM ('FAN_SHOP', 'REWARDS', 'EXCLUSIVE', 'MERCH');
CREATE TYPE "RedemptionStatus" AS ENUM ('PENDING', 'FULFILLED', 'CANCELED');

CREATE TABLE "ranks" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "min_level" INTEGER NOT NULL,
    CONSTRAINT "ranks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ranks_slug_key" ON "ranks"("slug");

CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "rank_id" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "streak_days" INTEGER NOT NULL DEFAULT 0,
    "last_active_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "pick_coins" INTEGER NOT NULL DEFAULT 0,
    "pickets" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "wallets_user_id_key" ON "wallets"("user_id");

CREATE TABLE "wallet_ledger" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "currency" "WalletCurrency" NOT NULL,
    "direction" "LedgerDirection" NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "ref_type" TEXT,
    "ref_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wallet_ledger_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "wallet_ledger_user_id_created_at_idx" ON "wallet_ledger"("user_id", "created_at");
CREATE INDEX "wallet_ledger_ref_type_ref_id_idx" ON "wallet_ledger"("ref_type", "ref_id");

CREATE TABLE "sport_events" (
    "id" TEXT NOT NULL,
    "league" "League" NOT NULL,
    "home_name" TEXT NOT NULL,
    "home_code" TEXT NOT NULL,
    "away_name" TEXT NOT NULL,
    "away_code" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'SCHEDULED',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "sport_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sport_events_starts_at_idx" ON "sport_events"("starts_at");
CREATE INDEX "sport_events_league_starts_at_idx" ON "sport_events"("league", "starts_at");
CREATE INDEX "sport_events_featured_starts_at_idx" ON "sport_events"("featured", "starts_at");

CREATE TABLE "daily_challenges" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "challenge_date" DATE NOT NULL,
    "prize_pick_coins" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "daily_challenges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "daily_challenges_challenge_date_key" ON "daily_challenges"("challenge_date");

CREATE TABLE "picks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "challenge_id" TEXT,
    "selection" "PickSelection" NOT NULL,
    "result" "PickResult" NOT NULL DEFAULT 'PENDING',
    "points" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "picks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "picks_user_id_event_id_key" ON "picks"("user_id", "event_id");
CREATE INDEX "picks_user_id_created_at_idx" ON "picks"("user_id", "created_at");
CREATE INDEX "picks_event_id_result_idx" ON "picks"("event_id", "result");

CREATE TABLE "missions" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "target" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "missions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "missions_slug_key" ON "missions"("slug");

CREATE TABLE "user_missions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "mission_id" TEXT NOT NULL,
    "period_date" DATE NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMP(3),
    CONSTRAINT "user_missions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_missions_user_id_mission_id_period_date_key" ON "user_missions"("user_id", "mission_id", "period_date");
CREATE INDEX "user_missions_user_id_period_date_idx" ON "user_missions"("user_id", "period_date");

CREATE TABLE "weekly_rankings" (
    "id" TEXT NOT NULL,
    "week_start" DATE NOT NULL,
    "user_id" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    CONSTRAINT "weekly_rankings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "weekly_rankings_week_start_user_id_key" ON "weekly_rankings"("week_start", "user_id");
CREATE INDEX "weekly_rankings_week_start_position_idx" ON "weekly_rankings"("week_start", "position");

CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ProductCategory" NOT NULL,
    "price_pick_coins" INTEGER,
    "price_pickets" INTEGER,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

CREATE TABLE "redemptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "status" "RedemptionStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "redemptions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "redemptions_user_id_created_at_idx" ON "redemptions"("user_id", "created_at");

ALTER TABLE "users" ADD CONSTRAINT "users_rank_id_fkey" FOREIGN KEY ("rank_id") REFERENCES "ranks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wallet_ledger" ADD CONSTRAINT "wallet_ledger_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "daily_challenges" ADD CONSTRAINT "daily_challenges_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "sport_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "picks" ADD CONSTRAINT "picks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "picks" ADD CONSTRAINT "picks_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "sport_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "picks" ADD CONSTRAINT "picks_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "daily_challenges"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "user_missions" ADD CONSTRAINT "user_missions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_missions" ADD CONSTRAINT "user_missions_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "missions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "weekly_rankings" ADD CONSTRAINT "weekly_rankings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
