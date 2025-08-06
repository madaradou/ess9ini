# 🌱 Ess9ini Smart Farm Dashboard

**مزرعة الزياتين، قابس** | **Olive Farm, Gabès**

A revolutionary smart farming dashboard designed specifically for Tunisian agriculture, combining IoT sensors, AI-powered predictions, and real-time monitoring to optimize irrigation and crop management.

![Dashboard Preview](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![React](https://img.shields.io/badge/React-18.0+-blue)
![Node.js](https://img.shields.io/badge/Node.js-16.0+-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🚀 Overview

Ess9ini transforms traditional farming into smart, data-driven agriculture through:
- **Real-time soil moisture monitoring** with IoT sensors
- **AI-powered irrigation recommendations** based on weather and soil data
- **Interactive farm mapping** with visual sensor status
- **Arabic/English bilingual interface** for Tunisian farmers
- **Mobile-responsive design** for field access

## ✨ Key Features

### 📊 **Real-time Monitoring**
- Live soil moisture levels from multiple sensors
- Temperature and environmental condition tracking
- 24-hour change tracking and trend analysis
- Battery status monitoring for all sensors

### 🤖 **AI-Powered Predictions**
- Machine learning irrigation recommendations
- Weather-based watering schedules
- Crop-specific optimization (Olive Trees, Date Palms, Cereals)
- Confidence scoring for all predictions

### 💧 **Smart Irrigation Control**
- One-click irrigation activation
- Scheduled watering for optimal times
- Water usage optimization
- Emergency irrigation alerts

### 🗺️ **Interactive Farm Mapping**
- Visual sensor placement on farm layout
- Color-coded moisture levels (🔴 Critical, 🟡 Warning, 🟢 Optimal)
- Click-to-view detailed sensor information
- Real-time status indicators

### 🚨 **Alert Management**
- Priority-based alert system ([CRITICAL], [WARNING], [INFO])
- Acknowledgeable notifications
- Visual and audio alert indicators
- Historical alert tracking

### 🇹🇳 **Tunisian Context**
- Arabic language support (رطوبة التربة، توصية الري)
- Local units (hectares, Celsius)
- Regional crop types and farming practices
- Gabès-specific weather integration

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern UI framework
- **CSS3** - Custom styling with glass-morphism effects
- **SVG Graphics** - Interactive farm mapping
- **Responsive Design** - Mobile-first approach

### Backend Integration Ready
- **Arduino/IoT** - Sensor data collection
- **REST APIs** - Real-time data synchronization
- **WebSocket** - Live updates
- **Local Storage** - Offline capability

### AI & Analytics
- **Machine Learning** - Irrigation prediction models
- **Weather APIs** - Real-time weather integration
- **Data Analytics** - Historical trend analysis
- **Predictive Modeling** - Crop optimization

## 📱 User Interface

### Dashboard Layout
```
┌─────────────────────────────────────────┐
│  🏛️ Ess9ini | مزرعة الزياتين، قابس      │
│  📊 Current: 45% | 24h: +2% | 🚨 Alerts │
├─────────────────────────────────────────┤
│           🗺️ Farm Sensor Map            │
│     [Interactive sensor placement]      │
├──────────────────┬──────────────────────┤
│  💧 Avg Moisture │  🎯 Selected Sensor  │
│     [Gauge]      │      [Details]       │
├──────────────────┼──────────────────────┤
│  🌤️ Weather      │  🤖 AI Predictions   │
│   Conditions     │   & Controls         │
├──────────────────┼──────────────────────┤
│  🚨 Alert        │  🔌 Hardware         │
│   Management     │    Status            │
└──────────────────┴──────────────────────┘
```

### Key Interactions
- **Click logo** → Navigate to About page
- **Click sensors** → View detailed information
- **Acknowledge alerts** → Manage notifications
- **Irrigation buttons** → Control watering systems
- **Refresh data** → Update all information

## 🚀 Getting Started

### Prerequisites
- Node.js 16.0 or higher
- npm or yarn package manager
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/ess9ini.git
   cd ess9ini
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```

4. **Open in browser**
   ```
   http://localhost:3001
   ```

### Production Build
```bash
npm run build
npm run serve
```

## 📊 Features in Detail

### Sensor Management
- **4 Active Sensors** monitoring different farm zones
- **Real-time Updates** every 30 seconds
- **Battery Monitoring** with low-battery alerts
- **Offline Detection** with automatic reconnection

### Irrigation Intelligence
- **Target Moisture**: 80% for optimal olive growth
- **Current Average**: Real-time calculation across all sensors
- **Gap Analysis**: Automatic deficit calculation
- **Smart Scheduling**: Early morning irrigation recommendations

### Alert System
```javascript
Alert Types:
├── 🚨 CRITICAL - Immediate action required (< 30% moisture)
├── ⚠️  WARNING  - Attention needed (30-60% moisture)
└── ℹ️  INFO     - General information and updates
```

### Multilingual Support
```javascript
Arabic Labels:
├── رطوبة التربة (Soil Moisture)
├── توصية الري (Irrigation Recommendation)
├── أجهزة الاستشعار (Sensors)
├── الري (Irrigation)
└── الطقس (Weather)
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:
```env
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_WEATHER_API_KEY=your_weather_api_key
REACT_APP_FARM_NAME=مزرعة الزياتين، قابس
REACT_APP_FARM_LOCATION=Gabès, Tunisia
REACT_APP_CROP_TYPE=Olive Trees
REACT_APP_FARM_AREA=12.5 hectares
```

### Sensor Configuration
```javascript
// src/config/sensors.js
export const sensorConfig = {
  updateInterval: 30000, // 30 seconds
  moistureThresholds: {
    critical: 30,
    warning: 60,
    optimal: 80
  },
  batteryThresholds: {
    low: 20,
    warning: 40
  }
};
```

## 🌐 API Integration

### Sensor Data Endpoint
```javascript
GET /api/sensors
Response: {
  "sensors": [
    {
      "id": 1,
      "name": "Sensor 1",
      "moistureLevel": 45,
      "temperature": 22,
      "batteryLevel": 85,
      "status": "warning",
      "lastUpdated": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Weather Data Endpoint
```javascript
GET /api/weather?location=gabes
Response: {
  "temperature": 23,
  "humidity": 65,
  "rainfall": 2.5,
  "forecast": "Partly cloudy with chance of rain"
}
```

### Irrigation Control
```javascript
POST /api/irrigation/start
Body: {
  "action": "start-now",
  "duration": 30,
  "zones": [1, 2, 3, 4]
}
```

## 📈 Performance Metrics

### Dashboard Performance
- **Load Time**: < 2 seconds
- **Update Frequency**: Real-time (30s intervals)
- **Mobile Responsive**: 100% compatible
- **Offline Support**: 24-hour data cache

### Sensor Network
- **Coverage**: 12.5 hectares
- **Accuracy**: ±2% moisture reading
- **Battery Life**: 6-12 months per sensor
- **Range**: 1km wireless transmission

## 🔒 Security Features

- **Data Encryption**: All sensor communications encrypted
- **Access Control**: Role-based user permissions
- **Audit Logging**: All irrigation actions logged
- **Backup Systems**: Automatic data backup every 6 hours

## 🚀 Future Roadmap

### Phase 2 - Advanced Features
- [ ] **Satellite Integration** - Crop health monitoring from space
- [ ] **Drone Support** - Aerial farm surveying
- [ ] **Market Integration** - Crop pricing and sales optimization
- [ ] **Community Features** - Farmer network and knowledge sharing

### Phase 3 - AI Enhancement
- [ ] **Computer Vision** - Automated pest and disease detection
- [ ] **Predictive Analytics** - Harvest timing optimization
- [ ] **Climate Modeling** - Long-term weather predictions
- [ ] **Yield Optimization** - Maximum crop output algorithms

## 🤝 Contributing

We welcome contributions from the farming and tech communities!

### Development Setup
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines
- Follow React best practices
- Include tests for new features
- Update documentation
- Ensure mobile compatibility
- Test with real sensor data when possible

## 📞 Support & Contact

### Technical Support
- **Email**: support@ess9ini.com
- **Phone**: +216 XX XXX XXX
- **Documentation**: [docs.ess9ini.com](https://docs.ess9ini.com)

### Business Inquiries
- **Email**: info@ess9ini.com
- **Address**: Gabès, Tunisia
- **LinkedIn**: [Ess9ini Smart Farming](https://linkedin.com/company/ess9ini)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Tunisian Ministry of Agriculture** - Support and guidance
- **Local Farmers** - Real-world testing and feedback
- **IoT Community** - Sensor integration expertise
- **Open Source Contributors** - Code and documentation improvements

---

**Built with ❤️ for Tunisian farmers by the Ess9ini team**

*Transforming agriculture through technology, one farm at a time.*
