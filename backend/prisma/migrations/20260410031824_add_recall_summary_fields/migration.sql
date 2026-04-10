-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('UPCOMING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "recallBotId" TEXT,
ADD COLUMN     "status" "BookingStatus" NOT NULL DEFAULT 'UPCOMING',
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "transcript" TEXT;
