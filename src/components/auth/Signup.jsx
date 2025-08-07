import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/images/logo__ess9ini.png';
import './Auth.css';

const Signup = ({ onSwitchToLogin }) => {
  const { register, loading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'farmer',
    language: 'ar',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};

    // Name validation
    if (!formData.firstName.trim()) {
      errors.firstName = 'الاسم الأول مطلوب / First name is required';
    }
    if (!formData.lastName.trim()) {
      errors.lastName = 'اسم العائلة مطلوب / Last name is required';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      errors.email = 'البريد الإلكتروني مطلوب / Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'البريد الإلكتروني غير صحيح / Invalid email format';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'كلمة المرور مطلوبة / Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل / Password must be at least 6 characters';
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'كلمات المرور غير متطابقة / Passwords do not match';
    }

    // Phone validation (optional but if provided should be valid)
    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      errors.phone = 'رقم الهاتف غير صحيح / Invalid phone number';
    }

    // Terms acceptance
    if (!acceptTerms) {
      errors.terms = 'يجب الموافقة على الشروط والأحكام / You must accept the terms and conditions';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (error) {
      clearError();
    }
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const userData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim(),
        role: formData.role,
        language: formData.language,
      };

      await register(userData);
      // Registration successful - user will be redirected by App component
    } catch (error) {
      // Error is handled by AuthContext
      console.error('Registration failed:', error);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card signup-card">
        <div className="auth-header">
          <img src={logo} alt="Ess9ini Logo" className="auth-logo" />
          <h1 className="auth-title">
            <span className="title-ar">إنشاء حساب جديد</span>
            <span className="title-en">Create New Account</span>
          </h1>
          <p className="auth-subtitle">
            انضم إلى مجتمع المزارعين الأذكياء
            <br />
            Join the Smart Farming Community
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName" className="form-label">
                الاسم الأول / First Name *
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`form-input ${validationErrors.firstName ? 'error' : ''}`}
                placeholder="أحمد / Ahmed"
                required
                autoComplete="given-name"
              />
              {validationErrors.firstName && (
                <span className="field-error">{validationErrors.firstName}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="lastName" className="form-label">
                اسم العائلة / Last Name *
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`form-input ${validationErrors.lastName ? 'error' : ''}`}
                placeholder="بن علي / Ben Ali"
                required
                autoComplete="family-name"
              />
              {validationErrors.lastName && (
                <span className="field-error">{validationErrors.lastName}</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              البريد الإلكتروني / Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`form-input ${validationErrors.email ? 'error' : ''}`}
              placeholder="ahmed@example.com"
              required
              autoComplete="email"
            />
            {validationErrors.email && (
              <span className="field-error">{validationErrors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="phone" className="form-label">
              رقم الهاتف / Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`form-input ${validationErrors.phone ? 'error' : ''}`}
              placeholder="+216 98 123 456"
              autoComplete="tel"
            />
            {validationErrors.phone && (
              <span className="field-error">{validationErrors.phone}</span>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                كلمة المرور / Password *
              </label>
              <div className="password-input-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`form-input ${validationErrors.password ? 'error' : ''}`}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {validationErrors.password && (
                <span className="field-error">{validationErrors.password}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                تأكيد كلمة المرور / Confirm Password *
              </label>
              <div className="password-input-container">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`form-input ${validationErrors.confirmPassword ? 'error' : ''}`}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {validationErrors.confirmPassword && (
                <span className="field-error">{validationErrors.confirmPassword}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="role" className="form-label">
                نوع الحساب / Account Type
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="form-input"
              >
                <option value="farmer">مزارع / Farmer</option>
                <option value="technician">فني / Technician</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="language" className="form-label">
                اللغة المفضلة / Preferred Language
              </label>
              <select
                id="language"
                name="language"
                value={formData.language}
                onChange={handleChange}
                className="form-input"
              >
                <option value="ar">العربية / Arabic</option>
                <option value="en">English / الإنجليزية</option>
                <option value="fr">Français / الفرنسية</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
              />
              <span className="checkbox-text">
                أوافق على <a href="#terms" className="link">الشروط والأحكام</a> و <a href="#privacy" className="link">سياسة الخصوصية</a>
                <br />
                I agree to the <a href="#terms" className="link">Terms & Conditions</a> and <a href="#privacy" className="link">Privacy Policy</a>
              </span>
            </label>
            {validationErrors.terms && (
              <span className="field-error">{validationErrors.terms}</span>
            )}
          </div>

          <button
            type="submit"
            className="auth-button primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                جاري إنشاء الحساب... / Creating Account...
              </>
            ) : (
              'إنشاء حساب / Create Account'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p className="signup-prompt">
            لديك حساب بالفعل؟ / Already have an account?
            <button
              type="button"
              className="switch-auth-link"
              onClick={onSwitchToLogin}
            >
              تسجيل الدخول / Login
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

export default Signup;
