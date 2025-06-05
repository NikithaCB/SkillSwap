const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Import the User model

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user; // Attach user payload from token to request object
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token is not valid" });
  }
}

// @route   POST /api/auth/register
// @desc    Register a new user with email and password
// @access  Public
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body; // Assuming name is also sent from frontend for registration

  try {
    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ msg: "User already exists" });
    }

    // Create new user instance
    user = new User({
      name,
      email,
      password, // Password will be hashed before saving
      // You can add default values for other fields here if needed
      teachSkills: [],
      learnSkills: [],
      bio: "",
      photo: "",
      rating: 0,
      reviews: [],
      // firebaseUid will be added later if the user links via Firebase
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Save user to database
    await user.save();
    console.log("User successfully saved to database with ID:", user._id);

    // Create JWT payload
    const payload = {
      user: {
        id: user.id,
        uid: user.id,
        name: user.name,
        email: user.email,
      },
    };

    // Sign JWT
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user and get token
// @access  Public
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: "Invalid Credentials" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid Credentials" });
    }

    // Create JWT payload
    const payload = {
      user: {
        id: user.id,
        uid: user.id,
        name: user.name,
        email: user.email,
      },
    };

    // Sign JWT
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   POST /api/auth/firebase-login
// @desc    Handle Firebase authenticated user login/registration and issue JWT
// @access  Public
router.post("/firebase-login", async (req, res) => {
  const { firebaseUid, name, email, photo } = req.body;

  console.log("Received POST request to /api/auth/firebase-login");
  console.log("Request body:", { firebaseUid, name, email, photo });

  try {
    console.log("Attempting to find user by firebaseUid:", firebaseUid);
    let user = await User.findOne({ firebaseUid });

    if (user) {
      console.log("Firebase user found in DB by firebaseUid:", user._id);
    } else {
      console.log(
        "Firebase user not found by firebaseUid, attempting to find by email:",
        email
      );
      user = await User.findOne({ email });

      if (user) {
        console.log(
          "Existing email user found, linking Firebase UID.",
          user._id
        );
        user.firebaseUid = firebaseUid;
        if (!user.name) user.name = name;
        if (!user.photo) user.photo = photo; 
      } else {
        
        console.log(
          "No existing user found, creating a new user with Firebase data."
        );
        user = new User({
          firebaseUid, 
          name: name || email.split("@")[0], 
          email, 
          photo: photo || "", 
          teachSkills: [],
          learnSkills: [],
          bio: "",
          rating: 0,
          reviews: [],
        });
        console.log("New user object created:", user);
      }

      console.log("Attempting to save user to DB...");
      await user.save();
      console.log(
        "User saved/updated successfully. MongoDB _id:",
        user._id,
        "Firebase UID:",
        user.firebaseUid
      );
    }

    console.log("Generating JWT payload for user:", user._id);
    const payload = {
      user: {
        id: user.id, // MongoDB _id
        uid: user.firebaseUid, 
        name: user.name,
        email: user.email,
        photo: user.photo,
      },
    };
    console.log("JWT payload:", payload);

    // Sign JWT
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
      (err, token) => {
        if (err) throw err;
        console.log("JWT signed successfully.");
        res.json({ token });
      }
    );
  } catch (err) {
    console.error("Error in /api/auth/firebase-login:", err.message);
    console.error("Full error object:", err);
    res.status(500).send("Server Error");
  }
});

router.get("/user", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .select("+firebaseUid"); // Include firebaseUid here

    if (!user) {
      return res.status(404).json({ msg: "User not found in DB" });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
