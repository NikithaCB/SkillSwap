const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware"); // Import the auth middleware

// Create or update user
// This route is now protected and updates the authenticated user's profile
router.post("/", authMiddleware, async (req, res) => {
  // Add authMiddleware here
  console.log("Received POST request to /api/users (authenticated)");
  // Extract profile fields and firebaseUid from the request body
  const { name, email, photo, teachSkills, learnSkills, bio, firebaseUid } =
    req.body;
  try {
    // Find the user by the ID from the authenticated token (MongoDB _id)
    let user = await User.findById(req.user.id);

    // If user is not found (shouldn't happen with auth middleware, but as a safeguard)
    if (!user) {
      console.error("Authenticated user not found in DB:", req.user.id);
      return res.status(404).json({ msg: "Authenticated user not found" });
    }

    console.log("User found for update:", user.id);

    // Update user fields.
    user.name = name !== undefined ? name : user.name;
    if (email !== undefined && user.email !== email) {
    
      user.email = email;
    }
    user.photo = photo !== undefined ? photo : user.photo;
    user.teachSkills =
      teachSkills !== undefined ? teachSkills : user.teachSkills;
    user.learnSkills =
      learnSkills !== undefined ? learnSkills : user.learnSkills;
    user.bio = bio !== undefined ? bio : user.bio;

    // Save the firebaseUid if provided and not already set
    if (firebaseUid && !user.firebaseUid) {
      user.firebaseUid = firebaseUid;
      console.log("Saving firebaseUid:", firebaseUid);
    }

    // Save the updated user
    await user.save();
    console.log("User updated successfully:", user);

    res.json(user);
  } catch (err) {
    console.error("Error updating user profile:", err); 
    if (err.name === "ValidationError") {
      return res.status(400).json({ msg: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

// Get all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("+firebaseUid");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user by ID (MongoDB _id)
router.get("/:userId", async (req, res) => {
  console.log("Backend: Received GET request for user ID:", req.params.userId);
  try {
    const user = await User.findById(req.params.userId).select(
      "+firebaseUid +googleId"
    );
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(400).json({ msg: "Invalid user ID" });
    }
    res.status(500).send("Server Error");
  }
});

// Get user by googleId
router.get("/by-google-id/:googleId", async (req, res) => {
  try {
    // Find user by either googleId or firebaseUid
    const user = await User.findOne({
      $or: [
        { googleId: req.params.googleId },
        { firebaseUid: req.params.googleId },
      ],
    }).select("+firebaseUid +googleId"); // Also select these fields

    if (!user) {
      console.log(
        "Backend: User not found by googleId or firebaseUid:",
        req.params.googleId
      );
      return res.status(404).json({ msg: "User not found" });
    }
    console.log("Backend: User found by googleId or firebaseUid:", user);
    res.json(user);
  } catch (err) {
    console.error(
      "Backend: Error fetching user by googleId/firebaseUid:",
      err.message
    );
    res.status(500).send("Server Error");
  }
});

module.exports = router;
