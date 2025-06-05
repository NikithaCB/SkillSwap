import React, { useState } from "react";
import {
  auth,
  provider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "../utils/firebase";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import "../styles/login.css";
import { FaGoogle } from "react-icons/fa";

import axios from "axios"; // Import axios

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

function Login({ onSuccessfulAuth }) {
  const navigate = useNavigate();

  // State for Email/Password Auth
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Google Login Handler (existing, already modified)
  const handleGoogleLogin = async () => {
    try {
      console.log("Attempting Google Login...");
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      console.log("Google Login successful with Firebase user:", firebaseUser);

      // Send Firebase user data to backend to get JWT
      console.log("Sending Firebase user data to backend for JWT...");
      const res = await axios.post(`${BACKEND_URL}/api/auth/firebase-login`, {
        firebaseUid: firebaseUser.uid,
        name: firebaseUser.displayName,
        email: firebaseUser.email,
        photo: firebaseUser.photoURL,
      });

      console.log("Backend JWT received:", res.data.token);

      // Store the JWT in localStorage
      localStorage.setItem("token", res.data.token);
      console.log("Backend JWT saved to localStorage.");

      // Call onSuccessfulAuth to signal successful auth to AppContent
      // AppContent handleSuccessfulAuth will validate the backend token and set state.
      onSuccessfulAuth(res.data);
      console.log("Attempting to navigate to dashboard after Google login...");
      navigate("/dashboard");
    } catch (error) {
      console.error(
        "Google Login error:",
        error.response?.data || error.message
      );
      console.error("Full Google Login error object:", error);
      // alert(
      //   "Google Login failed: " + (error.response?.data?.msg || error.message)
      // );
    }
  };

  // Modified Email/Password Auth Handlers
  const handleEmailSignUp = async () => {
    try {
      console.log("Attempting email/password registration with Firebase...");
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = result.user;
      console.log("Firebase Registration successful:", firebaseUser);

      // Now call backend to create/link user in MongoDB and get JWT
      console.log(
        "Sending Firebase user data to backend after registration..."
      );
      // Note: Firebase email/password doesn't directly provide name/photo on signup.
      // Name/photo will likely be set via the profile form later or linked if email existed.
      const res = await axios.post(`${BACKEND_URL}/api/auth/firebase-login`, {
        firebaseUid: firebaseUser.uid,
        name: firebaseUser.displayName, // This might be null initially for email/password Firebase users
        email: firebaseUser.email,
        photo: firebaseUser.photoURL, // This will be null initially for email/password Firebase users
      });

      console.log("Backend JWT received after registration:", res.data.token);
      localStorage.setItem("token", res.data.token);
      console.log("Backend JWT saved to localStorage after registration.");

      onSuccessfulAuth(res.data);

      console.log("Attempting to navigate to dashboard after email signup...");
      navigate("/dashboard");
    } catch (err) {
      console.error("Firebase Registration error:", err.message);
      console.error("Full registration error object:", err);
      alert("Registration failed: " + err.message);
    }
  };

  const handleEmailLogin = async () => {
    try {
      console.log("Attempting email/password login with Firebase...");
      const result = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = result.user;
      console.log("Firebase Login successful:", firebaseUser);

      // Now call backend to find user in MongoDB (by firebaseUid) and get JWT
      console.log("Sending Firebase user data to backend after login...");
      // Even on login, send the basic Firebase user info to ensure consistency and get the correct JWT
      const res = await axios.post(`${BACKEND_URL}/api/auth/firebase-login`, {
        firebaseUid: firebaseUser.uid,
        name: firebaseUser.displayName, // Will be null if not set in Firebase
        email: firebaseUser.email,
        photo: firebaseUser.photoURL, // Will be null if not set in Firebase
      });

      console.log("Backend JWT received after login:", res.data.token);
      localStorage.setItem("token", res.data.token);
      console.log("Backend JWT saved to localStorage after login.");

      onSuccessfulAuth(res.data);

      console.log("Attempting to navigate to dashboard after email login...");
      navigate("/dashboard");
    } catch (err) {
      console.error("Firebase Login error:", err.message);
      console.error("Full login error object:", err);
      alert("Login failed: " + err.message);
    }
  };

  return (
    <>
      <div className="login-page">
        <div className="login-container">
          <h2 className="login-title">Skill Swap Login</h2>
          <p className="login-subtitle">
            From Skill to Skill, Let's Make the Swap!
          </p>

          {/* Google Login Button */}
          <button
            className="login-button"
            onClick={handleGoogleLogin}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FcGoogle style={{ marginRight: "8px" }} size={20} />
            Login with Google
          </button>

          {/* Separator */}
          <div style={{ margin: "20px 0", textAlign: "center" }}>OR</div>

          {/* Email/Password Login */}
          <div className="login-form">
            {/* Name Input for Sign Up */}
            {/* You might want to conditionally render this input only on a signup tab/page */}
            {/* For now, it appears for both login and signup */}
            {/* <input
              id="name"
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="login-input"
            /> */}
            <input
              id="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="login-input"
            />
            <input
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
            />
            <button
              id="login-button"
              onClick={handleEmailLogin}
              className="login-button"
              style={{ marginRight: "10px" }}
            >
              Login
            </button>
            <button
              id="signup-button"
              onClick={handleEmailSignUp}
              className="login-button"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;
