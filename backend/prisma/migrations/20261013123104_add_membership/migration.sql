-- CreateTable
CREATE TABLE "_Membership" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_Membership_A_fkey" FOREIGN KEY ("A") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_Membership_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_Membership_AB_unique" ON "_Membership"("A", "B");

-- CreateIndex
CREATE INDEX "_Membership_B_index" ON "_Membership"("B");
