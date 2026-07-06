-- CreateEnum
CREATE TYPE "Designation" AS ENUM ('CONSULTANT', 'REGISTRAR', 'PHYSICIAN_ASSISTANT', 'COORDINATOR');

-- CreateEnum
CREATE TYPE "City" AS ENUM ('CHENNAI', 'COIMBATORE');

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "Relation" AS ENUM ('SELF', 'SPOUSE', 'SON', 'DAUGHTER', 'PARENT', 'SIBLING', 'CAREGIVER', 'OTHER');

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designation" "Designation" NOT NULL,
    "city" "City" NOT NULL,
    "pinHash" TEXT NOT NULL,
    "pinIndex" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "sex" "Sex" NOT NULL,
    "town" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientPhone" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "contactName" TEXT,
    "relation" "Relation",

    CONSTRAINT "PatientPhone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeldReading" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "bilirubin" DOUBLE PRECISION NOT NULL,
    "inr" DOUBLE PRECISION NOT NULL,
    "creatinine" DOUBLE PRECISION NOT NULL,
    "sodium" DOUBLE PRECISION,
    "onDialysis" BOOLEAN NOT NULL DEFAULT false,
    "meld" INTEGER NOT NULL,
    "meldNa" INTEGER,
    "enteredById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeldReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildPughReading" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "bilirubin" DOUBLE PRECISION NOT NULL,
    "albumin" DOUBLE PRECISION NOT NULL,
    "inr" DOUBLE PRECISION NOT NULL,
    "ascitesPoints" INTEGER NOT NULL,
    "encephPoints" INTEGER NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "scoreClass" TEXT NOT NULL,
    "enteredById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChildPughReading_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Staff_pinIndex_key" ON "Staff"("pinIndex");

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientPhone" ADD CONSTRAINT "PatientPhone_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeldReading" ADD CONSTRAINT "MeldReading_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeldReading" ADD CONSTRAINT "MeldReading_enteredById_fkey" FOREIGN KEY ("enteredById") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildPughReading" ADD CONSTRAINT "ChildPughReading_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildPughReading" ADD CONSTRAINT "ChildPughReading_enteredById_fkey" FOREIGN KEY ("enteredById") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
