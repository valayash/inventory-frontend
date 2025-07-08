import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8001/api';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // First, get the access token
      const tokenResponse = await axios.post(`${API_BASE_URL}/token/`, {
        username,
        password,
      });

      const accessToken = tokenResponse.data.access;
      
      // Store tokens
      localStorage.setItem('token', accessToken);

      // Get user information
      const userInfoResponse = await axios.get(`${API_BASE_URL}/user-info/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const userInfo = userInfoResponse.data;
      localStorage.setItem('user_info', JSON.stringify(userInfo));

      // Redirect based on role
      if (userInfo.role === 'DISTRIBUTOR') {
        navigate('/distributor');
      } else if (userInfo.role === 'SHOP_OWNER') {
        navigate('/shop-owner');
      } else {
        setError('Unknown user role. Please contact administrator.');
      }
      
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.response?.status === 401) {
        setError('Invalid username or password.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h1>Inventory Management System</h1>
      <h2>Login</h2>
      
      <form onSubmit={handleLogin} className="login-form">
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        
        <button type="submit" disabled={loading} className="login-button">
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default LoginPage; 