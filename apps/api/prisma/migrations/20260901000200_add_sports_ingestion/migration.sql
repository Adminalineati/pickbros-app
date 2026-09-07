CREATE TABLE "sports_data_providers" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "sports_data_providers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sports_data_providers_slug_key"
ON "sports_data_providers"("slug");

CREATE TABLE "competitions" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "league" "League" NOT NULL,
    "season" TEXT NOT NULL,
    CONSTRAINT "competitions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "competitions_provider_id_external_id_key"
ON "competitions"("provider_id", "external_id");
CREATE INDEX "competitions_league_season_idx"
ON "competitions"("league", "season");

CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short_name" TEXT,
    "logo_url" TEXT,
    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "teams_provider_id_external_id_key"
ON "teams"("provider_id", "external_id");
CREATE INDEX "teams_name_idx" ON "teams"("name");

ALTER TABLE "sport_events"
ADD COLUMN "provider_id" TEXT,
ADD COLUMN "external_id" TEXT,
ADD COLUMN "competition_id" TEXT,
ADD COLUMN "home_team_id" TEXT,
ADD COLUMN "home_score" INTEGER,
ADD COLUMN "away_team_id" TEXT,
ADD COLUMN "away_score" INTEGER,
ADD COLUMN "raw_payload" JSONB,
ADD COLUMN "synced_at" TIMESTAMP(3),
ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "sport_events_provider_id_external_id_key"
ON "sport_events"("provider_id", "external_id");

CREATE TABLE "standings" (
    "id" TEXT NOT NULL,
    "competition_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "played" INTEGER NOT NULL DEFAULT 0,
    "won" INTEGER NOT NULL DEFAULT 0,
    "drawn" INTEGER NOT NULL DEFAULT 0,
    "lost" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "synced_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "standings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "standings_competition_id_team_id_key"
ON "standings"("competition_id", "team_id");
CREATE INDEX "standings_competition_id_position_idx"
ON "standings"("competition_id", "position");

CREATE TABLE "sports_sync_runs" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "cursor" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "error" TEXT,
    CONSTRAINT "sports_sync_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sports_sync_runs_provider_id_resource_started_at_idx"
ON "sports_sync_runs"("provider_id", "resource", "started_at");

ALTER TABLE "competitions"
ADD CONSTRAINT "competitions_provider_id_fkey"
FOREIGN KEY ("provider_id") REFERENCES "sports_data_providers"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "teams"
ADD CONSTRAINT "teams_provider_id_fkey"
FOREIGN KEY ("provider_id") REFERENCES "sports_data_providers"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "sport_events"
ADD CONSTRAINT "sport_events_provider_id_fkey"
FOREIGN KEY ("provider_id") REFERENCES "sports_data_providers"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sport_events"
ADD CONSTRAINT "sport_events_competition_id_fkey"
FOREIGN KEY ("competition_id") REFERENCES "competitions"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sport_events"
ADD CONSTRAINT "sport_events_home_team_id_fkey"
FOREIGN KEY ("home_team_id") REFERENCES "teams"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sport_events"
ADD CONSTRAINT "sport_events_away_team_id_fkey"
FOREIGN KEY ("away_team_id") REFERENCES "teams"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "standings"
ADD CONSTRAINT "standings_competition_id_fkey"
FOREIGN KEY ("competition_id") REFERENCES "competitions"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "standings"
ADD CONSTRAINT "standings_team_id_fkey"
FOREIGN KEY ("team_id") REFERENCES "teams"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sports_sync_runs"
ADD CONSTRAINT "sports_sync_runs_provider_id_fkey"
FOREIGN KEY ("provider_id") REFERENCES "sports_data_providers"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
