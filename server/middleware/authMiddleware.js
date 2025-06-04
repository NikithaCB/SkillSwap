// server/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

// Middleware to protect routes
function authMiddleware(req, res, next) {
  // Get token from header
  const token = req.header("x-auth-token");

  // Check if not token
  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  // Verify token
  try {
    // Use your JWT_SECRET from your .env file
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user payload from token to request object
    // This payload should contain the user's ID (e.g., MongoDB _id)
    req.user = decoded.user;
    next(); // Move to the next middleware or route handler

  } catch (err) {
    // Token is not valid
    console.error("Auth middleware token verification failed:", err.message);
    res.status(401).json({ msg: "Token is not valid" });
  }
}

module.exports = authMiddleware; // Export the middleware function