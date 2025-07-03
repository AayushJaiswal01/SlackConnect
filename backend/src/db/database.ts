// src/db/database.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const MOCK_USER_ID = 'default_user';

// This interface now only holds the user's token data
export interface UserTokenRecord {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export async function saveTokens(data: UserTokenRecord) {
  await prisma.token.upsert({
    where: { userId: MOCK_USER_ID },
    update: { ...data, expiresAt: BigInt(data.expiresAt) },
    create: { userId: MOCK_USER_ID, ...data, expiresAt: BigInt(data.expiresAt) },
  });
}

export async function getTokens(): Promise<(UserTokenRecord & { userId: string }) | null> {
  const token = await prisma.token.findUnique({
    where: { userId: MOCK_USER_ID },
  });
  if (!token) return null;
  return { ...token, expiresAt: Number(token.expiresAt) };
}

// ... ScheduledMessage functions remain exactly the same
export interface ScheduledMessageRecord { id: string; channelId: string; postAt: number; text: string; }
export async function addScheduledMessage(msg: ScheduledMessageRecord) { await prisma.scheduledMessage.create({ data: msg }); }
export async function getScheduledMessages(): Promise<ScheduledMessageRecord[]> { return await prisma.scheduledMessage.findMany({ orderBy: { postAt: 'asc' } }); }
export async function deleteScheduledMessage(id: string) { await prisma.scheduledMessage.delete({ where: { id: id } }); }