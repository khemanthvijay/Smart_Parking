import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/Home.css';
import GuestParkingRegistration from './GuestRegister';
import { useAuth } from '../../contexts/AuthContext';

function GuestHome() {
  const { GuestLogin } = useAuth();
  const [guestIdentifier, setGuestIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showRegistration, setShowRegistration] = useState(false);
  const navigate = useNavigate();

  const handleGuestLogin = async (e) => {
    e.preventDefault();
    setError('');
    const payload = { guestIdentifier, password };
    const result = await GuestLogin(payload);
    if (result.success) {
      navigate('/guest-dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="container">
      {showRegistration ? (
        <GuestParkingRegistration />
      ) : (
        <div className="card">
          <h2 className="title">Guest Login</h2>
          <form onSubmit={handleGuestLogin}>
            <div className="form-group">
              <label className="label" htmlFor="guestIdentifier">Guest ID</label>
              <input
                id="guestIdentifier"
                type="text"
                value={guestIdentifier}
                onChange={(e) => setGuestIdentifier(e.target.value)}
                className="input"
                required
              />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                required
              />
            </div>
            {error && <p className="error">{error}</p>}
            <button className="button" type="submit">Login</button>
          </form>
          <div className="links-container">
            <button className="link-button" onClick={() => setShowRegistration(true)}>
              New Guest? Register Here
            </button>
            <div className="secondary-links">
              <a href="/guest/forgot-password" className="secondary-link">Forgot Password?</a>
              {' | '}
              <Link to="/" className="secondary-link">Already a User? Login Here</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GuestHome;
