const axios = require('axios');
const { logger } = require('../utils/logger');

/**
 * Weather service for fetching weather data
 */

// OpenWeatherMap API configuration
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const WEATHER_API_URL = process.env.WEATHER_API_URL || 'https://api.openweathermap.org/data/2.5';

// Default coordinates for Gabès, Tunisia
const DEFAULT_COORDINATES = {
  latitude: 33.8815,
  longitude: 10.0982
};

// Get current weather
const getCurrentWeather = async (latitude = DEFAULT_COORDINATES.latitude, longitude = DEFAULT_COORDINATES.longitude) => {
  try {
    if (!WEATHER_API_KEY) {
      throw new Error('Weather API key not configured');
    }

    const response = await axios.get(`${WEATHER_API_URL}/weather`, {
      params: {
        lat: latitude,
        lon: longitude,
        appid: WEATHER_API_KEY,
        units: 'metric',
        lang: 'en'
      },
      timeout: 5000
    });

    const data = response.data;
    
    const weatherData = {
      location: {
        name: data.name,
        country: data.sys.country,
        coordinates: {
          latitude: data.coord.lat,
          longitude: data.coord.lon
        }
      },
      current: {
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
        windDirection: data.wind.deg,
        visibility: data.visibility / 1000, // Convert to km
        uvIndex: null, // Not available in current weather endpoint
        cloudiness: data.clouds.all,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        sunrise: new Date(data.sys.sunrise * 1000),
        sunset: new Date(data.sys.sunset * 1000)
      },
      timestamp: new Date(data.dt * 1000),
      source: 'openweathermap'
    };

    logger.debug('Weather data fetched successfully', {
      location: weatherData.location.name,
      temperature: weatherData.current.temperature
    });

    return { success: true, data: weatherData };
  } catch (error) {
    logger.error('Failed to fetch current weather', {
      error: error.message,
      latitude,
      longitude
    });
    
    return { success: false, error: error.message };
  }
};

// Get weather forecast
const getWeatherForecast = async (latitude = DEFAULT_COORDINATES.latitude, longitude = DEFAULT_COORDINATES.longitude, days = 5) => {
  try {
    if (!WEATHER_API_KEY) {
      throw new Error('Weather API key not configured');
    }

    const response = await axios.get(`${WEATHER_API_URL}/forecast`, {
      params: {
        lat: latitude,
        lon: longitude,
        appid: WEATHER_API_KEY,
        units: 'metric',
        lang: 'en'
      },
      timeout: 5000
    });

    const data = response.data;
    
    // Group forecast by day
    const dailyForecasts = {};
    
    data.list.forEach(item => {
      const date = new Date(item.dt * 1000).toDateString();
      
      if (!dailyForecasts[date]) {
        dailyForecasts[date] = {
          date: new Date(item.dt * 1000),
          temperatures: [],
          humidity: [],
          pressure: [],
          windSpeed: [],
          rainfall: 0,
          descriptions: [],
          icons: []
        };
      }
      
      dailyForecasts[date].temperatures.push(item.main.temp);
      dailyForecasts[date].humidity.push(item.main.humidity);
      dailyForecasts[date].pressure.push(item.main.pressure);
      dailyForecasts[date].windSpeed.push(item.wind.speed * 3.6);
      dailyForecasts[date].rainfall += item.rain?.['3h'] || 0;
      dailyForecasts[date].descriptions.push(item.weather[0].description);
      dailyForecasts[date].icons.push(item.weather[0].icon);
    });

    // Process daily forecasts
    const forecast = Object.values(dailyForecasts).slice(0, days).map(day => ({
      date: day.date,
      temperature: {
        min: Math.round(Math.min(...day.temperatures)),
        max: Math.round(Math.max(...day.temperatures)),
        avg: Math.round(day.temperatures.reduce((a, b) => a + b, 0) / day.temperatures.length)
      },
      humidity: Math.round(day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length),
      pressure: Math.round(day.pressure.reduce((a, b) => a + b, 0) / day.pressure.length),
      windSpeed: Math.round(day.windSpeed.reduce((a, b) => a + b, 0) / day.windSpeed.length),
      rainfall: Math.round(day.rainfall * 10) / 10, // Round to 1 decimal
      description: day.descriptions[0], // Use first description of the day
      icon: day.icons[0]
    }));

    const forecastData = {
      location: {
        name: data.city.name,
        country: data.city.country,
        coordinates: {
          latitude: data.city.coord.lat,
          longitude: data.city.coord.lon
        }
      },
      forecast,
      timestamp: new Date(),
      source: 'openweathermap'
    };

    logger.debug('Weather forecast fetched successfully', {
      location: forecastData.location.name,
      days: forecast.length
    });

    return { success: true, data: forecastData };
  } catch (error) {
    logger.error('Failed to fetch weather forecast', {
      error: error.message,
      latitude,
      longitude
    });
    
    return { success: false, error: error.message };
  }
};

