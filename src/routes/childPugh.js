const express = require("express");
const prisma = require("../db");
const { requireAuth } = require("../middleware/auth");
const { calculateChildPugh } = require("../utils/scoring");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router({ mergeParams: true }); // mounted at /patients/:patientId/child-pugh
router.use(requireAuth);

// ---- Screen 8: add a dated Child-Pugh reading ----
router.post("/", asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { date, bilirubin, albumin, inr, ascitesPoints, encephPoints } = req.body;

  if (!date) return res.status(400).json({ error: "Date is required." });
  if (
    typeof bilirubin !== "number" ||
    typeof albumin !== "number" ||
    typeof inr !== "number" ||
    ![1, 2, 3].includes(ascitesPoints) ||
    ![1, 2, 3].includes(encephPoints)
  ) {
    return res.status(400).json({ error: "All five Child-Pugh fields are required." });
  }

  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) return res.status(404).json({ error: "Patient not found." });

  const { total, scoreClass } = calculateChildPugh({ bilirubin, albumin, inr, ascitesPoints, encephPoints });

  const reading = await prisma.childPughReading.create({
    data: {
      patientId,
      date: new Date(date),
      bilirubin,
      albumin,
      inr,
      ascitesPoints,
      encephPoints,
      totalScore: total,
      scoreClass,
      enteredById: req.staffId,
    },
  });

  res.status(201).json({ reading });
}));

router.get("/", asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const readings = await prisma.childPughReading.findMany({
    where: { patientId },
    orderBy: { date: "asc" },
    include: { enteredBy: { select: { name: true } } },
  });
  res.json({ readings });
}));

router.delete("/:readingId", asyncHandler(async (req, res) => {
  await prisma.childPughReading.delete({ where: { id: req.params.readingId } });
  res.status(204).send();
}));

module.exports = router;
