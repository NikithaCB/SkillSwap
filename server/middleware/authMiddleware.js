const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  // Get token from header
  const token = req.header("x-auth-token");

  // Check if not token
  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();

  } catch (err) {
    console.error("Auth middleware token verification failed:", err.message);
    res.status(401).json({ msg: "Token is not valid" });
  }
}

module.exports = authMiddleware; 