-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('MARITIME', 'AERIEN', 'TERRESTRE', 'MULTIMODAL', 'DEDOUANEMENT');

-- CreateEnum
CREATE TYPE "OperationType" AS ENUM ('IMPORT', 'EXPORT', 'TRANSIT');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'QUOTED', 'REJECTED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "QuoteRequest" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "companyName" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "whatsapp" TEXT,
    "serviceType" "ServiceType" NOT NULL,
    "operationType" "OperationType" NOT NULL,
    "originCountry" TEXT NOT NULL,
    "originCity" TEXT NOT NULL,
    "destCountry" TEXT NOT NULL,
    "destCity" TEXT NOT NULL,
    "cargoNature" TEXT NOT NULL,
    "cargoDescription" TEXT,
    "weightKg" DOUBLE PRECISION,
    "volumeCbm" DOUBLE PRECISION,
    "packageCount" INTEGER,
    "containerNumber" TEXT,
    "targetDate" TIMESTAMP(3),
    "isUrgent" BOOLEAN NOT NULL DEFAULT false,
    "additionalNotes" TEXT,
    "consentAt" TIMESTAMP(3) NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteCounter" (
    "year" INTEGER NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QuoteCounter_pkey" PRIMARY KEY ("year")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuoteRequest_reference_key" ON "QuoteRequest"("reference");

-- CreateIndex
CREATE INDEX "QuoteRequest_status_idx" ON "QuoteRequest"("status");

-- CreateIndex
CREATE INDEX "QuoteRequest_createdAt_idx" ON "QuoteRequest"("createdAt");
