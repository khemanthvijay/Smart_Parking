import React, { useState } from 'react';
import { apiRequest } from '../../utils/api';
import '../../styles/Guest.css';

export default function GuestSetPassword({ guestID }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSetPassword = async (e) => {
    e.preventDefault();
    console.log(guestID)
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    try {
      const response = await apiRequest('/guest/set-password', 'POST', {
        guestID,
        password,
        confirmPassword
      });
      setMessage(response.data.message);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || "Failed to set password.");
      setMessage('');
    }
  };

  return (
    <div className="guest-set-password">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Set Your Password</h2>
          <p>Your Guest ID: <strong>{guestID}</strong></p>
        </div>
        <div className="card-content">
          <form onSubmit={handleSetPassword} className="form">
            <div className="form-group">
              <label htmlFor="password">New Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Retype Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <p className="instructions">Do not refresh or press back during this process.</p>
            <button type="submit">Submit</button>
          </form>
          {error && <div className="error-messages"><p>{error}</p></div>}
          {message && <div className="confirmation-message"><p>{message}</p></div>}
        </div>
      </div>
    </div>
  );
}
