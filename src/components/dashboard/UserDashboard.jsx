import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import './UserDashboard.css';

const UserDashboard = ({ children }) => {
  const { user, logout } = useAuth();
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const loadUserStats = async () => {
      try {
        if (user?.farmId) {
          // Load farm-specific data for farmers
          const farmData = await apiService.getFarmOverview(user.farmId);
          setUserStats(farmData);
        } else if (user?.role === 'admin') {
          // Load system-wide stats for admins
          // This would be a different endpoint
          setUserStats({
            totalFarms: 0,
            totalUsers: 0,
            totalSensors: 0,
            systemHealth: 'good'
          });
        }
      } catch (error) {
        console.error('Failed to load user stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadUserStats();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getUserDisplayName = () => {
    if (!user) return '';
    
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    
    // Show Arabic name if available, otherwise English
    return `${firstName} ${lastName}`.trim() || user.email;
  };

  const getRoleDisplayName = () => {
    const roleNames = {
      farmer: 'مزارع / Farmer',
      admin: 'مدير / Administrator',
      technician: 'فني / Technician'
    };
    
    return roleNames[user?.role] || user?.role;
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    let greeting = '';
    
    if (hour < 12) {
      greeting = 'صباح الخير / Good Morning';
    } else if (hour < 18) {
      greeting = 'مساء الخير / Good Afternoon';
    } else {
      greeting = 'مساء الخير / Good Evening';
    }
    
    return `${greeting}, ${getUserDisplayName()}`;
  };

  if (!user) {
    return null;
  }

  return (
    <div className="user-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="welcome-section">
            <h1 className="welcome-message">{getWelcomeMessage()}</h1>
            <p className="user-role">{getRoleDisplayName()}</p>
          </div>
        </div>

        <div className="header-right">
          {!loading && userStats && (
            <div className="quick-stats">
              {user.role === 'farmer' && (
                <>
                  <div className="stat-item">
                    <span className="stat-label">مزرعتي / My Farm</span>
                    <span className="stat-value">{userStats.farmName || 'N/A'}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">أجهزة الاستشعار / Sensors</span>
                    <span className="stat-value">{userStats.totalSensors || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">الرطوبة المتوسطة / Avg Moisture</span>
                    <span className="stat-value">{userStats.averageMoisture || 0}%</span>
                  </div>
                </>
              )}
              
              {user.role === 'admin' && (
                <>
                  <div className="stat-item">
                    <span className="stat-label">المزارع / Farms</span>
                    <span className="stat-value">{userStats.totalFarms || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">المستخدمين / Users</span>
                    <span className="stat-value">{userStats.totalUsers || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">حالة النظام / System</span>
                    <span className={`stat-value ${userStats.systemHealth}`}>
                      {userStats.systemHealth === 'good' ? '✅ جيد / Good' : '⚠️ تحتاج انتباه / Needs Attention'}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="user-menu-container">
            <button
              className="user-menu-trigger"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="user-avatar">
                {getUserDisplayName().charAt(0).toUpperCase()}
              </div>
              <span className="user-name">{getUserDisplayName()}</span>
              <span className="menu-arrow">▼</span>
            </button>

            {showUserMenu && (
              <div className="user-menu">
                <div className="user-menu-header">
                  <div className="user-info">
                    <strong>{getUserDisplayName()}</strong>
                    <small>{user.email}</small>
                    <small>{getRoleDisplayName()}</small>
                  </div>
                </div>
                
                <div className="user-menu-items">
                  <button className="menu-item">
                    <span className="menu-icon">👤</span>
                    الملف الشخصي / Profile
                  </button>
                  
                  <button className="menu-item">
                    <span className="menu-icon">⚙️</span>
                    الإعدادات / Settings
                  </button>
                  
                  {user.role === 'farmer' && (
                    <button className="menu-item">
                      <span className="menu-icon">🏡</span>
                      إدارة المزرعة / Farm Management
                    </button>
                  )}
                  
                  {user.role === 'admin' && (
                    <button className="menu-item">
                      <span className="menu-icon">🛠️</span>
                      لوحة الإدارة / Admin Panel
                    </button>
                  )}
                  
                  <div className="menu-divider"></div>
                  
                  <button className="menu-item logout" onClick={handleLogout}>
                    <span className="menu-icon">🚪</span>
                    تسجيل الخروج / Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="dashboard-content">
        {children}
      </main>
    </div>
  );
};

export default UserDashboard;
