
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const MOCK_USER_ID = 'default_user';

export interface TokenRecord {
  accessToken: string;
}

export async function saveTokens(data: TokenRecord) {
  await prisma.token.upsert({
    where: { userId: MOCK_USER_ID },
    update: { accessToken: data.accessToken },
    create: { userId: MOCK_USER_ID, accessToken: data.accessToken },
  });
}

export async function getTokens(): Promise<TokenRecord | null> {
  const tokenFromDb = await prisma.token.findUnique({
    where: { userId: MOCK_USER_ID },
  });


  if (tokenFromDb) {
    return { accessToken: tokenFromDb.accessToken };
  }


  return null;
}

export interface ScheduledMessageRecord { id: string; channelId: string; postAt: number; text: string; }
export async function addScheduledMessage(msg: ScheduledMessageRecord) { await prisma.scheduledMessage.create({ data: msg }); }
export async function getScheduledMessages(): Promise<ScheduledMessageRecord[]> { return await prisma.scheduledMessage.findMany({ orderBy: { postAt: 'asc' } }); }
export async function deleteScheduledMessage(id: string) { await prisma.scheduledMessage.delete({ where: { id: id } }); }