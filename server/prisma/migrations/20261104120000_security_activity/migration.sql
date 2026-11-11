CREATE TYPE "SecurityEventType" AS ENUM (
  'SIGN_IN',
  'PASSWORD_CHANGED',
  'PASSWORD_RESET',
  'EMAIL_CHANGE_REQUESTED',
  'EMAIL_CHANGED',
  'MFA_ENABLED',
  'MFA_DISABLED',
  'RECOVERY_CODES_ROTATED',
  'SESSION_REVOKED',
  'OTHER_SESSIONS_REVOKED'
);

CREATE TABLE "SecurityEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "SecurityEventType" NOT NULL,
  "userAgent" VARCHAR(240),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SecurityEvent_userId_createdAt_idx" ON "SecurityEvent"("userId", "createdAt");

ALTER TABLE "SecurityEvent"
  ADD CONSTRAINT "SecurityEvent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
