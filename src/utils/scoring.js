// Mirrors the MELD / MELD-Na logic from Screen 7 of the app,
// so scores are computed identically whether entered from the app or recalculated on the server.

function calculateMeld({ bilirubin, inr, creatinine, sodium, onDialysis }) {
  const b = Math.max(bilirubin, 1.0);
  const i = Math.max(inr, 1.0);
  const c = onDialysis ? 4.0 : Math.min(Math.max(creatinine, 1.0), 4.0);

  const raw = 3.78 * Math.log(b) + 11.2 * Math.log(i) + 9.57 * Math.log(c) + 6.43;
  const meld = Math.min(Math.max(Math.round(raw), 6), 40);

  let meldNa = null;
  if (sodium !== null && sodium !== undefined) {
    const na = Math.min(Math.max(sodium, 125), 137);
    if (meld > 11) {
      const rawNa = meld + 1.32 * (137 - na) - 0.033 * meld * (137 - na);
      meldNa = Math.min(Math.max(Math.round(rawNa), 6), 40);
    } else {
      meldNa = meld;
    }
  }

  return { meld, meldNa };
}

// Mirrors the Child-Pugh logic from Screen 8.
function bilirubinPoints(v) {
  return v < 2 ? 1 : v <= 3 ? 2 : 3;
}
function albuminPoints(v) {
  return v > 3.5 ? 1 : v >= 2.8 ? 2 : 3;
}
function inrPoints(v) {
  return v < 1.7 ? 1 : v <= 2.3 ? 2 : 3;
}

function calculateChildPugh({ bilirubin, albumin, inr, ascitesPoints, encephPoints }) {
  const total =
    bilirubinPoints(bilirubin) + albuminPoints(albumin) + inrPoints(inr) + ascitesPoints + encephPoints;
  const scoreClass = total <= 6 ? "A" : total <= 9 ? "B" : "C";
  return { total, scoreClass };
}

module.exports = { calculateMeld, calculateChildPugh };
