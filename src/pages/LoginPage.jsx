import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
// import '../styles/login.css';
import { FaBreadSlice } from 'react-icons/fa';

const API_BASE_URL = 'http://10.116.242.21:5000/api/auth'; // Our backend API base URL

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        username,
        password,
      });

      // Check for successful login
      if (response.data && response.data.token) {
        // Store the token and user role
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userRole', response.data.role);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Redirect based on the user's role
        switch (response.data.role) {
          case 'admin':
            navigate('/dashboard');
            break;
          case 'sales':
            navigate('/pos');
            break;
          case 'baker':
            navigate('/production');
            break;
          default:
            navigate('/dashboard'); // Default to dashboard for other roles
        }
      } else {
        setError('Invalid response from server.');
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('An error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="logo-container">
          <FaBreadSlice className="logo-icon" />
          <h1>Purple Premium Bread</h1>
          <p>POS & Production System</p>
        </div>
        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="login-btn">
            Log In
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;