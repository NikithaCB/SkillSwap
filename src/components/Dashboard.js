import React, { useEffect, useState } from "react";
import axios from "axios";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../utils/firebase";
import '../styles/dashboard.css';


function Dashboard({ user }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [currentUserProfileExists, setCurrentUserProfileExists] =
    useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/users")
      .then((res) => setUsers(res.data))
      .catch((err) => console.error("Error fetching all users:", err));
  }, []);

  useEffect(() => {
    if (user && user.uid) {
      axios
        .get(`http://localhost:5000/api/users/by-google-id/${user.uid}`)
        .then((res) => {
          setCurrentUserProfileExists(true);
        })
        .catch((err) => {
          if (err.response && err.response.status === 404) {
            setCurrentUserProfileExists(false);
          } else {
            console.error(
              "Error checking current user profile existence:",
              err
            );
            setCurrentUserProfileExists(false);
          }
        });
    }
  }, [user]);

  const filteredUsers = users.filter(
    (user) =>
      user.teachSkills.join(",").toLowerCase().includes(search.toLowerCase()) ||
      user.learnSkills.join(",").toLowerCase().includes(search.toLowerCase())
  );

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
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
      <h2 className="dashboard-title">Welcome, {user.name}</h2>
      <input
        className="search-input"
        type="text"
        placeholder="Search skills..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <button onClick={handleLogout} className="logout-button">Logout</button>
      <button className="profile-button"
        title={
          currentUserProfileExists ? "Edit your profile" : "Create your profile"
        }
        onClick={handleCreateProfile}
      >
        {currentUserProfileExists ? "Edit your profile" : "Create your profile"}
      </button>
      <ul className="user-list">
        {filteredUsers.map((user) => (
          <li 
            key={user._id}
            onClick={() => handleViewProfile(user._id)}
            style={{ cursor: "pointer" }}
            className="user-list-item"
          >
            <img className="user-photo" src={user.photo} alt={user.name} width={40} />
            <strong className="user-name">{user.name}</strong>
            <div className="user-info"> <strong>Teaches:</strong> {user.teachSkills.join(", ")}</div>
            <div className="user-info"> <strong>Wants to learn:</strong> {user.learnSkills.join(", ")}</div>
            <div className="user-info"> <strong>Bio:</strong> {user.bio}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Dashboard;
