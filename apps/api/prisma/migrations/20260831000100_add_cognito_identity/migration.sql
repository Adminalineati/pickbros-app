ALTER TABLE "users" ADD COLUMN "cognito_sub" TEXT;

CREATE UNIQUE INDEX "users_cognito_sub_key" ON "users"("cognito_sub");
