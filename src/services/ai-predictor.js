// AI-powered prediction service for smart farming
class AIPredictorService {
  constructor() {
    this.modelEndpoint = process.env.REACT_APP_AI_MODEL_URL || 'http://localhost:5000/predict';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Generic prediction request handler
  async makePrediction(endpoint, data) {
    try {
      const response = await fetch(`${this.modelEndpoint}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Prediction request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('AI Prediction error:', error);
      // Return fallback prediction
      return this.getFallbackPrediction(endpoint, data);
    }
  }

  // Predict optimal irrigation timing and amount
  async predictIrrigation(sensorData, weatherData, cropType) {
    const cacheKey = `irrigation_${JSON.stringify({ sensorData, weatherData, cropType })}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey).data;
    }

    const predictionData = {
      moisture_levels: sensorData.map(s => s.moistureLevel),
      temperature: sensorData.map(s => s.temperature),
      humidity: weatherData.humidity,
      rainfall_forecast: weatherData.rainfall,
      crop_type: cropType,
      soil_type: sensorData[0]?.soilType || 'loam',
    };

    const prediction = await this.makePrediction('irrigation', predictionData);
    
    this.setCache(cacheKey, prediction);
    return prediction;
  }

  // Predict crop yield based on current conditions
  async predictYield(historicalData, currentConditions, cropType) {
    const cacheKey = `yield_${cropType}_${Date.now()}`;
    
    const predictionData = {
      historical_moisture: historicalData.moisture,
      historical_temperature: historicalData.temperature,
      current_conditions: currentConditions,
      crop_type: cropType,
      growth_stage: currentConditions.growthStage || 'vegetative',
    };

    const prediction = await this.makePrediction('yield', predictionData);
    
    this.setCache(cacheKey, prediction);
    return prediction;
  }

  // Predict disease risk based on environmental conditions
  async predictDiseaseRisk(environmentalData, cropType) {
    const cacheKey = `disease_${cropType}_${JSON.stringify(environmentalData)}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey).data;
    }

    const predictionData = {
      temperature: environmentalData.temperature,
      humidity: environmentalData.humidity,
      moisture: environmentalData.moisture,
      crop_type: cropType,
      season: this.getCurrentSeason(),
    };

    const prediction = await this.makePrediction('disease-risk', predictionData);
    
    this.setCache(cacheKey, prediction);
    return prediction;
  }

  // Predict optimal planting time
  async predictPlantingTime(location, cropType, soilConditions) {
    const predictionData = {
      location: location,
      crop_type: cropType,
      soil_moisture: soilConditions.moisture,
      soil_temperature: soilConditions.temperature,
      soil_ph: soilConditions.ph || 7.0,
    };

    return await this.makePrediction('planting-time', predictionData);
  }

  // Predict water usage optimization
  async predictWaterUsage(farmData, weatherForecast) {
    const predictionData = {
      current_usage: farmData.waterUsage,
      sensor_data: farmData.sensors,
      weather_forecast: weatherForecast,
      farm_size: farmData.size,
    };

    return await this.makePrediction('water-usage', predictionData);
  }

  // Cache management
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  isCacheValid(key) {
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    return (Date.now() - cached.timestamp) < this.cacheTimeout;
  }

  clearCache() {
    this.cache.clear();
  }

  // Utility methods
  getCurrentSeason() {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  // Fallback predictions when AI service is unavailable
  getFallbackPrediction(endpoint, data) {
    const fallbacks = {
      irrigation: {
        recommendation: 'moderate',
        amount: 25, // mm
        timing: 'early_morning',
        confidence: 0.6,
        reason: 'Fallback recommendation based on basic rules',
      },
      yield: {
        predicted_yield: 'average',
        confidence: 0.5,
        factors: ['weather_dependent'],
      },
      'disease-risk': {
        risk_level: 'medium',
        diseases: ['general_fungal'],
        confidence: 0.5,
      },
      'planting-time': {
        optimal_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        confidence: 0.4,
      },
      'water-usage': {
        optimization: 'maintain_current',
        savings_potential: 10,
        confidence: 0.5,
      },
    };

    return fallbacks[endpoint] || { error: 'No fallback available' };
  }
}

// Create and export singleton instance
const aiPredictor = new AIPredictorService();
export default aiPredictor;

// Export individual methods for convenience
export const {
  predictIrrigation,
  predictYield,
  predictDiseaseRisk,
  predictPlantingTime,
  predictWaterUsage,
} = aiPredictor;
