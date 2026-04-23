-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('PLAY', 'BOOK', 'TRAIN');

-- AlterTable
ALTER TABLE "Facility" ADD COLUMN     "propertyTypes" "PropertyType"[];
