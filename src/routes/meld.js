const express = require("express");
const prisma = require("../db");
const { requireAuth } = require("../middleware/auth");
const { calculateMeld } = require("../utils/scoring");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router({ mergeParams: true }); // mounted at /patients/:patientId/meld
router.use(requireAuth);

// ---- Screen 7: add a dated MELD reading ----
router.post("/", asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { date, bilirubin, inr, creatinine, sodium, onDialysis } = req.body;

  if (!date) return res.status(400).json({ error: "Date is required." });
  if (typeof bilirubin !== "number" || typeof inr !== "number" || typeof creatinine !== "number") {
    return res.status(400).json({ error: "Bilirubin, INR, and creatinine are required." });
  }

  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) return res.status(404).json({ error: "Patient not found." });

  const { meld, meldNa } = calculateMeld({
    bilirubin,
    inr,
    creatinine,
    sodium: typeof sodium === "number" ? sodium : null,
    onDialysis: !!onDialysis,
  });

  const reading = await prisma.meldReading.create({
    data: {
      patientId,
      date: new Date(date),
      bilirubin,
      inr,
      creatinine,
      sodium: typeof sodium === "number" ? sodium : null,
      onDialysis: !!onDialysis,
      meld,
      meldNa,
      enteredById: req.staffId,
    },
  });

  res.status(201).json({ reading });
}));

// ---- History for this patient, sorted by date (for the trend sparkline) ----
router.get("/", asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const readings = await prisma.meldReading.findMany({
    where: { patientId },
    orderBy: { date: "asc" },
    include: { enteredBy: { select: { name: true } } },
  });
  res.json({ readings });
}));

router.delete("/:readingId", asyncHandler(async (req, res) => {
  await prisma.meldReading.delete({ where: { id: req.params.readingId } });
  res.status(204).send();
}));

module.exports = router;
