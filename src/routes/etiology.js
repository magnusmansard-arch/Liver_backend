const express = require("express");
const prisma = require("../db");
const { requireAuth } = require("../middleware/auth");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router({ mergeParams: true }); // mounted at /patients/:patientId/etiology
router.use(requireAuth);

router.post("/", asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { etiology, supportInfo, notes } = req.body;

  if (!etiology || !etiology.trim()) return res.status(400).json({ error: "Etiology is required." });

  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) return res.status(404).json({ error: "Patient not found." });

  const entry = await prisma.etiology.create({
    data: {
      patientId,
      etiology: etiology.trim(),
      supportInfo: supportInfo || null,
      notes: notes || null,
      enteredById: req.staffId,
    },
  });

  res.status(201).json({ etiology: entry });
}));

router.get("/", asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const entries = await prisma.etiology.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
    include: { enteredBy: { select: { name: true } } },
  });
  res.json({ entries });
}));

module.exports = router;
