# Ess9ini Smart Farm Backend API

🌱 **Backend API for Ess9ini Smart Farming Dashboard** - A comprehensive Node.js/Express API for managing smart farm operations in Tunisia.

## 🚀 Features

- **Authentication & Authorization** - JWT-based auth with role-based access control
- **Farm Management** - Multi-farm support with zones and crop management
- **Sensor Integration** - Real-time sensor data collection and processing
- **Irrigation Control** - Automated and manual irrigation management
- **AI Recommendations** - Smart irrigation suggestions based on data analysis
- **Weather Integration** - OpenWeatherMap API integration
- **Alert System** - Multi-channel notifications (Email, SMS, Push)
- **Data Analytics** - Historical data analysis and reporting
- **Tunisian Context** - Arabic language support and local preferences

## 📋 Prerequisites

- Node.js 16+ 
- MongoDB Atlas account
- OpenWeatherMap API key (optional)
- SMTP credentials for email notifications

## 🛠️ Installation

1. **Clone and navigate to backend directory**
   ```bash
   cd ess9ini-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## ⚙️ Environment Configuration

Create a `.env` file with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3001

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ess9ini-farm
DB_NAME=ess9ini-farm

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_REFRESH_EXPIRE=30d

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Weather API
WEATHER_API_KEY=your-openweathermap-api-key
WEATHER_API_URL=https://api.openweathermap.org/data/2.5

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Arduino/IoT
IOT_API_KEY=your-iot-device-api-key
```

## 📁 Project Structure

```
ess9ini-backend/
├── src/
│   ├── controllers/          # Request handlers
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── farmController.js
│   │   ├── sensorController.js
│   │   └── irrigationController.js
│   ├── models/              # MongoDB schemas
│   │   ├── User.js
│   │   ├── Farm.js
│   │   ├── Sensor.js
│   │   ├── SensorReading.js
│   │   └── IrrigationEvent.js
│   ├── routes/              # API routes
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── farms.js
│   │   ├── sensors.js
│   │   └── irrigation.js
│   ├── middleware/          # Custom middleware
│   │   ├── auth.js
│   │   ├── validation.js
│   │   ├── errorHandler.js
│   │   └── rateLimiter.js
│   ├── services/            # Business logic
│   │   ├── emailService.js
│   │   ├── weatherService.js
│   │   ├── aiService.js
│   │   └── notificationService.js
│   ├── utils/               # Utility functions
│   │   ├── database.js
│   │   ├── logger.js
│   │   └── helpers.js
│   └── config/              # Configuration
│       ├── database.js
│       └── constants.js
├── tests/                   # Test files
├── uploads/                 # File uploads
├── logs/                    # Application logs
├── .env                     # Environment variables
├── .gitignore
├── package.json
└── server.js               # Entry point
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password

### Farms
- `GET /api/farms` - Get user farms
- `GET /api/farms/:id` - Get farm details
- `POST /api/farms` - Create farm
- `PUT /api/farms/:id` - Update farm
- `DELETE /api/farms/:id` - Delete farm
- `POST /api/farms/:id/zones` - Add zone
- `PUT /api/farms/:id/zones/:zoneId` - Update zone

### Sensors
- `GET /api/sensors` - Get farm sensors
- `GET /api/sensors/:id` - Get sensor details
- `POST /api/sensors` - Create sensor
- `PUT /api/sensors/:id` - Update sensor
- `DELETE /api/sensors/:id` - Delete sensor
- `POST /api/sensors/:id/readings` - Add sensor reading
- `GET /api/sensors/:id/readings` - Get sensor readings
- `POST /api/sensors/:id/calibrate` - Calibrate sensor

### Irrigation
- `GET /api/irrigation` - Get irrigation history
- `POST /api/irrigation/start` - Start irrigation
- `POST /api/irrigation/:id/stop` - Stop irrigation
- `GET /api/irrigation/:id` - Get irrigation details
- `PUT /api/irrigation/:id` - Update irrigation
- `GET /api/irrigation/schedule` - Get irrigation schedule

### Health Check
- `GET /api/health` - API health status

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### User Roles
- **Farmer** - Can manage their own farm
- **Technician** - Can access assigned farms
- **Admin** - Full system access

## 📊 Database Schema

### Users Collection
```javascript
{
  email: "farmer@example.com",
  password: "hashed_password",
  firstName: "Ahmed",
  lastName: "Ben Ali",
  role: "farmer",
  farmId: ObjectId,
  language: "ar",
  profile: {
    notifications: { email: true, sms: true },
    preferences: { units: "metric", theme: "light" }
  }
}
```

### Farms Collection
```javascript
{
  name: "مزرعة الزياتين",
  owner: ObjectId,
  location: {
    address: "Gabès, Tunisia",
    coordinates: { latitude: 33.8815, longitude: 10.0982 },
    area: 12.5,
    zones: [{ id: 1, name: "North Field", area: 3.2 }]
  },
  primaryCrop: "olive_trees",
  soilType: "clay_loam"
}
```

### Sensors Collection
```javascript
{
  farmId: ObjectId,
  deviceId: "ESP32_001",
  name: "Sensor 1",
  type: "soil_moisture",
  location: { x: 80, y: 60 },
  calibration: { dryValue: 595, wetValue: 239 },
  status: "active"
}
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📝 Logging

The application uses a custom logging system that outputs to:
- Console (development)
- Log files in `/logs` directory
- Separate error log file

Log levels: ERROR, WARN, INFO, DEBUG

## 🔒 Security Features

- **Rate Limiting** - Prevents API abuse
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Input Validation** - Request validation
- **Password Hashing** - bcrypt with salt rounds
- **JWT Security** - Secure token handling
- **Account Locking** - Failed login protection

## 🌍 Internationalization

- Arabic language support
- Tunisian regional settings
- Multi-language error messages
- Localized date/time formatting

## 📈 Monitoring & Analytics

- Request logging with performance metrics
- Database operation monitoring
- Error tracking and alerting
- User activity logging
- System health checks

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker (Optional)
```bash
docker build -t ess9ini-backend .
docker run -p 5000:5000 ess9ini-backend
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Email: support@ess9ini.com
- Documentation: [API Docs](http://localhost:5000/api/docs)
- Issues: [GitHub Issues](https://github.com/ess9ini/backend/issues)

## 🔄 API Versioning

Current version: v1
Base URL: `http://localhost:5000/api`

## 📚 Additional Resources

- [MongoDB Atlas Setup Guide](https://docs.atlas.mongodb.com/)
- [OpenWeatherMap API](https://openweathermap.org/api)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)

---

**Made with ❤️ for Tunisian Smart Farming** 🇹🇳
