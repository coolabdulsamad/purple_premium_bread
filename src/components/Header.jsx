import React, { useEffect, useState } from 'react';
import { FaBars, FaUserCircle } from 'react-icons/fa';
import '../assets/styles/header.css';
import { ASSETS } from '../assets';
import axios from 'axios';

const API_BASE_URL = 'https://purple-premium-bread-backend.onrender.com/api';

const Header = ({ toggleSidebar }) => {

  // const { isAuthenticated } = { isAuthenticated: true }; // Placeholder for actual auth logic
  const [userName, setUserName] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUserName = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        setError('Not authenticated.');
        setLoading(false);
        return;
    }
    setLoading(true);
    try {
        const response = await axios.get(`${API_BASE_URL}/users/me`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        setUserName(response.data);
        setLoading(false);
    } catch (err) {
        if (err.response && err.response.status === 401) {
            setError('Session expired. Please log in again.');
            localStorage.removeItem('token');
            setTimeout(() => {
                window.location.href = '/'; // Redirect after short delay
            }, 1000); // 1 second delay to show message
        } else {
            setError('Failed to fetch user.');
        }
        setLoading(false);
    }
};

    useEffect(() => {
        fetchUserName();
    }, []);

  return (
    <header className="app-header">
      <div className="header-left">
        <button onClick={toggleSidebar} className="menu-toggle-button">
          <FaBars />
        </button>
        <div className="app-branding">
          <img src={ASSETS['logo']} alt="App Logo" className="app-logo" />
          <span className="app-name">Purple Premium Bread</span>
        </div>
      </div>
      <div className="header-right">
        <div className="profile-container">
          {loading ? (
            <span>Loading...</span>
          ) : error ? (
            <span className="error">{error}</span>
          ) : (
            <span className="user-info">
              <span className="user-name">
                {userName.username ? userName.username : ''}
              </span>
              <span className="user-role">
                {userName.role ? userName.role : ''}
              </span>
            </span>
          )}
          <FaUserCircle className="profile-icon" />
        </div>
      </div>
    </header>
  );
};

export default Header;