import axios from "axios";

// Function to set or remove the authentication token in axios headers
const setAuthToken = (token) => {
  if (token) {
    // Apply authorization token to every request if logged in
    axios.defaults.headers.common["x-auth-token"] = token;
  } else {
    // Delete auth header
    delete axios.defaults.headers.common["x-auth-token"];
  }
};

export default setAuthToken;
