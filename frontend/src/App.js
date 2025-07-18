import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import DubMyYT from "./DubMyYt";
import LandingPage from "./components/LandingPage";
import AuthPage from "./components/Auth/AuthPage";
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './components/Dashboard/Dashboard';

const AppContent = () => {
  const location = useLocation();
  const { mode } = location.state || {};

  return (
    <div className="app-container">
      {mode === 'subtitles-only' ? (
        // Show only subtitle generation UI
        <div className="container">
          <h2>Generate Subtitles</h2>
          <div className="input-wrapper">
            <input 
              type="text" 
              className="input-box" 
              placeholder="Enter YouTube URL"
            />
          </div>
          <p className="or-text">OR</p>
          <input 
            type="file" 
            className="file-input" 
            accept="audio/*,video/*" 
          />
          <select className="dropdown">
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            {/* Add more language options */}
          </select>
          <button className="submit-button">Generate Subtitles</button>
        </div>
      ) : (
        // Show all features UI
        <div className="nav-drawer">
          {/* Your existing navigation options */}
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/app" element={
          <ProtectedRoute>
            <DubMyYT />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/app-content" element={<AppContent />} />
      </Routes>
    </Router>
  );
}

export default App;