// Get weather alerts
const getWeatherAlerts = async (latitude = DEFAULT_COORDINATES.latitude, longitude = DEFAULT_COORDINATES.longitude) => {
  try {
    if (!WEATHER_API_KEY) {
      throw new Error('Weather API key not configured');
    }

    const response = await axios.get(`${WEATHER_API_URL}/onecall`, {
      params: {
        lat: latitude,
        lon: longitude,
        appid: WEATHER_API_KEY,
        exclude: 'minutely,hourly,daily',
        units: 'metric'
      },
      timeout: 5000
    });

    const alerts = response.data.alerts || [];
    
    const processedAlerts = alerts.map(alert => ({
      event: alert.event,
      description: alert.description,
      start: new Date(alert.start * 1000),
      end: new Date(alert.end * 1000),
      sender: alert.sender_name,
      tags: alert.tags || []
    }));

    logger.debug('Weather alerts fetched successfully', {
      alertCount: processedAlerts.length
    });

    return { success: true, data: processedAlerts };
  } catch (error) {
    logger.error('Failed to fetch weather alerts', {
      error: error.message,
      latitude,
      longitude
    });
    
    return { success: false, error: error.message };
  }
};

// Analyze weather for irrigation recommendations
const analyzeWeatherForIrrigation = (currentWeather, forecast) => {
  const recommendations = {
    shouldIrrigate: true,
    confidence: 0.5,
    reasons: [],
    timing: 'now',
    adjustments: {}
  };

  // Check current conditions
  if (currentWeather.current.humidity > 80) {
    recommendations.shouldIrrigate = false;
    recommendations.confidence += 0.2;
    recommendations.reasons.push('High humidity detected');
  }

  if (currentWeather.current.windSpeed > 20) {
    recommendations.adjustments.duration = 'increase';
    recommendations.reasons.push('High wind speed - increase duration');
  }

  // Check forecast for rain
  const nextDayForecast = forecast.forecast[0];
  if (nextDayForecast && nextDayForecast.rainfall > 5) {
    recommendations.shouldIrrigate = false;
    recommendations.confidence += 0.3;
    recommendations.reasons.push(`Rain expected: ${nextDayForecast.rainfall}mm`);
  }

  // Check temperature
  if (currentWeather.current.temperature > 35) {
    recommendations.timing = 'early_morning';
    recommendations.reasons.push('High temperature - irrigate early morning');
  }

  // Adjust confidence
  recommendations.confidence = Math.min(1, Math.max(0, recommendations.confidence));

  return recommendations;
};

// Get irrigation timing recommendation based on weather
const getIrrigationTiming = async (latitude, longitude) => {
  try {
    const currentWeatherResult = await getCurrentWeather(latitude, longitude);
    const forecastResult = await getWeatherForecast(latitude, longitude, 2);

    if (!currentWeatherResult.success || !forecastResult.success) {
      return {
        success: false,
        error: 'Failed to fetch weather data for analysis'
      };
    }

    const analysis = analyzeWeatherForIrrigation(
      currentWeatherResult.data,
      forecastResult.data
    );

    return {
      success: true,
      data: {
        recommendation: analysis,
        weather: {
          current: currentWeatherResult.data.current,
          forecast: forecastResult.data.forecast.slice(0, 2)
        }
      }
    };
  } catch (error) {
    logger.error('Failed to analyze weather for irrigation', {
      error: error.message
    });
    
    return { success: false, error: error.message };
  }
};

// Cache weather data to reduce API calls
const weatherCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

const getCachedWeather = (key) => {
  const cached = weatherCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedWeather = (key, data) => {
  weatherCache.set(key, {
    data,
    timestamp: Date.now()
  });
};

// Get weather with caching
const getWeatherWithCache = async (latitude, longitude, type = 'current') => {
  const cacheKey = `${type}_${latitude}_${longitude}`;
  const cached = getCachedWeather(cacheKey);
  
  if (cached) {
    logger.debug('Weather data served from cache', { type, cacheKey });
    return { success: true, data: cached, fromCache: true };
  }

  let result;
  if (type === 'current') {
    result = await getCurrentWeather(latitude, longitude);
  } else if (type === 'forecast') {
    result = await getWeatherForecast(latitude, longitude);
  }

  if (result.success) {
    setCachedWeather(cacheKey, result.data);
  }

  return result;
};

module.exports = {
  getCurrentWeather,
  getWeatherForecast,
  getWeatherAlerts,
  analyzeWeatherForIrrigation,
  getIrrigationTiming,
  getWeatherWithCache
};
