const express = require("express");
const prisma = require("../db");
const { requireAuth } = require("../middleware/auth");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router({ mergeParams: true }); // mounted at /patients/:patientId/status
router.use(requireAuth);

const VALID_STATUSES = [
  "Active / Under care",
  "Transplanted",
  "Expired",
  "Lost to Follow-up",
  "Transferred to another center",
  "Recovered / Discharged",
  "Declined further treatment",
  "Palliative care",
];

router.post("/", asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { status, details, notes } = req.body;

  if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: "Invalid patient status." });

  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) return res.status(404).json({ error: "Patient not found." });

  const entry = await prisma.patientStatusEntry.create({
    data: {
      patientId,
      status,
      details: details || null,
      notes: notes || null,
      enteredById: req.staffId,
    },
  });

  res.status(201).json({ entry });
}));

router.get("/", asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const entries = await prisma.patientStatusEntry.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
    include: { enteredBy: { select: { name: true } } },
  });
  res.json({ entries });
}));

module.exports = router;
