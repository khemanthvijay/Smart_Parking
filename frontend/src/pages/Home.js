import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Home.css';

function Home() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); // Default to "user"
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    console.log(identifier, password, role);

    
    let payload;
    if (role === 'user') {
      payload = { aptNumber: parseInt(identifier), password };
    } else {
      payload = { username: identifier, password };
    }
    // "Payload" here is simply the object sent in the request body.
    const result = await login(payload);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2 className="title">Login</h2>
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="label" htmlFor="identifier">
              {role === 'user' ? 'Apartment Number' : 'Username'}
            </label>
            <input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
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
          <div className="form-group">
            <label className="label" htmlFor="role">Login As</label>
            <select 
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="input"
            >
              <option value="user">User (Apartment Number)</option>
              <option value="admin">Admin (Username)</option>
              <option value="management">Management (Username)</option>
            </select>
          </div>
          {error && <p className="error">{error}</p>}
          <button className="button" type="submit">Login</button>
        </form>

        <div className="links-container">
          <Link to="/registration" className="link">New User? Register Here</Link>
          <div className="secondary-links">
            <a href="/forgot-password" className="secondary-link">Forgot Password?</a>
            {' | '}
            <Link to="/guest" className="secondary-link">Continue as Guest</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
