CREATE TYPE "SecurityUpdateType" AS ENUM ('LEARNING_GUIDE', 'RESEARCH_UPDATE', 'SECURITY_ADVISORY');
CREATE TYPE "SecurityUpdateStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

CREATE TABLE "SecurityUpdate" (
    "id" TEXT NOT NULL,
    "source" VARCHAR(20) NOT NULL,
    "type" "SecurityUpdateType" NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "sourceUrl" VARCHAR(2048) NOT NULL,
    "sourcePublishedAt" TIMESTAMP(3) NOT NULL,
    "summary" VARCHAR(600) NOT NULL,
    "takeaway" VARCHAR(360) NOT NULL,
    "status" "SecurityUpdateStatus" NOT NULL DEFAULT 'DRAFT',
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorId" TEXT,
    "editorId" TEXT,
    CONSTRAINT "SecurityUpdate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SecurityUpdate_status_sourcePublishedAt_idx" ON "SecurityUpdate"("status", "sourcePublishedAt");
ALTER TABLE "SecurityUpdate" ADD CONSTRAINT "SecurityUpdate_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SecurityUpdate" ADD CONSTRAINT "SecurityUpdate_editorId_fkey" FOREIGN KEY ("editorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "SecurityUpdate" ("id", "source", "type", "title", "sourceUrl", "sourcePublishedAt", "summary", "takeaway", "status", "verifiedAt", "createdAt", "updatedAt") VALUES
('solopreneur-guide', 'NIST', 'LEARNING_GUIDE', 'A practical cybersecurity guide for solo business owners', 'https://www.nist.gov/news-events/news/2026/11/self-employed-solopreneur-nist-has-cybersecurity-guide-just-you', '2026-11-02T00:00:00.000Z', 'NIST published a plain-language guide to help people running one-person businesses choose and prioritize security actions.', 'Good entry point for learning how backups, updates, and basic risk planning fit into everyday work.', 'PUBLISHED', '2026-11-03T12:00:00.000Z', '2026-11-03T12:00:00.000Z', '2026-11-03T12:00:00.000Z'),
('goahead-advisory', 'CERT-In', 'SECURITY_ADVISORY', 'Multiple vulnerabilities in GoAhead Web Server', 'https://cert-in.org.in/s2cMainServlet?VLCODE=CIAD-2026-0057&pageid=PUBVLNOTES02', '2026-10-28T00:00:00.000Z', 'CERT-In advisory CIAD-2026-0057 describes risks affecting specified GoAhead builds used in some embedded and device-management products.', 'For real systems, check the affected build and vendor guidance in the advisory before deciding what action applies.', 'PUBLISHED', '2026-11-03T12:00:00.000Z', '2026-11-03T12:00:00.000Z', '2026-11-03T12:00:00.000Z'),
('pqc-transition', 'NIST', 'RESEARCH_UPDATE', 'A roadmap for moving to post-quantum cryptography', 'https://www.nist.gov/news-events/news/2026/10/nist-report-provides-guidelines-transition-post-quantum-cryptography', '2026-10-27T00:00:00.000Z', 'NISTIR 8547 outlines a transition from quantum-vulnerable algorithms toward post-quantum cryptography standards.', 'A useful example of long-term security planning: identify dependencies first, then migrate carefully over time.', 'PUBLISHED', '2026-11-03T12:00:00.000Z', '2026-11-03T12:00:00.000Z', '2026-11-03T12:00:00.000Z');
