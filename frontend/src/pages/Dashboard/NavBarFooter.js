import React from 'react';
import '../../styles/test_dash.css'; // Your CSS file
import { apiRequest } from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function NavBarFooter() {
  const { logout } = useAuth();
  const navigate = useNavigate(); 
  
    const handleLogOut = async () => {
      await logout();
      navigate('/');
    };
     
  return (
    <div>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-container">
          <div className="logo">Smart Parking</div>
          <div className="nav-links">
            <button className="nav-button profile-button">Profile</button>
            <button className="nav-button log-out-button" onClick={handleLogOut}>Log Out</button>
          </div>
        </div>
      </nav>

      {/* Footer */}
      <footer className="footer">
        &copy; 2025 Smart Parking. All rights reserved.
      </footer>
    </div>
  );
}

export default NavBarFooter;
