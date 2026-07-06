const express = require("express");
const prisma = require("../db");
const { requireAuth } = require("../middleware/auth");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router({ mergeParams: true }); // mounted at /patients/:patientId/hcc
router.use(requireAuth);

router.post("/", asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { date, afp, modality, findings, lirads, nextDue, notes } = req.body;

  if (!date || typeof afp !== "number" || !modality || !findings || !nextDue) {
    return res.status(400).json({ error: "Date, AFP, modality, findings, and next-due date are required." });
  }

  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) return res.status(404).json({ error: "Patient not found." });

  const entry = await prisma.hccScreening.create({
    data: {
      patientId,
      date: new Date(date),
      afp,
      modality,
      findings,
      lirads: lirads || null,
      nextDue: new Date(nextDue),
      notes: notes || null,
      enteredById: req.staffId,
    },
  });

  res.status(201).json({ entry });
}));

router.get("/", asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const entries = await prisma.hccScreening.findMany({
    where: { patientId },
    orderBy: { date: "asc" },
    include: { enteredBy: { select: { name: true } } },
  });
  res.json({ entries });
}));

module.exports = router;
