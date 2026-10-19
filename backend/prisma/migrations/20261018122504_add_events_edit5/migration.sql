/*
  Warnings:

  - Made the column `photoUrl` on table `EventPhoto` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EventPhoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    CONSTRAINT "EventPhoto_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_EventPhoto" ("caption", "eventId", "id", "photoUrl") SELECT "caption", "eventId", "id", "photoUrl" FROM "EventPhoto";
DROP TABLE "EventPhoto";
ALTER TABLE "new_EventPhoto" RENAME TO "EventPhoto";
CREATE INDEX "EventPhoto_eventId_idx" ON "EventPhoto"("eventId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
