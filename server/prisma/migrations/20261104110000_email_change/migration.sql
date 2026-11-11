ALTER TYPE "AccountTokenPurpose" ADD VALUE 'CHANGE_EMAIL';

ALTER TABLE "AccountToken"
ADD COLUMN "targetEmail" VARCHAR(254);
