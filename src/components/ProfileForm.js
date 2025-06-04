import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/profileForm.css";

function ProfileForm({ currentUser, onProfileSave }) {
  const [formData, setFormData] = useState({
    teachSkills: currentUser?.teachSkills || [],
    learnSkills: currentUser?.learnSkills || [],
    bio: currentUser?.bio || "",
  });

  useEffect(() => {
    if (currentUser) {
      setFormData({
        teachSkills: currentUser.teachSkills || [],
        learnSkills: currentUser.learnSkills || [],
        bio: currentUser.bio || "",
      });
    }
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSkillsChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value.split(",").map((s) => s.trim()) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const profileDataToSend = {
      ...formData,
      firebaseUid: currentUser.uid,
    };

    console.log(
      "Attempting to send profile data for update:",
      profileDataToSend
    );

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No authentication token found in localStorage.");
        alert("Authentication error: Please log in again.");
        return;
      }

      const res = await axios.post(
        "http://localhost:5000/api/users",
        profileDataToSend,
        {
          headers: {
            "x-auth-token": token,
          },
        }
      );
      console.log("Profile saved successfully:", res.data);
      onProfileSave(res.data);
      alert("Profile saved successfully!");
    } catch (err) {
      console.error(
        "Error saving profile from frontend:",
        err.response?.data || err.message
      );
      alert(
        "Sorry for the inconvenience, there was an error saving your data. Please try again."
      );
    }
  };

  return (
    <div className="profile-form-container">
      <h2>Complete Your Profile</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="teachSkills">
            Skills to Teach (comma separated):
          </label>
          <input
            type="text"
            id="teachSkills"
            name="teachSkills"
            placeholder="e.g., JavaScript, React, Node.js"
            value={
              Array.isArray(formData.teachSkills)
                ? formData.teachSkills.join(", ")
                : formData.teachSkills
            }
            onChange={handleSkillsChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="learnSkills">
            Skills to Learn (comma separated):
          </label>
          <input
            type="text"
            id="learnSkills"
            name="learnSkills"
            placeholder="e.g., TypeScript, GraphQL, Python"
            value={
              Array.isArray(formData.learnSkills)
                ? formData.learnSkills.join(", ")
                : formData.learnSkills
            }
            onChange={handleSkillsChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="bio">Short Bio:</label>
          <textarea
            id="bio"
            name="bio"
            placeholder="Tell us about yourself..."
            value={formData.bio}
            onChange={handleChange}
          />
        </div>
        <button type="submit">Save Profile</button>
      </form>
    </div>
  );
}

export default ProfileForm;
