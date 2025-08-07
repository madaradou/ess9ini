import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/images/logo__ess9ini.png';
import './Auth.css';

const Login = ({ onSwitchToSignup, onForgotPassword }) => {
  const { login, loading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      return;
    }

    try {
      await login(formData.email, formData.password);
      // Login successful - user will be redirected by App component
    } catch (error) {
      // Error is handled by AuthContext
      console.error('Login failed:', error);
    }
  };

  const handleDemoLogin = async (userType) => {
    const demoCredentials = {
      farmer: {
        email: 'farmer@ess9ini.com',
        password: '123456'
      },
      admin: {
        email: 'admin@ess9ini.com',
        password: '123456'
      }
    };

    const credentials = demoCredentials[userType];
    setFormData(credentials);
    
    try {
      await login(credentials.email, credentials.password);
    } catch (error) {
      console.error('Demo login failed:', error);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <img src={logo} alt="Ess9ini Logo" className="auth-logo" />
          <h1 className="auth-title">
            <span className="title-ar">أهلاً بك في إسقيني </span>
            <span className="title-en">Welcome to Ess9ini</span>
          </h1>
          <p className="auth-subtitle">
            نظام الري الذكي للمزارع التونسية
            <br />
            Smart Irrigation System for Tunisian Farms
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              البريد الإلكتروني / Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              placeholder="farmer@ess9ini.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              كلمة المرور / Password
            </label>
            <div className="password-input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="checkbox-text">تذكرني / Remember me</span>
            </label>
            
            <button
              type="button"
              className="forgot-password-link"
              onClick={onForgotPassword}
            >
              نسيت كلمة المرور؟ / Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            className="auth-button primary"
            disabled={loading || !formData.email || !formData.password}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                جاري تسجيل الدخول... / Logging in...
              </>
            ) : (
              'تسجيل الدخول / Login'
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>أو / OR</span>
        </div>

        <div className="demo-section">
          <p className="demo-title">تجربة سريعة / Quick Demo</p>
          <div className="demo-buttons">
            <button
              type="button"
              className="demo-button farmer"
              onClick={() => handleDemoLogin('farmer')}
              disabled={loading}
            >
              <span className="demo-icon">👨‍🌾</span>
              <span className="demo-text">
                <strong>مزارع / Farmer</strong>
                <small>farmer@ess9ini.com</small>
              </span>
            </button>
            
            <button
              type="button"
              className="demo-button admin"
              onClick={() => handleDemoLogin('admin')}
              disabled={loading}
            >
              <span className="demo-icon">👨‍💼</span>
              <span className="demo-text">
                <strong>مدير / Admin</strong>
                <small>admin@ess9ini.com</small>
              </span>
            </button>
          </div>
        </div>

        <div className="auth-footer">
          <p className="signup-prompt">
            ليس لديك حساب؟ / Don't have an account?
            <button
              type="button"
              className="switch-auth-link"
              onClick={onSwitchToSignup}
            >
              إنشاء حساب جديد / Sign Up
            </button>
          </p>
        </div>
      </div>

      <div className="auth-background">
        <div className="background-pattern"></div>
        <div className="floating-elements">
          <div className="floating-element">🌱</div>
          <div className="floating-element">💧</div>
          <div className="floating-element">🌿</div>
          <div className="floating-element">🚿</div>
        </div>
      </div>
    </div>
  );
};

export default Login;
