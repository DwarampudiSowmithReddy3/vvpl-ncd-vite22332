import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  // Auto-hide toast after 4 seconds
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
        setError('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setShowToast(false);
    setIsLoading(true);
    
    try {
      const result = await login(username, password);
      
      if (result.success) {
        // Clear any previous errors
        setError('');
        setShowToast(false);
        if (result.role === 'admin') {
          navigate('/dashboard');
        } else {
          navigate('/investor/dashboard');
        }
      } else {
        setError(result.error || 'Invalid credentials');
        setShowToast(true);
      }
    } catch (error) {
      if (import.meta.env.DEV) { console.error('Login error:', error); }
      setError('Login failed. Please try again.');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const isSubmitting = isLoading || loading;

  return (
    <div className="login-container">
      {/* Toast Notification */}
      {showToast && error && (
        <div className="login-toast-container">
          <div className="login-toast login-toast-error">
            <div className="login-toast-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="login-toast-content">
              <p className="login-toast-title">Login Failed</p>
              <p className="login-toast-message">{error}</p>
            </div>
            <button 
              className="login-toast-close"
              onClick={() => {
                setShowToast(false);
                setError('');
              }}
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
              </svg>
            </button>
          </div>
        </div>
      )}

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

