import React, { useState, useEffect, useCallback } from 'react';
import MoistureGauge from './components/dashboard/MoistureGauge';
import FarmMap from './components/dashboard/FarmMap';
import AboutUs from './components/AboutUs';
import apiService from './services/api';
import aiPredictor from './services/ai-predictor';
import logo from './assets/images/logo__ess9ini.png';
import './App.css';

function App() {
  // Mock data for Tunisian olive farm
  const mockSensorData = [
    {
      id: 1,
      name: 'Sensor 1',
      moistureLevel: 45,
      temperature: 22,
      x: 80,
      y: 60,
      lastUpdated: '2024-01-15 10:30:00',
      status: 'warning',
      change24h: -3,
      batteryLevel: 85,
    },
    {
      id: 2,
      name: 'Sensor 2',
      moistureLevel: 65,
      temperature: 24,
      x: 180,
      y: 80,
      lastUpdated: '2024-01-15 10:28:00',
      status: 'optimal',
      change24h: +2,
      batteryLevel: 92,
    },
    {
      id: 3,
      name: 'Sensor 3',
      moistureLevel: 25,
      temperature: 26,
      x: 280,
      y: 120,
      lastUpdated: '2024-01-15 10:25:00',
      status: 'critical',
      change24h: -8,
      batteryLevel: 78,
    },
    {
      id: 4,
      name: 'Sensor 4',
      moistureLevel: 80,
      temperature: 21,
      x: 120,
      y: 180,
      lastUpdated: '2024-01-15 10:32:00',
      status: 'optimal',
      change24h: +1,
      batteryLevel: 88,
    },
  ];

  const mockWeatherData = {
    temperature: 23,
    humidity: 65,
    rainfall: 2.5,
    forecast: 'Partly cloudy with chance of rain',
  };

  const [sensorData, setSensorData] = useState(mockSensorData);
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [weatherData, setWeatherData] = useState(mockWeatherData);
  const [irrigationPrediction, setIrrigationPrediction] = useState(null);
  const [loading, setLoading] = useState(false); // Changed to false for immediate display
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard'); // Track current page
  const [farmInfo] = useState({
    name: 'مزرعة الزياتين، قابس',
    nameEn: 'Olive Farm, Gabès',
    cropType: 'Olive Trees',
    area: '12.5 hectares',
    targetMoisture: 80,
  });
  const [alerts, setAlerts] = useState([
    { id: 1, type: 'critical', message: 'Sensor 3 moisture critically low (25%)', acknowledged: false },
    { id: 2, type: 'warning', message: 'Sensor 1 needs attention (45%)', acknowledged: false },
    { id: 3, type: 'info', message: 'Irrigation scheduled for tomorrow 6:00 AM', acknowledged: true },
  ]);

  // Arabic localization
  const labels = {
    moisture: 'رطوبة التربة',
    recommendation: 'توصية الري',
    sensors: 'أجهزة الاستشعار',
    irrigation: 'الري',
    weather: 'الطقس',
  };

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Try to load real data, fall back to mock data
      try {
        const sensors = await apiService.getSensorData();
        setSensorData(sensors);
      } catch (apiError) {
        console.log('Using mock sensor data');
        // Use the mock data that's already in state
      }

      try {
        const weather = await apiService.getWeatherData('farm-location');
        setWeatherData(weather);
      } catch (apiError) {
        console.log('Using mock weather data');
        // Use the mock data that's already in state
      }

      // Get AI predictions
      try {
        const prediction = await aiPredictor.predictIrrigation(
          sensorData,
          weatherData,
          'tomato'
        );
        setIrrigationPrediction(prediction);
      } catch (predictionError) {
        console.log('AI prediction unavailable');
      }

    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard loading error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleSensorClick = (sensor) => {
    setSelectedSensor(sensor);
  };

  const handleLogoClick = () => {
    setCurrentPage('about');
  };

  const handleBackToDashboard = () => {
    setCurrentPage('dashboard');
  };

  const getAverageMoisture = () => {
    if (sensorData.length === 0) return 0;
    const total = sensorData.reduce((sum, sensor) => sensor.moistureLevel !== null ? sum + sensor.moistureLevel : sum, 0);
    const validSensors = sensorData.filter(sensor => sensor.moistureLevel !== null).length;
    return validSensors > 0 ? Math.round(total / validSensors) : 0;
  };

  const get24hChange = () => {
    if (sensorData.length === 0) return 0;
    const totalChange = sensorData.reduce((sum, sensor) => sum + (sensor.change24h || 0), 0);
    return Math.round(totalChange / sensorData.length * 10) / 10;
  };

  const getSensorStats = () => {
    const critical = sensorData.filter(sensor => sensor.moistureLevel < 30).length;
    const warning = sensorData.filter(sensor => sensor.moistureLevel >= 30 && sensor.moistureLevel < 60).length;
    const optimal = sensorData.filter(sensor => sensor.moistureLevel >= 60).length;
    const offline = sensorData.filter(sensor => sensor.moistureLevel === null).length;

    return { critical, warning, optimal, offline };
  };

  const getUnacknowledgedAlerts = () => {
    return alerts.filter(alert => !alert.acknowledged).length;
  };

  const handleAcknowledgeAlert = (alertId) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const handleIrrigationAction = (action) => {
    console.log(`Irrigation action: ${action}`);
    // TODO: Implement actual irrigation control
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading farm dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={loadDashboardData}>Retry</button>
        </div>
      </div>
    );
  }

  // Show About Us page
  if (currentPage === 'about') {
    return <AboutUs onBackToDashboard={handleBackToDashboard} />;
  }

  // Show Dashboard (default)
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>
            <img
              src={logo}
              alt="Ess9ini Logo"
              className="header-logo clickable-logo"
              onClick={handleLogoClick}
              title="Click to learn more about Ess9ini"
            />
            <div className="farm-info">
              <span className="farm-name-ar">{farmInfo.name}</span>
              <span className="farm-name-en">{farmInfo.nameEn}</span>
              <span className="farm-details">{farmInfo.cropType} • {farmInfo.area}</span>
            </div>
          </h1>
        </div>
        <div className="header-stats">
          <div className="stat">
            <span className="stat-label">Current Moisture</span>
            <span className="stat-value">{getAverageMoisture()}%</span>
          </div>
          <div className="stat">
            <span className="stat-label">24h Change</span>
            <span className={`stat-value ${get24hChange() >= 0 ? 'positive' : 'negative'}`}>
              {get24hChange() >= 0 ? '+' : ''}{get24hChange()}%
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Critical Alerts</span>
            <span className="stat-value alert">{getUnacknowledgedAlerts()}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Optimal Sensors</span>
            <span className="stat-value optimal">{getSensorStats().optimal}</span>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="dashboard-grid">
          <div className="dashboard-section farm-map-section">
            <FarmMap
              farmData={sensorData}
              onSensorClick={handleSensorClick}
            />
          </div>

          <div className="dashboard-section main-gauge-section">
            <MoistureGauge
              moistureLevel={getAverageMoisture()}
              title="Average Soil Moisture"
            />
          </div>

          {selectedSensor ? (
            <div className="dashboard-section selected-gauge-section">
              <MoistureGauge
                moistureLevel={selectedSensor.moistureLevel}
                title={`${selectedSensor.name} Moisture`}
              />
            </div>
          ) : (
            <div className="dashboard-section selected-gauge-section">
              <div className="placeholder-section">
                <h3>Select a Sensor</h3>
                <p>Click on any sensor in the map above to view its detailed moisture level.</p>
              </div>
            </div>
          )}

          {weatherData && (
            <div className="dashboard-section weather-section">
              <h3>Weather Conditions</h3>
              <div className="weather-info">
                <p>Temperature: {weatherData.temperature}°C</p>
                <p>Humidity: {weatherData.humidity}%</p>
                <p>Rainfall: {weatherData.rainfall}mm</p>
                <p>{weatherData.forecast}</p>
              </div>
            </div>
          )}

          {irrigationPrediction && (
            <div className="dashboard-section prediction-section">
              <h3>{labels.recommendation} • AI Irrigation Recommendation</h3>
              <div className="prediction-info">
                <div className="moisture-gap">
                  <span>Target: {farmInfo.targetMoisture}%</span>
                  <span>Current: {getAverageMoisture()}%</span>
                  <span className="gap-value">Gap: {getAverageMoisture() - farmInfo.targetMoisture}%</span>
                </div>
                <div className="recommendation-details">
                  <p>Recommendation: <strong>{irrigationPrediction.recommendation}</strong></p>
                  <p>Amount: {irrigationPrediction.amount}mm</p>
                  <p>Best Time: {irrigationPrediction.timing}</p>
                  <div className="confidence-bar">
                    <span>Confidence: {Math.round(irrigationPrediction.confidence * 100)}%</span>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{width: `${irrigationPrediction.confidence * 100}%`}}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="irrigation-controls">
                  <button
                    className="btn-primary"
                    onClick={() => handleIrrigationAction('start-now')}
                  >
                    🚿 Start Irrigation Now
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => handleIrrigationAction('schedule-morning')}
                  >
                    ⏰ Schedule for Early Morning
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Alerts Management Section */}
          <div className="dashboard-section alerts-section">
            <h3>🚨 Alert Management</h3>
            <div className="alerts-list">
              {alerts.map(alert => (
                <div key={alert.id} className={`alert-item ${alert.type} ${alert.acknowledged ? 'acknowledged' : ''}`}>
                  <div className="alert-content">
                    <span className="alert-priority">[{alert.type.toUpperCase()}]</span>
                    <span className="alert-message">{alert.message}</span>
                  </div>
                  {!alert.acknowledged && (
                    <button
                      className="acknowledge-btn"
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Hardware Connection Status */}
          <div className="dashboard-section connection-section">
            <h3>🔌 Hardware Status</h3>
            <div className="connection-status">
              <div className="status-item">
                <span className="status-icon bluetooth">📶</span>
                <span className="status-label">Arduino: Disconnected</span>
                <span className="status-badge error">Offline</span>
              </div>
              <div className="connection-controls">
                <button className="btn-secondary">
                  🔗 Connect Hardware
                </button>
                <label className="simulation-toggle">
                  <input type="checkbox" defaultChecked />
                  <span>Simulation Mode</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <button onClick={loadDashboardData} className="refresh-btn">
            🔄 Refresh Data
          </button>
          <div className="sensor-summary">
            <span>Sensors: </span>
            <span className="sensor-count critical">❌ {getSensorStats().critical} Critical</span>
            <span className="sensor-count warning">⚠️ {getSensorStats().warning} Warning</span>
            <span className="sensor-count optimal">✅ {getSensorStats().optimal} Optimal</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
