/*
  Warnings:

  - Added the required column `meetLink` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `problem` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "meetLink" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "prescription" TEXT,
ADD COLUMN     "problem" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN     "calendarId" TEXT;
