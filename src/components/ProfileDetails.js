import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; // To get userId from URL
import axios from "axios";
import "../styles/profileDetails.css"; // Import the CSS file
import { useNavigate } from "react-router-dom";

function ProfileDetails({ currentUser }) {
  // Receive currentUser prop
  const { userId } = useParams(); // Get userId from URL params
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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
          // Fetch profile by ID if userId is in the URL
          // Make sure this backend route is correctly implemented to find by MongoDB _id
          const profileUrl = `http://localhost:5000/api/users/${userId}`; // **Corrected URL with port 5000**
          console.log(
            "ProfileDetails.js: Fetching profile from URL:",
            profileUrl
          ); // Log the exact URL
          const res = await axios.get(profileUrl); // Use the variable
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
          // If no userId in URL, display the current logged-in user's profile
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

    // Only fetch if userId is present OR currentUser is available
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

    // Depend on userId and currentUser to refetch if they change
    // Only depend on currentUser.id if you need to refetch when *the* current user changes, not just their data
  }, [userId, currentUser]); // Keep userId and currentUser as dependencies

  const handleChat = () => {
    console.log("ProfileDetails.js: Chat button clicked.");
    if (profile && profile._id) {
      console.log(
        "ProfileDetails.js: Navigating to chat with user:",
        profile._id
      );
      // Navigate to the chat route, passing the profile user's ID as the recipientId
      navigate(`/chat/${profile._id}`);
    } else {
      console.error(
        "ProfileDetails.js: Cannot initiate chat, profile or profile._id is missing."
      );
      alert("Cannot initiate chat at this time.");
    }
  };

  if (loading) {
    return <div className="profile-details-loading">Loading profile...</div>;
  }

  if (error) {
    return <div className="profile-details-error">Error: {error}</div>;
  }

  // If profile is null after loading and no error, handle this case
  if (!profile) {
    return (
      <div className="profile-details-error">
        Profile not found or failed to load.
      </div>
    );
  }

  return (
    <div className="profile-details-container">
      <div className="profile-details-header">
        {/* Display profile photo if available, otherwise a placeholder */}
        {profile.photo ? (
          <img
            src={profile.photo}
            alt={`${profile.name}'s profile`}
            className="profile-details-avatar"
          />
        ) : (
          <div className="profile-details-avatar">
            {profile.name ? profile.name.charAt(0).toUpperCase() : "?"}
          </div> // Uppercase initial
        )}
        <h2 className="profile-details-name">{profile.name || "No Name"}</h2>
      </div>

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

      {/* Add more profile details here as needed */}

      {/* Only show chat button if viewing another user's profile */}
      {currentUser && profile._id && currentUser._id !== profile._id && (
        <button onClick={handleChat}>
          Chat with {profile.name ? profile.name.split(" ")[0] : "User"}
        </button>
      )}

      {/* Optional: Add a back button */}
      {/* <button onClick={() => navigate(-1)}>Back</button> */}
    </div>
  );
}

export default ProfileDetails;
