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

import axios from "axios";

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
      console.log("Attempting to save token to localStorage (Google Login)...");
      localStorage.setItem("token", res.data.token);
      console.log("Token saved successfully (Google Login).");

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
       const res = await axios.post(`${BACKEND_URL}/api/auth/firebase-login`, {
        firebaseUid: firebaseUser.uid,
        name: firebaseUser.displayName, 
        email: firebaseUser.email,
        photo: firebaseUser.photoURL, 
      });

      console.log("Backend JWT received after registration:", res.data.token);
      console.log(
        "Attempting to save token to localStorage (Email Sign Up)..."
      );
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

      console.log("Sending Firebase user data to backend after login...");

      const res = await axios.post(`${BACKEND_URL}/api/auth/firebase-login`, {
        firebaseUid: firebaseUser.uid,
        name: firebaseUser.displayName, 
        email: firebaseUser.email,
        photo: firebaseUser.photoURL, 
      });

      console.log("Backend JWT received after login:", res.data.token);
      console.log("Attempting to save token to localStorage (Email Login)...");
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
