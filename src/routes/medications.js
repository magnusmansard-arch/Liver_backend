const express = require("express");
const prisma = require("../db");
const { requireAuth } = require("../middleware/auth");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router({ mergeParams: true }); // mounted at /patients/:patientId/medications
router.use(requireAuth);

// ---- Current medications + full change history for a patient ----
router.get("/", asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const [medications, changes] = await Promise.all([
    prisma.medication.findMany({
      where: { patientId },
      orderBy: { createdAt: "asc" },
      include: { enteredBy: { select: { name: true } } },
    }),
    prisma.medicationChange.findMany({
      where: { patientId },
      orderBy: { date: "asc" },
      include: { enteredBy: { select: { name: true } } },
    }),
  ]);
  res.json({ medications, changes });
}));

// ---- Start a brand-new medication ----
router.post("/", asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { name, dose, frequency, date } = req.body;

  if (!name || !name.trim() || !dose || !dose.trim() || !frequency) {
    return res.status(400).json({ error: "Medication name, dose, and frequency are required." });
  }

  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) return res.status(404).json({ error: "Patient not found." });

  const startDate = date ? new Date(date) : new Date();

  const medication = await prisma.medication.create({
    data: {
      patientId,
      name: name.trim(),
      dose: dose.trim(),
      frequency,
      status: "Active",
      startDate,
      enteredById: req.staffId,
    },
  });

  const change = await prisma.medicationChange.create({
    data: {
      patientId,
      medicationId: medication.id,
      medName: medication.name,
      action: "Started",
      date: startDate,
      dose: medication.dose,
      frequency: medication.frequency,
      enteredById: req.staffId,
    },
  });

  res.status(201).json({ medication, change });
}));

// ---- Log a change to an existing medication: dose/frequency change, stop, or restart ----
router.post("/:medicationId/change", asyncHandler(async (req, res) => {
  const { patientId, medicationId } = req.params;
  const { action, date, dose, frequency, reason } = req.body;

  const validActions = ["Dose/frequency changed", "Stopped", "Restarted"];
  if (!validActions.includes(action)) return res.status(400).json({ error: "Invalid action." });
  if (!date) return res.status(400).json({ error: "Date is required." });

  const medication = await prisma.medication.findFirst({ where: { id: medicationId, patientId } });
  if (!medication) return res.status(404).json({ error: "Medication not found." });

  if (action === "Dose/frequency changed" && (!dose || !frequency)) {
    return res.status(400).json({ error: "New dose and frequency are required." });
  }

  const updates = {};
  if (action === "Dose/frequency changed") {
    updates.dose = dose;
    updates.frequency = frequency;
  } else if (action === "Stopped") {
    updates.status = "Stopped";
  } else if (action === "Restarted") {
    updates.status = "Active";
    if (dose) updates.dose = dose;
    if (frequency) updates.frequency = frequency;
  }

  const updatedMedication = await prisma.medication.update({
    where: { id: medicationId },
    data: updates,
  });

  const change = await prisma.medicationChange.create({
    data: {
      patientId,
      medicationId,
      medName: updatedMedication.name,
      action,
      date: new Date(date),
      dose: updatedMedication.dose,
      frequency: updatedMedication.frequency,
      reason: reason || null,
      enteredById: req.staffId,
    },
  });

  res.status(201).json({ medication: updatedMedication, change });
}));

module.exports = router;
