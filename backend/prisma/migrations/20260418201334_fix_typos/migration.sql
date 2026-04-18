/*
  Warnings:

  - You are about to drop the column `bannner` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `subscrberCount` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `usename` on the `User` table. All the data in the column will be lost.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "bannner",
DROP COLUMN "subscrberCount",
DROP COLUMN "usename",
ADD COLUMN     "banner" TEXT,
ADD COLUMN     "subscriberCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "username" TEXT NOT NULL;
