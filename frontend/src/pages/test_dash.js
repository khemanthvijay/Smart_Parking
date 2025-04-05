import React, { useState } from 'react';
import '../styles/test_dash.css';

function Dash() {
  const [showProfileOptions, setShowProfileOptions] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [selectedOption, setSelectedOption] = useState('');

  const handleProfileClick = () => {
    setShowProfileOptions(!showProfileOptions);
  };

  const handleOptionClick = (option) => {
    setSelectedOption(option);
    setShowPanel(true);
  };

  const handlePanelClose = () => {
    setShowPanel(false);
  };

  return (
    <div className="app">
      {/* Navigation Bar */}
      <nav className="nav">
        <div className="nav-left">
          <span className="nav-title">Smart Parking</span>
        </div>
        <div className="nav-right">
          <button className="nav-profile-button" onClick={handleProfileClick}>Profile</button>
          {showProfileOptions && (
            <div className="nav-profile-options">
              <button className="nav-profile-option">Change Password</button>
              <button className="nav-profile-option">Change Email</button>
              <button className="nav-profile-option">Logout</button>
            </div>
          )}
        </div>
      </nav>

      {/* Sidebar */}
      <div className="sidebar">
        <ul>
          <li>
            <button className="sidebar-button" onClick={() => handleOptionClick('Guest')}>Guest</button>
          </li>
          <li>
            <button className="sidebar-button" onClick={() => handleOptionClick('Manage Devices')}>Manage Devices</button>
          </li>
          <li>
            <button className="sidebar-button" onClick={() => handleOptionClick('Settings')}>Settings</button>
          </li>
        </ul>
      </div>

      {/* Hero Section */}
      <main className="hero">
        <h2 className="hero-title">{selectedOption}</h2>
        {showPanel && (
          <div className="panel">
            <button className="panel-close" onClick={handlePanelClose}>Close</button>
            {selectedOption === 'Guest' && (
              <div>
                <h3>Guest Options</h3>
                <p>View guest information</p>
              </div>
            )}
            {selectedOption === 'Manage Devices' && (
              <div>
                <h3>Manage Devices</h3>
                <p>View and manage devices</p>
              </div>
            )}
            {selectedOption === 'Settings' && (
              <div>
                <h3>Settings</h3>
                <p>View and change settings</p>
              </div>
            )}
            {selectedOption === 'Manage Users' && (
              <div>
                <h3>Manage Users</h3>
                <p>View and manage users</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default Dash;