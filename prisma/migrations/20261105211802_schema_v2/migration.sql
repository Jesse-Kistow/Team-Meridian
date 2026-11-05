-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('BADGE_EARNED', 'ORDER_CONFIRMED', 'EVENT_REMINDER', 'GENERAL');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "expiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "organizationName" TEXT;

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "href" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "Order_status_expiresAt_idx" ON "Order"("status", "expiresAt");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
