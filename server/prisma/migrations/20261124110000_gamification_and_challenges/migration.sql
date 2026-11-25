-- AlterTable
ALTER TABLE "User" ADD COLUMN "totalXp" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "XPTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "source" VARCHAR(60) NOT NULL,
    "description" VARCHAR(240) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XPTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyChallenge" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "description" VARCHAR(600) NOT NULL,
    "category" VARCHAR(60) NOT NULL,
    "targetCount" INTEGER NOT NULL DEFAULT 1,
    "type" VARCHAR(40) NOT NULL,
    "xpReward" INTEGER NOT NULL DEFAULT 250,
    "badgeIcon" VARCHAR(60) NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserWeeklyChallengeClaim" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserWeeklyChallengeClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "XPTransaction_userId_createdAt_idx" ON "XPTransaction"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyChallenge_slug_key" ON "WeeklyChallenge"("slug");

-- CreateIndex
CREATE INDEX "WeeklyChallenge_expiresAt_idx" ON "WeeklyChallenge"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserWeeklyChallengeClaim_userId_challengeId_key" ON "UserWeeklyChallengeClaim"("userId", "challengeId");

-- CreateIndex
CREATE INDEX "UserWeeklyChallengeClaim_userId_idx" ON "UserWeeklyChallengeClaim"("userId");

-- AddForeignKey
ALTER TABLE "XPTransaction" ADD CONSTRAINT "XPTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWeeklyChallengeClaim" ADD CONSTRAINT "UserWeeklyChallengeClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWeeklyChallengeClaim" ADD CONSTRAINT "UserWeeklyChallengeClaim_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "WeeklyChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
