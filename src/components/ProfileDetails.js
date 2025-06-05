import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../styles/profileDetails.css";
import { useNavigate } from "react-router-dom";
import Chat from "./Chat";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

function ProfileDetails({ currentUser }) {
  // Receive currentUser prop
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [showChatPopup, setShowChatPopup] = useState(false);

  useEffect(() => {
    console.log("ProfileDetails.js: useEffect triggered.");
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        let profileData;
        if (userId) {
          console.log(
            `ProfileDetails.js: userId found in URL: ${userId}. Attempting to fetch profile by ID.`
          );
          const profileUrl = `${BACKEND_URL}/api/users/${userId}`;
          console.log(
            "ProfileDetails.js: Fetching profile from URL:",
            profileUrl
          );
          const res = await axios.get(profileUrl);
          profileData = res.data;
          console.log(
            "ProfileDetails.js: Profile fetched successfully by ID.",
            profileData
          );
        } else if (currentUser) {
          console.log(
            "ProfileDetails.js: No userId in URL, using currentUser prop:",
            currentUser.id
          );

          profileData = currentUser;
          console.log(
            "ProfileDetails.js: Using currentUser prop for profile data.",
            profileData
          );
        } else {
          console.error(
            "ProfileDetails.js: No user ID in URL and no current user provided. Cannot display profile."
          );
          setError("No user profile to display.");
          setLoading(false);
          return;
        }

        if (profileData) {
          setProfile(profileData);
          console.log("ProfileDetails.js: Profile state set.");
        } else {
          setError("User profile data is empty.");
          console.error("ProfileDetails.js: Fetched profile data was empty.");
        }
      } catch (err) {
        console.error(
          "ProfileDetails.js: Error fetching or setting profile:",
          err
        );
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
        console.log("ProfileDetails.js: Loading set to false.");
      }
    };

    if (userId || currentUser) {
      fetchProfile();
    } else {
      // If neither is available initially, set loading to false and show error (should be rare with protected routes)
      console.log(
        "ProfileDetails.js: Neither userId nor currentUser available initially."
      );
      setLoading(false);
      setError("No user information to display profile.");
    }
  }, [userId, currentUser]); // Keep userId and currentUser as dependencies

  const handleChat = () => {
    console.log("ProfileDetails.js: Chat button clicked.");
    if (!profile || !profile._id) {
      console.error(
        "ProfileDetails.js: Cannot initiate chat, profile or profile._id is missing."
      );
      alert("Cannot initiate chat at this time.");
      return; 
    }

    if (currentUser) {
      console.log(
        "ProfileDetails.js: Current user is authenticated. Proceeding to show chat."
      );
      setShowChatPopup(true); // Set state to show the pop-up
    } else {
      console.log(
        "ProfileDetails.js: Current user not authenticated. Cannot show chat."
      );
      alert("Please log in to start a chat.");
    }
  };

  const handleCloseChat = () => {
    console.log("ProfileDetails.js: Closing chat pop-up.");
    setShowChatPopup(false); // Set state to hide the pop-up
  };

  if (loading) {
    return <div className="profile-details-loading">Loading profile...</div>;
  }

  if (error) {
    return <div className="profile-details-error">Error: {error}</div>;
  }

  // If profile is null after loading and no error
  if (!profile) {
    return (
      <div className="profile-details-error">
        Profile not found or failed to load.
      </div>
    );
  }

  return (
    <div className="profile-details-container">
      <div className="profile-details-content-wrapper">
        <div className="profile-details-header">
          {profile.photo ? (
            <img
              src={profile.photo}
              alt={`${profile.name}'s profile`}
              className="profile-details-avatar"
            />
          ) : (
            <div className="profile-details-avatar">
              {profile.name ? profile.name.charAt(0).toUpperCase() : "?"}
            </div>
          )}
          <h2 className="profile-details-name">{profile.name || "No Name"}</h2>
        </div>

        {/* Profile Sections */}
        <div className="profile-details-sections">
          <div className="profile-details-section">
            <h3>
              <strong>Teaches:</strong>
            </h3>
            {profile.teachSkills && profile.teachSkills.length > 0 ? (
              <ul>
                {profile.teachSkills.map((skill, index) => (
                  <li key={index}>{skill}</li>
                ))}
              </ul>
            ) : (
              <p>No teaching skills listed.</p>
            )}
          </div>

          <div className="profile-details-section">
            <h3>
              <strong>Wants to learn:</strong>
            </h3>
            {profile.learnSkills && profile.learnSkills.length > 0 ? (
              <ul>
                {profile.learnSkills.map((skill, index) => (
                  <li key={index}>{skill}</li>
                ))}
              </ul>
            ) : (
              <p>No learning skills listed.</p>
            )}
          </div>

          <div className="profile-details-section">
            <h3>
              <strong>Bio:</strong>
            </h3>
            {profile.bio ? <p>{profile.bio}</p> : <p>No bio provided.</p>}
          </div>
        </div>

        {currentUser && profile._id && currentUser._id !== profile._id && (
          <button onClick={handleChat} className="chat-profile-button">
            Chat with {profile.name ? profile.name.split(" ")[0] : "User"}
          </button>
        )}
      </div>

      {/* Chat Pop-up */}
      {showChatPopup && profile && profile._id && (
        <div className="chat-popup-container">
          <Chat
            currentUser={currentUser}
            recipientId={profile._id}
            onClose={handleCloseChat}
          />
        </div>
      )}
    </div>
  );
}

export default ProfileDetails;
