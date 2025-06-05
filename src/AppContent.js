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
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import ProfileForm from "./components/ProfileForm";
import ProfileDetails from "./components/ProfileDetails";
import Chat from "./components/Chat";
import Launch from "./components/Launch";

// This component will contain the routing and auth logic
function AppContent() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isLoggingOut = useRef(false);
  const navigate = useNavigate();

  const BACKEND_URL =
    process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

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
          const res = await axios.get(`${BACKEND_URL}/api/auth/user`);
          // If JWT valid, set user data from backend response
          setCurrentUser(res.data);
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

      return () => unsubscribe();
    };

    checkAuthStatus();
  }, []);

  // Determine isAuthenticated based on the presence of currentUser
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

    const token = localStorage.getItem("token");

    if (token) {
      console.log(
        "AppContent.js: handleSuccessfulAuth: Found JWT after login. Attempting to validate..."
      );
      setAuthToken(token);
      try {
        const res = await axios.get(`${BACKEND_URL}/api/auth/user`);

        setCurrentUser(res.data);
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

    // Clear currentUser state
    console.log("AppContent.js: Clearing currentUser state.");
    setCurrentUser(null);

    // Navigation should happen automatically because currentUser becomes null
    // and routes will redirect to /login
    console.log("AppContent.js: Navigation to login handled by router.");

    // Reset the logging out flag after clearing state and storage
    isLoggingOut.current = false;
    console.log("AppContent.js: Reset isLoggingOut.current to false.");
  };

  // This effect handles navigation based on authentication status and loading state.
  useEffect(() => {
    console.log(
      "AppContent.js: Navigation useEffect triggered. loading:",
      loading,
      "isAuthenticated:",
      isAuthenticated
    );
    // Wait until initial loading is complete to decide where to navigate.
    if (!loading) {
      if (isAuthenticated) {
        console.log(
          "AppContent.js: Navigation useEffect: User is authenticated, navigating to dashboard."
        );
        // User is authenticated, navigate to dashboard.
        // Check if already on dashboard to avoid infinite loop
        if (window.location.pathname === "/login") {
          navigate("/dashboard");
        }
      } else {
        console.log(
          "AppContent.js: Navigation useEffect: User is not authenticated, navigating to login."
        );
        // User is not authenticated, navigate to login.
        // Check if already on login to avoid infinite loop
        if (window.location.pathname !== "/login") {
          navigate("/login");
        }
      }
    } else {
      console.log(
        "AppContent.js: Navigation useEffect: Still loading, not navigating."
      );
    }
    // Depend on loading and isAuthenticated state changes
  }, [loading, isAuthenticated, navigate]); // Include navigate in dependencies as recommended by hooks rules

  // Optional: Render a loading spinner or placeholder while loading is true
  if (loading) {
    console.log("AppContent.js: Rendering loading spinner.");
    return <div className="loading-spinner">Loading...</div>; // Replace with a real spinner component
  }

  return (
    <Routes>
      <Route path="/" element={<Launch />} />
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" />
          ) : (
            <Login onSuccessfulAuth={handleSuccessfulAuth} />
          )
        }
      />
      <Route
        path="/dashboard"
        element={
          isAuthenticated ? (
            <Dashboard user={currentUser} initiateLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/create-profile"
        element={
          isAuthenticated ? (
            <ProfileForm
              currentUser={currentUser}
              onProfileSave={handleProfileSave}
            />
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
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default AppContent;
