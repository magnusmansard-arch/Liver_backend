const express = require("express");
const jwt = require("jsonwebtoken");
const prisma = require("../db");
const { hashPin, verifyPin, isValidPin, pinIndexFor } = require("../utils/pin");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();

const DESIGNATIONS = ["CONSULTANT", "REGISTRAR", "PHYSICIAN_ASSISTANT", "COORDINATOR", "MARKETING_EXECUTIVE"];
const CITIES = ["CHENNAI", "COIMBATORE"];

function signToken(staffId) {
  return jwt.sign({ staffId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "12h",
  });
}

// ---- Screen 2 + 3: Register, then set a 4-digit PIN ----
// Done as one call from the app: register collects name/designation/city,
// the PIN screen collects + confirms the PIN client-side, then this endpoint
// creates the account with both.
router.post("/register", asyncHandler(async (req, res) => {
  const { name, designation, city, pin } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Name is required." });
  }
  if (!DESIGNATIONS.includes(designation)) {
    return res.status(400).json({ error: "Invalid designation." });
  }
  if (!CITIES.includes(city)) {
    return res.status(400).json({ error: "Invalid city." });
  }
  if (!isValidPin(pin)) {
    return res.status(400).json({ error: "PIN must be exactly 4 digits." });
  }

  const pinIndex = pinIndexFor(pin);
  const existing = await prisma.staff.findUnique({ where: { pinIndex } });
  if (existing) {
    return res.status(409).json({ error: "That PIN is already in use. Please choose a different one." });
  }

  const { pinHash } = await hashPin(pin);

  const staff = await prisma.staff.create({
    data: { name: name.trim(), designation, city, pinHash, pinIndex },
  });

  const token = signToken(staff.id);
  res.status(201).json({
    token,
    staff: { id: staff.id, name: staff.name, designation: staff.designation, city: staff.city },
  });
}));

// ---- Screen 4: Enter PIN (returning staff) ----
router.post("/login", asyncHandler(async (req, res) => {
  const { pin } = req.body;

  if (!isValidPin(pin)) {
    return res.status(400).json({ error: "PIN must be exactly 4 digits." });
  }

  const pinIndex = pinIndexFor(pin);
  const staff = await prisma.staff.findUnique({ where: { pinIndex } });

  if (!staff) {
    return res.status(401).json({ error: "PIN not recognized." });
  }

  const valid = await verifyPin(pin, staff.pinHash);
  if (!valid) {
    // Should not happen if pinIndex matched, but double-check for defense in depth
    return res.status(401).json({ error: "PIN not recognized." });
  }

  const token = signToken(staff.id);
  res.json({
    token,
    staff: { id: staff.id, name: staff.name, designation: staff.designation, city: staff.city },
  });
}));

module.exports = router;
