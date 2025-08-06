import React from 'react';
import logo from '../assets/images/logo__ess9ini.png';
import './AboutUs.css';

const AboutUs = ({ onBackToDashboard }) => {
  return (
    <div className="about-us-page">
      <div className="about-container">
        <header className="about-header">
          <div className="logo-section">
            <img src={logo} alt="Ess9ini Logo" className="about-logo" />
            <h1>Ess9ini</h1>
          </div>
          <button onClick={onBackToDashboard} className="back-btn">
            ← Back to Dashboard
          </button>
        </header>

        <main className="about-content">
          <section className="hero-section">
            <h2>About Ess9ini</h2>
            <p className="hero-text">
              Revolutionizing agriculture through smart technology and sustainable farming solutions.
            </p>
          </section>

          <section className="mission-section">
            <div className="mission-card">
              <h3>🌱 Our Mission</h3>
              <p>
                To empower farmers with cutting-edge IoT technology and AI-driven insights, 
                enabling sustainable and efficient agricultural practices that benefit both 
                farmers and the environment.
              </p>
            </div>

            <div className="vision-card">
              <h3>🚀 Our Vision</h3>
              <p>
                To become the leading platform for smart farming solutions, creating a 
                future where technology and nature work in harmony to feed the world 
                sustainably.
              </p>
            </div>
          </section>

          <section className="features-section">
            <h3>What We Offer</h3>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">📊</div>
                <h4>Real-time Monitoring</h4>
                <p>Monitor soil moisture, temperature, and environmental conditions in real-time with our advanced sensor network.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">🤖</div>
                <h4>AI-Powered Predictions</h4>
                <p>Get intelligent recommendations for irrigation, planting, and crop management based on machine learning algorithms.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">💧</div>
                <h4>Smart Irrigation</h4>
                <p>Optimize water usage with automated irrigation systems that respond to real-time soil and weather conditions.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">📱</div>
                <h4>Mobile Dashboard</h4>
                <p>Access your farm data anywhere, anytime with our responsive web dashboard and mobile-friendly interface.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">🌍</div>
                <h4>Sustainable Farming</h4>
                <p>Reduce environmental impact while maximizing crop yield through data-driven sustainable farming practices.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">📈</div>
                <h4>Analytics & Reports</h4>
                <p>Comprehensive analytics and detailed reports to help you make informed decisions about your farming operations.</p>
              </div>
            </div>
          </section>

          <section className="team-section">
            <h3>Our Commitment</h3>
            <p>
              At Ess9ini, we're committed to supporting farmers with innovative technology 
              that makes farming more efficient, profitable, and sustainable. Our team of 
              agricultural experts, engineers, and data scientists work together to create 
              solutions that address real-world farming challenges.
            </p>
          </section>

          <section className="contact-section">
            <h3>Get in Touch</h3>
            <p>
              Ready to transform your farming operations? Contact us to learn more about 
              how Ess9ini can help you achieve your agricultural goals.
            </p>
            <div className="contact-info">
              <div className="contact-item">
                <strong>Email:</strong> info@ess9ini.com
              </div>
              <div className="contact-item">
                <strong>Phone:</strong> +1 (555) 123-4567
              </div>
              <div className="contact-item">
                <strong>Address:</strong> 123 Smart Farm Lane, Agriculture City, AC 12345
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default AboutUs;
