const express = require("express");
const prisma = require("../db");
const { requireAuth } = require("../middleware/auth");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router({ mergeParams: true }); // mounted at /patients/:patientId/endoscopy
router.use(requireAuth);

router.post("/", asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { varices, redSigns, gastricVarices, phg, intervention, notes, date } = req.body;

  if (!varices || !gastricVarices || !phg) {
    return res.status(400).json({ error: "Varices, gastric varices, and PHG findings are required." });
  }

  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) return res.status(404).json({ error: "Patient not found." });

  const entry = await prisma.endoscopyFinding.create({
    data: {
      patientId,
      date: date ? new Date(date) : undefined,
      varices,
      redSigns: redSigns || null,
      gastricVarices,
      phg,
      intervention: intervention || null,
      notes: notes || null,
      enteredById: req.staffId,
    },
  });

  res.status(201).json({ entry });
}));

router.get("/", asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const entries = await prisma.endoscopyFinding.findMany({
    where: { patientId },
    orderBy: { date: "desc" },
    include: { enteredBy: { select: { name: true } } },
  });
  res.json({ entries });
}));

module.exports = router;
