import { apiRequest } from '../utils/api';

import React, { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';
import '../styles/registration.css';

function RegistrationPage() {
  const [aptNumber, setAptNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [retypePassword, setRetypePassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');
  const [passwordFeedback, setPasswordFeedback] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    evaluatePasswordStrength(value);
  };

  const evaluatePasswordStrength = (value) => {
    const hasUppercase = /[A-Z]/.test(value);
    const hasLowercase = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    const length = value.length;

    if (length < 8) {
      setPasswordStrength('weak');
      setPasswordFeedback('Password must be at least 8 characters long.');
    } else if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
      setPasswordStrength('weak');
      setPasswordFeedback('Password must include an uppercase letter, a lowercase letter, a number, and a special character.');
    } else {
      setPasswordStrength('strong');
      setPasswordFeedback('Password is strong.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    console.log(aptNumber, email, phoneNumber, password, retypePassword);

    if (password !== retypePassword) {
      setError("Passwords don't match!");
      return;
    }

    try {
      const response = await apiRequest('/register', 'POST', {
        aptNumber,
        email,
        phoneNumber,
        password
      });

      if (response.status === 200 || response.status === 201) {
        navigate('/');
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2 className="title">Smart Parking System</h2>
        <p className="subtitle">Create New Login</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label" htmlFor="aptNumber">Apt Number</label>
            <input
              id="aptNumber"
              type="text"
              value={aptNumber}
              onChange={(e) => setAptNumber(e.target.value)}
              className="input"
              required
            />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              required
            />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="phoneNumber">Phone Number (optional)</label>
            <input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="input"
            />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="password">Create Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              className="input"
              required
            />
            {password && <p className={`password-feedback ${passwordStrength}`}>{passwordFeedback}</p>}
          </div>
          <div className="form-group">
            <label className="label" htmlFor="retypePassword">Retype Password</label>
            <input
              id="retypePassword"
              type="password"
              value={retypePassword}
              onChange={(e) => setRetypePassword(e.target.value)}
              className="input"
              required
            />
          </div>
          {error && <p className="error">{error}</p>}

          <button className="button" type="submit" disabled={passwordStrength !== 'strong' || password !== retypePassword}>
            Submit
          </button>
        </form>

        <div className="links-container">
          <p>Already have an account? <Link to="/">Login</Link></p>
        </div>
      </div>
    </div>
  );
}

export default RegistrationPage;
