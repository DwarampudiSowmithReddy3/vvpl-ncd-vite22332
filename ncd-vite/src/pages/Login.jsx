import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const result = await login(username, password);
      
      if (result.success) {
        if (result.role === 'admin') {
          navigate('/dashboard');
        } else {
          navigate('/investor/dashboard');
        }
      } else {
        setError(result.error || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isSubmitting = isLoading || loading;

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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
            />
          </div>
          <button 
            type="submit" 
            className="login-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        {/* Production Login Information */}
        <div className="login-hints">
          <div className="hint-section">
            <h4>🔐 System Access</h4>
            <p>Enter your assigned credentials to access the NCD Management System</p>
            <small>Contact your system administrator if you need access or have forgotten your credentials</small>
          </div>
        </div>
        
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

