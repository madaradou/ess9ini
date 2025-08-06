// API service for handling farm sensor data
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Generic fetch wrapper with error handling
  async fetchWithErrorHandling(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Get all sensor data
  async getSensorData() {
    return this.fetchWithErrorHandling(`${this.baseURL}/sensors`);
  }

  // Get specific sensor data by ID
  async getSensorById(sensorId) {
    return this.fetchWithErrorHandling(`${this.baseURL}/sensors/${sensorId}`);
  }

  // Get historical data for a sensor
  async getSensorHistory(sensorId, timeRange = '24h') {
    return this.fetchWithErrorHandling(
      `${this.baseURL}/sensors/${sensorId}/history?range=${timeRange}`
    );
  }

  // Update sensor configuration
  async updateSensorConfig(sensorId, config) {
    return this.fetchWithErrorHandling(`${this.baseURL}/sensors/${sensorId}/config`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  // Get weather data
  async getWeatherData(location) {
    return this.fetchWithErrorHandling(
      `${this.baseURL}/weather?location=${encodeURIComponent(location)}`
    );
  }

  // Get irrigation recommendations
  async getIrrigationRecommendations(farmId) {
    return this.fetchWithErrorHandling(`${this.baseURL}/irrigation/recommendations/${farmId}`);
  }

  // Submit irrigation action
  async submitIrrigationAction(actionData) {
    return this.fetchWithErrorHandling(`${this.baseURL}/irrigation/actions`, {
      method: 'POST',
      body: JSON.stringify(actionData),
    });
  }

  // Get farm overview data
  async getFarmOverview(farmId) {
    return this.fetchWithErrorHandling(`${this.baseURL}/farms/${farmId}/overview`);
  }

  // Get alerts and notifications
  async getAlerts(farmId) {
    return this.fetchWithErrorHandling(`${this.baseURL}/farms/${farmId}/alerts`);
  }

  // Mark alert as read
  async markAlertAsRead(alertId) {
    return this.fetchWithErrorHandling(`${this.baseURL}/alerts/${alertId}/read`, {
      method: 'PUT',
    });
  }

  // Get crop data
  async getCropData(farmId) {
    return this.fetchWithErrorHandling(`${this.baseURL}/farms/${farmId}/crops`);
  }

  // Update crop information
  async updateCropInfo(cropId, cropData) {
    return this.fetchWithErrorHandling(`${this.baseURL}/crops/${cropId}`, {
      method: 'PUT',
      body: JSON.stringify(cropData),
    });
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;

// Export individual methods for convenience
export const {
  getSensorData,
  getSensorById,
  getSensorHistory,
  updateSensorConfig,
  getWeatherData,
  getIrrigationRecommendations,
  submitIrrigationAction,
  getFarmOverview,
  getAlerts,
  markAlertAsRead,
  getCropData,
  updateCropInfo,
} = apiService;
