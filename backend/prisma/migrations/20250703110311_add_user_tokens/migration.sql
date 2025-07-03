/*
  Warnings:

  - You are about to drop the column `accessToken` on the `Token` table. All the data in the column will be lost.
  - Added the required column `botAccessToken` to the `Token` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expiresAt` to the `Token` table without a default value. This is not possible if the table is not empty.
  - Added the required column `refreshToken` to the `Token` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userAccessToken` to the `Token` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Token" DROP COLUMN "accessToken",
ADD COLUMN     "botAccessToken" TEXT NOT NULL,
ADD COLUMN     "expiresAt" BIGINT NOT NULL,
ADD COLUMN     "refreshToken" TEXT NOT NULL,
ADD COLUMN     "userAccessToken" TEXT NOT NULL;
