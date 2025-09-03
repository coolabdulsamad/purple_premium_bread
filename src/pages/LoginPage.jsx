import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaBreadSlice, FaUser, FaLock, FaSignInAlt } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../assets/styles/login.css';

// const API_BASE_URL = 'https://purple-premium-bread-backend.onrender.com/api/auth';
const API_BASE_URL = process.env.REACT_APP_API_URL_AU;

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        username,
        password,
      });

      if (response.data && response.data.token) {
        // Store the token and user role
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userRole', response.data.role);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Show success message
        toast.success(`Welcome back, ${response.data.user.fullname || username}!`);

        // Redirect based on the user's role
        setTimeout(() => {
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
              navigate('/dashboard');
          }
        }, 1500);
      } else {
        setError('Invalid response from server.');
        toast.error('Invalid response from server.');
      }
    } catch (err) {
      console.error('Login error:', err);
      let errorMessage = 'An error occurred. Please try again.';
      
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      
      <div className="login-container">
        <div className="login-card">
          <div className="logo-container">
            <div className="logo-icon-container">
              <FaBreadSlice className="logo-icon" />
            </div>
            <h1>Purple Premium Bread</h1>
            <p>POS & Production System</p>
          </div>
          
          <form onSubmit={handleLogin} className="login-form">
            <div className="input-group">
              <div className="input-icon">
                <FaUser />
              </div>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                disabled={loading}
              />
            </div>
            
            <div className="input-group">
              <div className="input-icon">
                <FaLock />
              </div>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <button 
              type="submit" 
              className="login-btn"
              disabled={loading}
            >
              {loading ? (
                <div className="loading-spinner"></div>
              ) : (
                <>
                  <FaSignInAlt className="btn-icon" />
                  Log In
                </>
              )}
            </button>
          </form>
          
          <div className="login-footer">
            <p>© 2023 Purple Premium Bread. All rights reserved.</p>
          </div>
        </div>
        
        <div className="login-background">
          <div className="background-overlay"></div>
          <div className="welcome-message">
            <h2>Welcome Back!</h2>
            <p>Sign in to access your account and manage your bakery operations</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;