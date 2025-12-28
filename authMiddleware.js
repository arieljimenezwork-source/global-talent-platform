const admin = require("firebase-admin");

/* Extrae token Bearer */
function extractBearer(req) {
  const h = req.headers.authorization || req.headers.Authorization || "";
  const m = /^bearer\s+(.+)$/i.exec((h || "").trim());
  return m ? m[1].trim() : null;
}

module.exports = async function verifyToken(req, res, next) {
  // Permitir preflight sin verificar token
  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  const idToken = extractBearer(req) || (req.cookies && req.cookies.token);

  if (!idToken) {
    return res.status(401).json({ error: "Token no proporcionado." });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(idToken, true);

    if (!decoded || !decoded.uid) {
      return res.status(401).json({ error: "Token inválido." });
    }

    req.user = decoded;
    next();

  } catch (err) {
    console.error("🔥 Error verifyToken:", err);

    let msg = "Token inválido o expirado.";

    if (err.code === "auth/id-token-expired") msg = "Token expirado.";
    if (err.code === "auth/id-token-revoked") msg = "Token revocado.";

    return res.status(401).json({ error: msg });
  }
};



