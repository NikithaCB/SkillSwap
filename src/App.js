import React, { useState, useEffect, useRef } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { auth } from "./utils/firebase";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import axios from "axios";
import setAuthToken from "./utils/setAuthToken";

import Launch from "./components/Launch";
import Login from "./components/Login";
import ProfileForm from "./components/ProfileForm";
import Dashboard from "./components/Dashboard";
import ProfileDetails from "./components/ProfileDetails";
import Chat from "./components/Chat";

function AppContent() {
  const [currentUser, setCurrentUser] = useState(null); // Combined user data (from Backend via JWT or mapped from Firebase user)
  const [loading, setLoading] = useState(true); // To handle initial auth state check

  const navigate = useNavigate();

  // Ref to track if logout is in progress
  const isLoggingOut = useRef(false);

  // This useEffect runs once on mount for the initial authentication check
  useEffect(() => {
    console.log("AppContent.js: useEffect triggered for initial auth check.");

    const checkAuthStatus = async () => {
      console.log("AppContent.js: checkAuthStatus function called.");

      // 1. Check for JWT first
      const token = localStorage.getItem("token");

      if (token) {
        console.log("AppContent.js: Found JWT. Attempting to validate...");
        setAuthToken(token);
        try {
          const res = await axios.get("http://localhost:5000/api/auth/user");
          // If JWT valid, set user data from backend response
          setCurrentUser(res.data); // This should contain name/email from DB
          console.log(
            "AppContent.js: Successfully loaded user from JWT.",
            res.data
          );
        } catch (err) {
          console.error(
            "AppContent.js: JWT validation failed or user not found:",
            err
          );
          localStorage.removeItem("token");
          setAuthToken(null);
          console.log("AppContent.js: Invalid JWT cleared.");
        }
      }

      // 2. After JWT check, set up Firebase listener. It will fire immediately with current state.
      console.log(
        "AppContent.js: Setting up Firebase onAuthStateChanged listener."
      );
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        console.log(
          "AppContent.js: Firebase onAuthStateChanged triggered.",
          firebaseUser ? "Logged In" : "Logged Out",
          "Current currentUser state BEFORE listener update:",
          currentUser
        );

        // If we are in the process of logging out, ignore updates from the listener
        if (isLoggingOut.current) {
          console.log(
            "AppContent.js: Logout in progress, ignoring Firebase listener update."
          );
          isLoggingOut.current = false; // Reset the flag after ignoring
          setLoading(false); // Ensure loading is false even if listener is ignored
          return; // Stop further processing in this listener call
        }

        // If Firebase user exists and there's no currentUser already set by a valid JWT
        if (
          firebaseUser &&
          (!currentUser || currentUser.uid !== firebaseUser.uid)
        ) {
          console.log(
            "AppContent.js: Firebase user detected and currentUser not set by JWT."
          );
          // Map Firebase user data to currentUser
          setCurrentUser({
            uid: firebaseUser.uid,
            id: firebaseUser.uid, // Consistent ID
            name: firebaseUser.displayName, // Get name from Firebase
            email: firebaseUser.email,
            photo: firebaseUser.photoURL,
            // ... other Firebase user data
          });
          console.log(
            "AppContent.js: currentUser set from Firebase user.",
            firebaseUser
          );
        } else if (!firebaseUser && localStorage.getItem("token")) {
          // Firebase user logged out, but a JWT is present. Keep currentUser from JWT.
          console.log(
            "AppContent.js: Firebase user logged out, but JWT found. Keeping JWT user."
          );
        } else if (!firebaseUser && !localStorage.getItem("token")) {
          // No Firebase user and no JWT. Ensure currentUser is null.
          console.log(
            "AppContent.js: No Firebase user and no JWT found. Clearing currentUser."
          );
          setCurrentUser(null);
        }
        // If Firebase user exists and a JWT was already loaded, currentUser is already set by JWT.
        // No need to update currentUser from Firebase in this case to avoid overwriting backend data.

        // Set loading to false after the initial checks are complete (both JWT check and Firebase listener firing once)
        setLoading(false);
        console.log(
          "AppContent.js: Initial auth checks complete. setLoading(false)."
        );
      });

      // Clean up the Firebase listener on component unmount
      return () => unsubscribe();
    };

    checkAuthStatus();

    // Empty dependency array: runs only once on mount
  }, []);

  // Determine isAuthenticated based on the presence of currentUser
  // This simplifies the logic used in routes
  const isAuthenticated = !!currentUser;

  console.log(
    "AppContent.js: Rendering. isAuthenticated:",
    isAuthenticated,
    "currentUser:",
    currentUser
  );

  const handleSuccessfulAuth = async (userData) => {
    console.log(
      "AppContent.js: handleSuccessfulAuth triggered by Login component.",
      userData
    );

    // After successful login (either method), re-check authentication state
    // This will now pick up the JWT if it was set by the Login component,
    // or rely on the onAuthStateChanged listener for Google auth.

    const token = localStorage.getItem("token");

    if (token) {
      console.log(
        "AppContent.js: handleSuccessfulAuth: Found JWT after login. Attempting to validate..."
      );
      setAuthToken(token);
      try {
        const res = await axios.get("http://localhost:5000/api/auth/user");
        // If JWT valid, set user data from backend response
        setCurrentUser(res.data); // This should contain name/email from DB
        console.log(
          "AppContent.js: handleSuccessfulAuth: Successfully loaded user from JWT.",
          res.data
        );
        // Navigation to dashboard will be handled by the router based on isAuthenticated becoming true
      } catch (err) {
        console.error(
          "AppContent.js: handleSuccessfulAuth: JWT validation failed after login:",
          err
        );
        localStorage.removeItem("token");
        setAuthToken(null);
        setCurrentUser(null); // Ensure state is null if JWT is invalid
        console.log(
          "AppContent.js: handleSuccessfulAuth: Invalid JWT cleared after login."
        );
        // Navigation to login will be handled by the router based on isAuthenticated becoming false
      }
    } else if (auth.currentUser) {
      // If no JWT, but Firebase user exists (Google login handled by listener)
      console.log(
        "AppContent.js: handleSuccessfulAuth: No JWT, but Firebase user exists."
      );
      // The onAuthStateChanged listener should have already set the state.
      // Navigation to dashboard will be handled by the router based on isAuthenticated becoming true
    } else {
      // Neither JWT nor Firebase user found after successful auth? (Unexpected)
      console.log(
        "AppContent.js: handleSuccessfulAuth: Neither JWT nor Firebase user found."
      );
      setCurrentUser(null); // Ensure state is null
      // Navigation to login will be handled by the router
    }
  };

  const handleProfileSave = (savedProfileData) => {
    console.log("AppContent.js: Profile saved successfully!", savedProfileData);
    // Update the currentUser state with the newly saved profile data
    setCurrentUser((prevUser) => ({
      ...prevUser,
      ...savedProfileData,
      // Make sure to spread savedProfileData as it should contain the updated profile fields
      // Ensure savedProfileData from backend response includes all relevant fields (name, email, etc.) or merge carefully
      // If backend response only sends updated fields, merge specifically:
      // teachSkills: savedProfileData.teachSkills,
      // learnSkills: savedProfileData.learnSkills,
      // bio: savedProfileData.bio,
      // photo: savedProfileData.photo || prevUser.photo, // Keep existing photo if not updated
    }));
    console.log("AppContent.js: currentUser state updated after profile save.");
  };

  // Handle combined logout
  const handleLogout = async () => {
    console.log("AppContent.js: Attempting logout...");
    console.log(
      "AppContent.js: State BEFORE logout: isAuthenticated:",
      isAuthenticated,
      "currentUser:",
      currentUser
    );

    // Set the logging out flag
    isLoggingOut.current = true;
    console.log("AppContent.js: Setting isLoggingOut.current to true.");

    // Clear Firebase session (if logged in via Google)
    if (auth.currentUser) {
      // Use auth.currentUser to check Firebase login state
      console.log("AppContent.js: Signing out from Firebase...");
      try {
        await firebaseSignOut(auth);
        console.log("AppContent.js: Firebase signed out.");
      } catch (error) {
        console.error("AppContent.js: Error during Firebase signOut:", error);
      }
    }

    // Clear JWT from localStorage and axios headers
    console.log("AppContent.js: Clearing JWT...");
    localStorage.removeItem("token");
    setAuthToken(null);
    console.log("AppContent.js: JWT cleared.");

    // Reset authentication state immediately and synchronously
    console.log("AppContent.js: Resetting state...");
    setCurrentUser(null); // Clear the currentUser
    // isAuthenticated will become false because currentUser is null
    console.log("AppContent.js: State reset: currentUser=null.");

    // Explicitly navigate to the login page after state reset
    console.log("AppContent.js: Navigating to /login...");
    navigate("/login");
    console.log("AppContent.js: navigate('/login') called.");
    console.log(
      "AppContent.js: State AFTER logout and navigate: isAuthenticated:",
      !!currentUser,
      "currentUser:",
      currentUser
    ); // Log state immediately after update

    // The isLoggingOut flag will be reset by the onAuthStateChanged listener the next time it fires.
  };

  if (loading) {
    console.log("AppContent.js: Rendering Loading state...");
    return <div>Checking authentication status...</div>;
  }

  console.log(
    "AppContent.js: Final Render Check BEFORE Routes: isAuthenticated:",
    isAuthenticated,
    "currentUser:",
    currentUser
  );

  return (
    <div className="App">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Launch />} />
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" />
            ) : (
              <Login onLogin={handleSuccessfulAuth} />
            )
          }
        />

        {/* Protected Routes */}
        <Route
          path="/create-profile"
          element={
            isAuthenticated ? (
              <ProfileForm user={currentUser} onSave={handleProfileSave} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <Dashboard user={currentUser} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/profile/:userId"
          element={
            isAuthenticated ? (
              <ProfileDetails currentUser={currentUser} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/chat/:recipientId"
          element={
            isAuthenticated ? (
              <Chat currentUser={currentUser} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Fallback for any other path - redirect to login if not authenticated, else dashboard */}
        <Route
          path="*"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
