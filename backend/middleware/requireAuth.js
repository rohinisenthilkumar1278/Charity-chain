const { verifyToken } = require("../utils/auth");

function requireAuth(role) {
  return function (req, res, next) {
    const header = req.header("Authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing or malformed Authorization header" });

    try {
      const payload = verifyToken(token);
      if (role && payload.role !== role) {
        return res.status(403).json({ error: `This action requires a ${role} login` });
      }
      req.user = payload;
      next();
    } catch {
      return res.status(401).json({ error: "Invalid or expired session, please log in again" });
    }
  };
}

module.exports = requireAuth;
