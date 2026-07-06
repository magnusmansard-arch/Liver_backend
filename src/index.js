require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const patientRoutes = require("./routes/patients");
const meldRoutes = require("./routes/meld");
const childPughRoutes = require("./routes/childPugh");
const exportRoutes = require("./routes/export");
const endoscopyRoutes = require("./routes/endoscopy");
const etiologyRoutes = require("./routes/etiology");
const diseaseStatusRoutes = require("./routes/diseaseStatus");
const ddltRoutes = require("./routes/ddlt");
const patientStatusRoutes = require("./routes/patientStatus");
const medicationsRoutes = require("./routes/medications");
const hccRoutes = require("./routes/hcc");

// Extra safety net: even with every route wrapped in asyncHandler, log
// clearly and loudly if something unexpected still slips through, so it
// shows up in Render logs instead of silently killing the process.
process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED PROMISE REJECTION:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/patients", patientRoutes);
app.use("/patients/:patientId/meld", meldRoutes);
app.use("/patients/:patientId/child-pugh", childPughRoutes);
app.use("/patients/:patientId/endoscopy", endoscopyRoutes);
app.use("/patients/:patientId/etiology", etiologyRoutes);
app.use("/patients/:patientId/disease-status", diseaseStatusRoutes);
app.use("/patients/:patientId/ddlt", ddltRoutes);
app.use("/patients/:patientId/status", patientStatusRoutes);
app.use("/patients/:patientId/medications", medicationsRoutes);
app.use("/patients/:patientId/hcc", hccRoutes);
app.use("/export", exportRoutes);

// Basic error handler — keeps stack traces out of API responses
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Liver Department API running on port ${PORT}`);
});
