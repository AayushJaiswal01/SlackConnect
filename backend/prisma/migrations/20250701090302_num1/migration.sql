-- CreateTable
CREATE TABLE "Token" (
    "userId" TEXT NOT NULL DEFAULT 'default_user',
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" BIGINT NOT NULL,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "ScheduledMessage" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "postAt" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "ScheduledMessage_pkey" PRIMARY KEY ("id")
);
