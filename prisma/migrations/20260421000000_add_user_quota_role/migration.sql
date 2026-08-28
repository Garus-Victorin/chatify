-- AlterTable: add role and quota fields to User
ALTER TABLE "User"
  ADD COLUMN "role"          TEXT      NOT NULL DEFAULT 'user',
  ADD COLUMN "dailyMessages" INTEGER   NOT NULL DEFAULT 0,
  ADD COLUMN "dailySearches" INTEGER   NOT NULL DEFAULT 0,
  ADD COLUMN "dailyReset"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
