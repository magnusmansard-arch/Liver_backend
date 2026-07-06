const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// pinIndex: a deterministic hash used ONLY to look up a staff record by PIN
// and to enforce "no two people share the same PIN" at the database level.
// It is NOT used to authenticate — pinHash (bcrypt) does that.
function pinIndexFor(pin) {
  const pepper = process.env.JWT_SECRET || "dev-only-pepper-change-me";
  return crypto.createHmac("sha256", pepper).update(pin).digest("hex");
}

async function hashPin(pin) {
  const pinHash = await bcrypt.hash(pin, 10);
  const pinIndex = pinIndexFor(pin);
  return { pinHash, pinIndex };
}

async function verifyPin(pin, pinHash) {
  return bcrypt.compare(pin, pinHash);
}

function isValidPin(pin) {
  return typeof pin === "string" && /^\d{4}$/.test(pin);
}

module.exports = { pinIndexFor, hashPin, verifyPin, isValidPin };
