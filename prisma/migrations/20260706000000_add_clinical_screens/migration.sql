-- Add Marketing Executive as a valid staff designation (Screen 2)
ALTER TYPE "Designation" ADD VALUE 'MARKETING_EXECUTIVE';

-- Add referral/origin fields to Patient (Screen 6)
ALTER TABLE "Patient" ADD COLUMN "referralSource" TEXT;
ALTER TABLE "Patient" ADD COLUMN "referringDoctor" TEXT;

-- CreateTable: Endoscopy findings (Screen 14)
CREATE TABLE "EndoscopyFinding" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "varices" TEXT NOT NULL,
    "redSigns" TEXT,
    "gastricVarices" TEXT NOT NULL,
    "phg" TEXT NOT NULL,
    "intervention" TEXT,
    "notes" TEXT,
    "enteredById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EndoscopyFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Etiology (Screen 10)
CREATE TABLE "Etiology" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "etiology" TEXT NOT NULL,
    "supportInfo" JSONB,
    "notes" TEXT,
    "enteredById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Etiology_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Disease status (Screen 11)
CREATE TABLE "DiseaseStatusEntry" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "events" JSONB,
    "eventDetails" JSONB,
    "onsetDate" TIMESTAMP(3),
    "enteredById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiseaseStatusEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable: DDLT registration (Screen 12)
CREATE TABLE "DdltRegistration" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "registered" TEXT NOT NULL,
    "center" TEXT,
    "waitlistNumber" TEXT,
    "enteredById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DdltRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Patient status (Screen 17)
CREATE TABLE "PatientStatusEntry" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "details" JSONB,
    "notes" TEXT,
    "enteredById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientStatusEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Medications, current list (Screen 19)
CREATE TABLE "Medication" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dose" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "startDate" TIMESTAMP(3) NOT NULL,
    "enteredById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Medication_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Medication change log (Screen 19)
CREATE TABLE "MedicationChange" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "medicationId" TEXT,
    "medName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dose" TEXT,
    "frequency" TEXT,
    "reason" TEXT,
    "enteredById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicationChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable: HCC surveillance (Screen 20)
CREATE TABLE "HccScreening" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "afp" DOUBLE PRECISION NOT NULL,
    "modality" TEXT NOT NULL,
    "findings" TEXT NOT NULL,
    "lirads" TEXT,
    "nextDue" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "enteredById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HccScreening_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EndoscopyFinding" ADD CONSTRAINT "EndoscopyFinding_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EndoscopyFinding" ADD CONSTRAINT "EndoscopyFinding_enteredById_fkey" FOREIGN KEY ("enteredById") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Etiology" ADD CONSTRAINT "Etiology_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Etiology" ADD CONSTRAINT "Etiology_enteredById_fkey" FOREIGN KEY ("enteredById") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiseaseStatusEntry" ADD CONSTRAINT "DiseaseStatusEntry_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiseaseStatusEntry" ADD CONSTRAINT "DiseaseStatusEntry_enteredById_fkey" FOREIGN KEY ("enteredById") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DdltRegistration" ADD CONSTRAINT "DdltRegistration_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DdltRegistration" ADD CONSTRAINT "DdltRegistration_enteredById_fkey" FOREIGN KEY ("enteredById") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientStatusEntry" ADD CONSTRAINT "PatientStatusEntry_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PatientStatusEntry" ADD CONSTRAINT "PatientStatusEntry_enteredById_fkey" FOREIGN KEY ("enteredById") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medication" ADD CONSTRAINT "Medication_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Medication" ADD CONSTRAINT "Medication_enteredById_fkey" FOREIGN KEY ("enteredById") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationChange" ADD CONSTRAINT "MedicationChange_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MedicationChange" ADD CONSTRAINT "MedicationChange_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MedicationChange" ADD CONSTRAINT "MedicationChange_enteredById_fkey" FOREIGN KEY ("enteredById") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HccScreening" ADD CONSTRAINT "HccScreening_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HccScreening" ADD CONSTRAINT "HccScreening_enteredById_fkey" FOREIGN KEY ("enteredById") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
