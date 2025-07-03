/*
  Warnings:

  - You are about to drop the column `botAccessToken` on the `Token` table. All the data in the column will be lost.
  - You are about to drop the column `userAccessToken` on the `Token` table. All the data in the column will be lost.
  - Added the required column `accessToken` to the `Token` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Token" DROP COLUMN "botAccessToken",
DROP COLUMN "userAccessToken",
ADD COLUMN     "accessToken" TEXT NOT NULL;
