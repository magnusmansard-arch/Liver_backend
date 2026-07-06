const { PrismaClient } = require("@prisma/client");

// Reuse a single Prisma client across the app (avoids connection exhaustion)
const prisma = new PrismaClient();

module.exports = prisma;
