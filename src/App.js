import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import AppContent from "./AppContent"; // Import the extracted AppContent component

// Main App component that renders the Router and AppContent
function App() {
  return (
    <Router>
      <AppContent /> {/* Render the extracted AppContent component */}
    </Router>
  );
}

export default App;
