// src/db/database.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const MOCK_USER_ID = 'default_user';

// Interface for the full token data structure used in our app
export interface FullTokenRecord {
  botAccessToken: string;
  userAccessToken: string;
  refreshToken: string;
  expiresAt: number; // Stored as a number (milliseconds) in our app logic
}

// Function to save the complete token object to the database
export async function saveTokens(data: FullTokenRecord) {
  await prisma.token.upsert({
    where: { userId: MOCK_USER_ID },
    update: { ...data, expiresAt: BigInt(data.expiresAt) }, // Convert number to BigInt for DB
    create: { userId: MOCK_USER_ID, ...data, expiresAt: BigInt(data.expiresAt) },
  });
}

// Function to retrieve the complete token object from the database
export async function getTokens(): Promise<(FullTokenRecord & { userId: string }) | null> {
  const tokenFromDb = await prisma.token.findUnique({
    where: { userId: MOCK_USER_ID },
  });

  if (!tokenFromDb) {
    return null;
  }

  // Convert the BigInt 'expiresAt' from the DB back to a number for app logic
  return { ...tokenFromDb, expiresAt: Number(tokenFromDb.expiresAt) };
}


// --- Scheduled Message Management (No changes needed for these functions) ---
export interface ScheduledMessageRecord { id: string; channelId: string; postAt: number; text: string; }
export async function addScheduledMessage(msg: ScheduledMessageRecord) { await prisma.scheduledMessage.create({ data: msg }); }
export async function getScheduledMessages(): Promise<ScheduledMessageRecord[]> { return await prisma.scheduledMessage.findMany({ orderBy: { postAt: 'asc' } }); }
export async function deleteScheduledMessage(id: string) { await prisma.scheduledMessage.delete({ where: { id: id } }); }