import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const result = login(username, password);
    
    if (result.success) {
      if (result.role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/investor/dashboard');
      }
    } else {
      setError(result.error || 'Invalid credentials');
    }
  };

  return (
    <div className="login-container">
      {/* Wave Animation Elements */}
      <div className='air air1'></div>
      <div className='air air2'></div>
      <div className='air air3'></div>
      <div className='air air4'></div>
      
      {/* Glowing Animation Elements */}
      <div className="glowing">
        <span style={{'--i': 1}}></span>
        <span style={{'--i': 2}}></span>
        <span style={{'--i': 3}}></span>
      </div>
      <div className="glowing">
        <span style={{'--i': 1}}></span>
        <span style={{'--i': 2}}></span>
        <span style={{'--i': 3}}></span>
      </div>
      <div className="glowing">
        <span style={{'--i': 1}}></span>
        <span style={{'--i': 2}}></span>
        <span style={{'--i': 3}}></span>
      </div>
      <div className="glowing">
        <span style={{'--i': 1}}></span>
        <span style={{'--i': 2}}></span>
        <span style={{'--i': 3}}></span>
      </div>

      <div className="login-card">
        <img className="login-title" src="/logo_lf_ncd.svg" alt="NCD Platform Logo" />
        <hr className='login-hr'></hr>
        <p className="login-subtitle">Sign in to your account</p>
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Enter your username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>
          <button type="submit" className="login-button">Sign In</button>
        </form>
        <div className="login-hint">
          <p className="contact-message">
            Don't have an account? 
            <a 
              href="https://www.vaibhav-vyapaar.com/contactus.html" 
              target="_blank" 
              rel="noopener noreferrer"
              className="contact-link"
            >
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

