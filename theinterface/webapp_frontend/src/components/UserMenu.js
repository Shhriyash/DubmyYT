import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/config';
import './UserMenu.css';

const UserMenu = ({ userEmail }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleDashboard = () => {
    // Navigate to dashboard or perform dashboard action
    console.log('Navigate to dashboard');
    setIsOpen(false);
  };

  // Get user initials for avatar
  const getUserInitials = (email) => {
    if (!email) return '?';
    return email.charAt(0).toUpperCase();
  };

  return (
    <div className="user-menu-container">
      <button 
        className="user-icon"
        onClick={() => setIsOpen(!isOpen)}
      >
        {getUserInitials(userEmail)}
      </button>
      
      {isOpen && (
        <div className="dropdown-menu">
          <div className="user-info">
            <span className="user-email">{userEmail}</span>
          </div>
          <button 
            className="dropdown-item"
            onClick={handleDashboard}
          >
            My Dashboard
          </button>
          <button 
            className="dropdown-item logout"
            onClick={handleSignOut}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
