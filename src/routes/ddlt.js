const express = require("express");
const prisma = require("../db");
const { requireAuth } = require("../middleware/auth");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router({ mergeParams: true }); // mounted at /patients/:patientId/ddlt
router.use(requireAuth);

router.post("/", asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { registered, center, waitlistNumber } = req.body;

  if (!["yes", "no"].includes(registered)) return res.status(400).json({ error: "Invalid value for registered." });
  if (registered === "yes" && (!center || !waitlistNumber)) {
    return res.status(400).json({ error: "Center and waitlist number are required when registered." });
  }

  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) return res.status(404).json({ error: "Patient not found." });

  const entry = await prisma.ddltRegistration.create({
    data: {
      patientId,
      registered,
      center: registered === "yes" ? center : null,
      waitlistNumber: registered === "yes" ? waitlistNumber : null,
      enteredById: req.staffId,
    },
  });

  res.status(201).json({ entry });
}));

router.get("/", asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const entries = await prisma.ddltRegistration.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
    include: { enteredBy: { select: { name: true } } },
  });
  res.json({ entries });
}));

module.exports = router;
