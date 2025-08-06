import React from 'react';

const MoistureGauge = ({ moistureLevel = 0, title = "Soil Moisture" }) => {
  const getGaugeColor = (level) => {
    if (level === null) return '#95a5a6'; // Gray for offline
    if (level < 30) return '#e74c3c'; // Red for critical
    if (level < 60) return '#f39c12'; // Orange for warning
    return '#27ae60'; // Green for optimal
  };

  const getStatusInfo = (level) => {
    if (level === null) return { text: 'Offline', icon: '❌', class: 'offline' };
    if (level < 30) return { text: 'Critical', icon: '🚨', class: 'critical' };
    if (level < 60) return { text: 'Warning', icon: '⚠️', class: 'warning' };
    return { text: 'Optimal', icon: '✅', class: 'optimal' };
  };

  const circumference = 2 * Math.PI * 45;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (moistureLevel / 100) * circumference;

  return (
    <div className="moisture-gauge">
      <h3 className="gauge-title">{title}</h3>
      <div className="gauge-container">
        <svg width="120" height="120" className="gauge-svg">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke="#e0e0e0"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke={getGaugeColor(moistureLevel)}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 60 60)"
            style={{
              transition: 'stroke-dashoffset 0.5s ease-in-out'
            }}
          />
        </svg>
        <div className="gauge-text">
          <span className="gauge-value">
            {moistureLevel === null ? 'Error' : `${moistureLevel}%`}
          </span>
        </div>
      </div>
      <div className="gauge-status">
        <span className={`status-indicator ${getStatusInfo(moistureLevel).class}`}>
          <span className="status-icon">{getStatusInfo(moistureLevel).icon}</span>
          <span className="status-text">{getStatusInfo(moistureLevel).text}</span>
        </span>
      </div>
    </div>
  );
};

export default MoistureGauge;
