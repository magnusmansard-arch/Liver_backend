const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing login token. Please enter your PIN again." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.staffId = payload.staffId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Session expired. Please enter your PIN again." });
  }
}

module.exports = { requireAuth };
