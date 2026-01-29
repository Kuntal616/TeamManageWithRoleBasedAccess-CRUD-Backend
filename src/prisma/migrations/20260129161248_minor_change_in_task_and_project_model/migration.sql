/*
  Warnings:

  - You are about to drop the column `asigneeId` on the `tasks` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name,teamId]` on the table `projects` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_asigneeId_fkey";

-- DropIndex
DROP INDEX "tasks_asigneeId_idx";

-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "asigneeId",
ADD COLUMN     "assigneeId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "projects_name_teamId_key" ON "projects"("name", "teamId");

-- CreateIndex
CREATE INDEX "tasks_assigneeId_idx" ON "tasks"("assigneeId");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
