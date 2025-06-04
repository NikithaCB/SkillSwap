import React from "react";
import "../styles/LoginUI.css";

function LoginUI() {
  return (
    <div className="login-container">
      <div className="login-content">
        <h1>Skill Swap Login</h1>
        <p>From Skill to Skill, Let's Make the Swap!</p>

        <button className="google-login-button">
          <img
            src="https://img.icons8.com/color/16/000000/google-logo.png"
            alt="Google logo"
            className="google-icon"
          />
          Login with Google
        </button>

        <div className="or-separator">OR</div>

        <input type="email" placeholder="Email" className="login-input" />
        <input type="password" placeholder="Password" className="login-input" />

        <button className="login-button">Login</button>

        <button className="signup-button">Sign Up</button>
      </div>
    </div>
  );
}

export default LoginUI;
