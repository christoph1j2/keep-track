-- AlterTable
ALTER TABLE "User" ADD COLUMN     "hashedRefreshToken" TEXT,
ADD COLUMN     "resetPasswordToken" TEXT,
ADD COLUMN     "resetPasswordTokenExpiry" TIMESTAMP(3);
