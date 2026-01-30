-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE';
