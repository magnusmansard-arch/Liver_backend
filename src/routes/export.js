const express = require("express");
const ExcelJS = require("exceljs");
const prisma = require("../db");
const { requireAuth } = require("../middleware/auth");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();
router.use(requireAuth);

// ---- Export everything captured so far as a single .xlsx workbook ----
// One sheet per data type, so it opens cleanly in Excel/Google Sheets/Numbers.
router.get("/xlsx", asyncHandler(async (req, res) => {
  const [patients, meldReadings, cpReadings] = await Promise.all([
    prisma.patient.findMany({
      orderBy: { createdAt: "asc" },
      include: { phones: true, createdBy: { select: { name: true, designation: true } } },
    }),
    prisma.meldReading.findMany({
      orderBy: { date: "asc" },
      include: {
        patient: { select: { name: true, town: true } },
        enteredBy: { select: { name: true } },
      },
    }),
    prisma.childPughReading.findMany({
      orderBy: { date: "asc" },
      include: {
        patient: { select: { name: true, town: true } },
        enteredBy: { select: { name: true } },
      },
    }),
  ]);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "GEM Institute Liver Department App";
  workbook.created = new Date();

  const headerStyle = { font: { bold: true }, fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFE7DC" } } };

  // ---- Sheet 1: Patients ----
  const patientsSheet = workbook.addWorksheet("Patients");
  patientsSheet.columns = [
    { header: "Patient ID", key: "id", width: 38 },
    { header: "Name", key: "name", width: 24 },
    { header: "Age", key: "age", width: 8 },
    { header: "Sex", key: "sex", width: 10 },
    { header: "Town/City", key: "town", width: 18 },
    { header: "Phone 1", key: "phone1", width: 16 },
    { header: "Phone 1 Contact", key: "phone1Contact", width: 22 },
    { header: "Phone 2", key: "phone2", width: 16 },
    { header: "Phone 2 Contact", key: "phone2Contact", width: 22 },
    { header: "Phone 3", key: "phone3", width: 16 },
    { header: "Phone 3 Contact", key: "phone3Contact", width: 22 },
    { header: "Registered By", key: "registeredBy", width: 22 },
    { header: "Registered On", key: "createdAt", width: 20 },
  ];
  patientsSheet.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));
  patients.forEach((p) => {
    const phoneCol = (i) => p.phones[i] || {};
    patientsSheet.addRow({
      id: p.id,
      name: p.name,
      age: p.age,
      sex: p.sex,
      town: p.town,
      phone1: phoneCol(0).number || "",
      phone1Contact: phoneCol(0).contactName ? `${phoneCol(0).contactName} (${phoneCol(0).relation || ""})` : "",
      phone2: phoneCol(1).number || "",
      phone2Contact: phoneCol(1).contactName ? `${phoneCol(1).contactName} (${phoneCol(1).relation || ""})` : "",
      phone3: phoneCol(2).number || "",
      phone3Contact: phoneCol(2).contactName ? `${phoneCol(2).contactName} (${phoneCol(2).relation || ""})` : "",
      registeredBy: p.createdBy ? `${p.createdBy.name} (${p.createdBy.designation})` : "",
      createdAt: p.createdAt,
    });
  });

  // ---- Sheet 2: MELD readings ----
  const meldSheet = workbook.addWorksheet("MELD Readings");
  meldSheet.columns = [
    { header: "Patient", key: "patient", width: 24 },
    { header: "Town/City", key: "town", width: 18 },
    { header: "Date", key: "date", width: 14 },
    { header: "Bilirubin (mg/dL)", key: "bilirubin", width: 16 },
    { header: "INR", key: "inr", width: 10 },
    { header: "Creatinine (mg/dL)", key: "creatinine", width: 16 },
    { header: "Sodium (mEq/L)", key: "sodium", width: 14 },
    { header: "On Dialysis", key: "onDialysis", width: 12 },
    { header: "MELD", key: "meld", width: 10 },
    { header: "MELD-Na", key: "meldNa", width: 10 },
    { header: "Entered By", key: "enteredBy", width: 22 },
  ];
  meldSheet.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));
  meldReadings.forEach((r) => {
    meldSheet.addRow({
      patient: r.patient?.name || "",
      town: r.patient?.town || "",
      date: r.date.toISOString().slice(0, 10),
      bilirubin: r.bilirubin,
      inr: r.inr,
      creatinine: r.creatinine,
      sodium: r.sodium ?? "",
      onDialysis: r.onDialysis ? "Yes" : "No",
      meld: r.meld,
      meldNa: r.meldNa ?? "",
      enteredBy: r.enteredBy?.name || "",
    });
  });

  // ---- Sheet 3: Child-Pugh readings ----
  const cpSheet = workbook.addWorksheet("Child-Pugh Readings");
  cpSheet.columns = [
    { header: "Patient", key: "patient", width: 24 },
    { header: "Town/City", key: "town", width: 18 },
    { header: "Date", key: "date", width: 14 },
    { header: "Bilirubin (mg/dL)", key: "bilirubin", width: 16 },
    { header: "Albumin (g/dL)", key: "albumin", width: 14 },
    { header: "INR", key: "inr", width: 10 },
    { header: "Ascites Points", key: "ascitesPoints", width: 14 },
    { header: "Encephalopathy Points", key: "encephPoints", width: 18 },
    { header: "Total Score", key: "totalScore", width: 12 },
    { header: "Class", key: "scoreClass", width: 8 },
    { header: "Entered By", key: "enteredBy", width: 22 },
  ];
  cpSheet.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));
  cpReadings.forEach((r) => {
    cpSheet.addRow({
      patient: r.patient?.name || "",
      town: r.patient?.town || "",
      date: r.date.toISOString().slice(0, 10),
      bilirubin: r.bilirubin,
      albumin: r.albumin,
      inr: r.inr,
      ascitesPoints: r.ascitesPoints,
      encephPoints: r.encephPoints,
      totalScore: r.totalScore,
      scoreClass: r.scoreClass,
      enteredBy: r.enteredBy?.name || "",
    });
  });

  const filename = `liver-department-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  await workbook.xlsx.write(res);
  res.end();
}));

module.exports = router;
