const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  googleId: String,
  name: String,
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: false,
  },
  photo: String,
  teachSkills: [String],
  learnSkills: [String],
  bio: String,
  rating: { type: Number, default: 0 },
  reviews: [{ type: String }],
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true,
  },
});

// Optional: Add a method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  // We will add this implementation after installing bcryptjs
  return true; // Placeholder
};

module.exports = mongoose.model("User", userSchema);
