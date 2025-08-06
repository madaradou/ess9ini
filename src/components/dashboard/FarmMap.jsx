import React, { useState } from 'react';

const FarmMap = ({ farmData = [], onSensorClick }) => {
  const [selectedSensor, setSelectedSensor] = useState(null);

  const handleSensorClick = (sensor) => {
    setSelectedSensor(sensor);
    if (onSensorClick) {
      onSensorClick(sensor);
    }
  };

  const getSensorColor = (moistureLevel) => {
    if (moistureLevel < 30) return '#ff4444'; // Red for low moisture
    if (moistureLevel < 60) return '#ffaa00'; // Orange for medium moisture
    return '#44ff44'; // Green for good moisture
  };

  return (
    <div className="farm-map">
      <h3 className="map-title">Farm Sensor Map</h3>
      <div className="map-container">
        <svg width="100%" height="400" viewBox="0 0 800 400" className="farm-svg">
          {/* Farm boundary */}
          <rect
            x="40"
            y="40"
            width="720"
            height="320"
            fill="#f0f8e8"
            stroke="#8bc34a"
            strokeWidth="3"
            rx="10"
          />

          {/* Grid lines for reference */}
          {[...Array(6)].map((_, i) => (
            <g key={`grid-${i}`}>
              <line
                x1={40 + (i + 1) * 120}
                y1="40"
                x2={40 + (i + 1) * 120}
                y2="360"
                stroke="#e0e0e0"
                strokeWidth="1"
                strokeDasharray="8,8"
              />
              <line
                x1="40"
                y1={40 + (i + 1) * 53.33}
                x2="760"
                y2={40 + (i + 1) * 53.33}
                stroke="#e0e0e0"
                strokeWidth="1"
                strokeDasharray="8,8"
              />
            </g>
          ))}

          {/* Sensors */}
          {farmData.map((sensor, index) => (
            <g key={sensor.id || index}>
              <circle
                cx={sensor.x ? sensor.x * 2 : 120 + (index % 4) * 150}
                cy={sensor.y ? sensor.y * 2 : 120 + Math.floor(index / 4) * 120}
                r="18"
                fill={getSensorColor(sensor.moistureLevel)}
                stroke="#333"
                strokeWidth="3"
                className="sensor-point"
                style={{ cursor: 'pointer' }}
                onClick={() => handleSensorClick(sensor)}
              />
              <text
                x={sensor.x ? sensor.x * 2 : 120 + (index % 4) * 150}
                y={sensor.y ? sensor.y * 2 + 35 : 155 + Math.floor(index / 4) * 120}
                textAnchor="middle"
                fontSize="14"
                fontWeight="600"
                fill="#333"
              >
                {sensor.name || `S${index + 1}`}
              </text>
            </g>
          ))}
        </svg>
        
        {selectedSensor && (
          <div className="sensor-info">
            <h4>Sensor: {selectedSensor.name}</h4>
            <p>Moisture: {selectedSensor.moistureLevel}%</p>
            <p>Temperature: {selectedSensor.temperature || 'N/A'}°C</p>
            <p>Last Updated: {selectedSensor.lastUpdated || 'N/A'}</p>
          </div>
        )}
      </div>
      
      <div className="map-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#44ff44' }}></div>
          <span>Optimal (60%+)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#ffaa00' }}></div>
          <span>Medium (30-60%)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#ff4444' }}></div>
          <span>Low (&lt;30%)</span>
        </div>
      </div>
    </div>
  );
};

export default FarmMap;
