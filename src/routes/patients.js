const express = require("express");
const prisma = require("../db");
const { requireAuth } = require("../middleware/auth");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();
router.use(requireAuth);

const SEX_VALUES = ["MALE", "FEMALE", "OTHER"];
const RELATION_VALUES = ["SELF", "SPOUSE", "SON", "DAUGHTER", "PARENT", "SIBLING", "CAREGIVER", "OTHER"];

// ---- Screen 6/7: create a new patient ----
// phones: [{ number, contactName, relation }], 1–3 entries, at least one required
// referralSource/referringDoctor come from Screen 6 (Patient Origin) and are optional here
// since not every deployment may use that screen.
router.post("/", asyncHandler(async (req, res) => {
  const { name, age, sex, town, phones, referralSource, referringDoctor } = req.body;

  if (!name || !name.trim()) return res.status(400).json({ error: "Patient name is required." });
  if (!Number.isInteger(age) || age <= 0 || age > 130) return res.status(400).json({ error: "Enter a valid age." });
  if (!SEX_VALUES.includes(sex)) return res.status(400).json({ error: "Invalid sex value." });
  if (!town || !town.trim()) return res.status(400).json({ error: "Town/city is required." });

  const cleanPhones = (phones || [])
    .filter((p) => p.number && p.number.trim())
    .slice(0, 3)
    .map((p) => ({
      number: p.number.trim(),
      contactName: p.contactName ? p.contactName.trim() : null,
      relation: RELATION_VALUES.includes(p.relation) ? p.relation : null,
    }));

  if (cleanPhones.length === 0) {
    return res.status(400).json({ error: "At least one phone number is required." });
  }

  const patient = await prisma.patient.create({
    data: {
      name: name.trim(),
      age,
      sex,
      town: town.trim(),
      referralSource: referralSource || null,
      referringDoctor: referringDoctor || null,
      createdById: req.staffId,
      phones: { create: cleanPhones },
    },
    include: { phones: true },
  });

  res.status(201).json({ patient });
}));

// ---- At-a-glance list: every patient with the latest of everything, for the
// department dashboard (Screen 21) and Follow-up patient search (Screen 15) ----
router.get("/", asyncHandler(async (req, res) => {
  const patients = await prisma.patient.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      meldReadings: { orderBy: { date: "desc" }, take: 1 },
      cpReadings: { orderBy: { date: "desc" }, take: 1 },
      diseaseStatuses: { orderBy: { createdAt: "desc" }, take: 1 },
      ddltRegistrations: { orderBy: { createdAt: "desc" }, take: 1 },
      patientStatuses: { orderBy: { createdAt: "desc" }, take: 1 },
      hccScreenings: { orderBy: { date: "desc" }, take: 1 },
      phones: true,
    },
  });

  const shaped = patients.map((p) => {
    const latestDisease = p.diseaseStatuses[0];
    const latestDdlt = p.ddltRegistrations[0];
    const latestStatus = p.patientStatuses[0];
    const latestHcc = p.hccScreenings[0];

    return {
      id: p.id,
      name: p.name,
      age: p.age,
      sex: p.sex,
      town: p.town,
      phones: p.phones,
      latestMeld: p.meldReadings[0]?.meldNa ?? p.meldReadings[0]?.meld ?? null,
      latestChildPugh: p.cpReadings[0] ? { total: p.cpReadings[0].totalScore, class: p.cpReadings[0].scoreClass } : null,
      decompensated: latestDisease ? latestDisease.status === "decompensated" : false,
      ddltListed: latestDdlt ? latestDdlt.registered === "yes" : false,
      status: latestStatus ? latestStatus.status : null,
      hccNextDue: latestHcc ? latestHcc.nextDue : null,
    };
  });

  res.json({ patients: shaped });
}));

// ---- Full patient record — demographics, phones, and full history across
// every screen (Screen 6 detail through 20) ----
router.get("/:id", asyncHandler(async (req, res) => {
  const patient = await prisma.patient.findUnique({
    where: { id: req.params.id },
    include: {
      phones: true,
      meldReadings: { orderBy: { date: "asc" }, include: { enteredBy: { select: { name: true } } } },
      cpReadings: { orderBy: { date: "asc" }, include: { enteredBy: { select: { name: true } } } },
      endoscopyFindings: { orderBy: { date: "asc" }, include: { enteredBy: { select: { name: true } } } },
      etiologies: { orderBy: { createdAt: "desc" }, include: { enteredBy: { select: { name: true } } } },
      diseaseStatuses: { orderBy: { createdAt: "desc" }, include: { enteredBy: { select: { name: true } } } },
      ddltRegistrations: { orderBy: { createdAt: "desc" }, include: { enteredBy: { select: { name: true } } } },
      patientStatuses: { orderBy: { createdAt: "desc" }, include: { enteredBy: { select: { name: true } } } },
      medications: { orderBy: { createdAt: "asc" }, include: { enteredBy: { select: { name: true } } } },
      medicationChanges: { orderBy: { date: "asc" }, include: { enteredBy: { select: { name: true } } } },
      hccScreenings: { orderBy: { date: "asc" }, include: { enteredBy: { select: { name: true } } } },
      createdBy: { select: { name: true, designation: true } },
    },
  });

  if (!patient) return res.status(404).json({ error: "Patient not found." });
  res.json({ patient });
}));

module.exports = router;
