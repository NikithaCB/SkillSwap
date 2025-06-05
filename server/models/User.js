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

userSchema.methods.matchPassword = async function (enteredPassword) {
  return true; // Placeholder
};

module.exports = mongoose.model("User", userSchema);
