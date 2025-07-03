import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const MOCK_USER_ID = 'default_user';

export interface ExpiringTokenRecord {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export async function saveTokens(data: ExpiringTokenRecord) {
  await prisma.token.upsert({
    where: { userId: MOCK_USER_ID },
    update: { ...data, expiresAt: BigInt(data.expiresAt) },
    create: { userId: MOCK_USER_ID, ...data, expiresAt: BigInt(data.expiresAt) },
  });
}

export async function getTokens(): Promise<(ExpiringTokenRecord & { userId: string }) | null> {
  const tokenFromDb = await prisma.token.findUnique({
    where: { userId: MOCK_USER_ID },
  });

  if (!tokenFromDb) return null;

  return { ...tokenFromDb, expiresAt: Number(tokenFromDb.expiresAt) };
}

// --- Scheduled Message functions are unchanged ---
export interface ScheduledMessageRecord { id: string; channelId: string; postAt: number; text: string; }
export async function addScheduledMessage(msg: ScheduledMessageRecord) { await prisma.scheduledMessage.create({ data: msg }); }
export async function getScheduledMessages(): Promise<ScheduledMessageRecord[]> { return await prisma.scheduledMessage.findMany({ orderBy: { postAt: 'asc' } }); }
export async function deleteScheduledMessage(id: string) { await prisma.scheduledMessage.delete({ where: { id: id } }); }