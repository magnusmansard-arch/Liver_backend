const express = require("express");
const prisma = require("../db");
const { requireAuth } = require("../middleware/auth");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router({ mergeParams: true }); // mounted at /patients/:patientId/disease-status
router.use(requireAuth);

const VALID_STATUSES = ["compensated", "decompensated"];

router.post("/", asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { status, events, eventDetails, onsetDate } = req.body;

  if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: "Invalid status." });
  if (status === "decompensated" && (!events || events.length === 0)) {
    return res.status(400).json({ error: "At least one decompensation event is required." });
  }

  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) return res.status(404).json({ error: "Patient not found." });

  const entry = await prisma.diseaseStatusEntry.create({
    data: {
      patientId,
      status,
      events: events || null,
      eventDetails: eventDetails || null,
      onsetDate: onsetDate ? new Date(onsetDate) : null,
      enteredById: req.staffId,
    },
  });

  res.status(201).json({ entry });
}));

router.get("/", asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const entries = await prisma.diseaseStatusEntry.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
    include: { enteredBy: { select: { name: true } } },
  });
  res.json({ entries });
}));

module.exports = router;
