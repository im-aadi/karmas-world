-- CreateTable
CREATE TABLE "Lab" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "description" VARCHAR(1000) NOT NULL,
    "categorySlug" VARCHAR(60) NOT NULL,
    "difficulty" "DifficultyLevel" NOT NULL DEFAULT 'BEGINNER',
    "duration" VARCHAR(40) NOT NULL,
    "xpReward" INTEGER NOT NULL DEFAULT 150,
    "type" VARCHAR(40) NOT NULL,
    "instructions" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabTask" (
    "id" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "instruction" TEXT NOT NULL,
    "hint" VARCHAR(500) NOT NULL,
    "flagHash" VARCHAR(64) NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 50,

    CONSTRAINT "LabTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "completedTasks" JSONB NOT NULL DEFAULT '[]',
    "xpAwarded" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "LabAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lab_slug_key" ON "Lab"("slug");

-- CreateIndex
CREATE INDEX "Lab_categorySlug_idx" ON "Lab"("categorySlug");

-- CreateIndex
CREATE INDEX "Lab_slug_idx" ON "Lab"("slug");

-- CreateIndex
CREATE INDEX "LabTask_labId_orderIndex_idx" ON "LabTask"("labId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "LabAttempt_userId_labId_key" ON "LabAttempt"("userId", "labId");

-- CreateIndex
CREATE INDEX "LabAttempt_userId_status_idx" ON "LabAttempt"("userId", "status");

-- AddForeignKey
ALTER TABLE "LabTask" ADD CONSTRAINT "LabTask_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabAttempt" ADD CONSTRAINT "LabAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabAttempt" ADD CONSTRAINT "LabAttempt_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE CASCADE ON UPDATE CASCADE;
