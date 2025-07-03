/*
  Warnings:

  - Added the required column `expiresAt` to the `Token` table without a default value. This is not possible if the table is not empty.
  - Added the required column `refreshToken` to the `Token` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Token" ADD COLUMN     "expiresAt" BIGINT NOT NULL,
ADD COLUMN     "refreshToken" TEXT NOT NULL;
