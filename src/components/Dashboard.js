import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

function Dashboard({ user, initiateLogout }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [currentUserProfileExists, setCurrentUserProfileExists] =
    useState(false);
  const navigate = useNavigate();
  const [showTeach, setShowTeach] = useState(true); // State for toggle

  useEffect(() => {
    console.log("Dashboard.js: Fetching all users.");
    axios
      .get(`${BACKEND_URL}/api/users`)
      .then((res) => {
        console.log("Dashboard.js: Users fetched successfully.", res.data);
        setUsers(res.data);
      })
      .catch((err) =>
        console.error("Dashboard.js: Error fetching all users:", err)
      );
  }, []);

  useEffect(() => {
    if (user && user.uid) {
      console.log(
        "Dashboard.js: Checking current user profile existence for UID:",
        user.uid
      );
      axios
        .get(`${BACKEND_URL}/api/users/by-google-id/${user.uid}`)
        .then((res) => {
          console.log("Dashboard.js: Current user profile found.", res.data);
          setCurrentUserProfileExists(true);
        })
        .catch((err) => {
          if (err.response && err.response.status === 404) {
            console.log("Dashboard.js: Current user profile not found (404).");
            setCurrentUserProfileExists(false);
          } else {
            console.error(
              "Dashboard.js: Error checking current user profile existence:",
              err
            );
            setCurrentUserProfileExists(false);
          }
        });
    }
  }, [user]);

  // Filter users based on search query and toggle state
  const filteredUsers = users.filter((user) => {
    // Provide a default empty array if teachSkills or learnSkills is null or undefined
    const teachSkills = user.teachSkills || [];
    const learnSkills = user.learnSkills || [];

    const skillsToSearch = showTeach ? teachSkills : learnSkills;
    const skillsMatch = skillsToSearch
      .join(",")
      .toLowerCase()
      .includes(search.toLowerCase());

    const nameMatch =
      typeof user.name === "string" &&
      user.name.toLowerCase().includes(search.toLowerCase());

    return skillsMatch || nameMatch;
  });

  const handleLogout = async () => {
    try {
      console.log("Dashboard.js: Calling initiateLogout from AppContent.");
      await initiateLogout(); 
       console.log("Dashboard.js: initiateLogout finished.");
    } catch (error) {
      console.error("Dashboard.js: Error during logout:", error);
      alert(error.message);
    }
  };

  const handleCreateProfile = () => {
    console.log("Creating profile...");
    navigate("/create-profile");
  };

  const handleViewProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="logo">Welcome to SkillSwap, {user.name} </div>{" "}
        {/* Add logo/app name */}
        <div className="header-right">
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
          {/* Assuming Edit/Create profile button remains in the header */}
          <button
            className="profile-button"
            title={
              currentUserProfileExists
                ? "Edit your profile"
                : "Create your profile"
            }
            onClick={handleCreateProfile}
          >
            {currentUserProfileExists
              ? "Edit your profile"
              : "Create your profile"}
          </button>
        </div>
      </header>

      {/* Skill Recommendations Section */}
      <div className="recommendations-section">
        <h2 className="recommendations-title">Skill Recommendations</h2>

        {/* Teach/Learn Toggle and Search */}
        <div className="controls">
          <div className="toggle-switch">
            <button
              className={`toggle-button ${showTeach ? "active" : ""}`}
              onClick={() => setShowTeach(true)}
            >
              Teach
            </button>
            <button
              className={`toggle-button ${!showTeach ? "active" : ""}`}
              onClick={() => setShowTeach(false)}
            >
              Learn
            </button>
          </div>
          <input
            className="search-input"
            type="text"
            placeholder={`Search ${
              showTeach ? "teach" : "learn"
            } skills or name...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* User Grid */}
        <div className="user-grid">
          {filteredUsers.map((user) => (
            <div key={user._id} className="user-card">
              <div className="user-card-header">
                <img className="user-photo" src={user.photo} alt={user.name} />
                <div className="user-card-info">
                  <strong className="user-name">{user.name}</strong>
                  {/* Add placeholder for stars/rating if needed later */}
                </div>
              </div>
              <div className="user-card-skills">
                <div className="skills-teach">
                  <strong>Teaches:</strong> {user.teachSkills.join(", ")}
                </div>
                <div className="skills-learn">
                  <strong>Wants to learn:</strong> {user.learnSkills.join(", ")}
                </div>
              </div>
              <div className="user-card-bio">
                <strong>Bio:</strong> {user.bio}
              </div>
              <button
                className="view-profile-button"
                onClick={() => handleViewProfile(user._id)}
              >
                View Profile
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
