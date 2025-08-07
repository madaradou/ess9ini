# 🚀 Quick Start Guide - Ess9ini Backend

Get your Ess9ini Smart Farm backend up and running in 5 minutes!

## 📋 What You Need

- MongoDB Atlas account (free tier works)
- Node.js 16+ installed
- Your backend files ready

## ⚡ 5-Minute Setup

### Step 1: Install Dependencies (1 minute)

```bash
cd ess9ini-backend
npm install
```

### Step 2: Configure MongoDB Atlas (2 minutes)

1. **Get your MongoDB connection string** from Atlas:
   - Go to your cluster → Connect → Connect your application
   - Copy the connection string

2. **Update `.env` file**:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/ess9ini-farm?retryWrites=true&w=majority
   JWT_SECRET=your-secret-key-here
   ```

### Step 3: Import Sample Data (1 minute)

```bash
npm run db:import:clear
```

This creates a complete database with:
- ✅ 2 test users (farmer + admin)
- ✅ 1 sample farm with 4 zones
- ✅ 4 IoT sensors with data
- ✅ Sample irrigation events

### Step 4: Start the Server (30 seconds)

```bash
npm run dev
```

You should see:
```
🚀 Ess9ini Backend Server Started
📡 Server running on port 5000
✅ Connected to MongoDB Atlas
📊 Database: ess9ini-farm
```

### Step 5: Test It Works (30 seconds)

**Test the API**:
```bash
curl http://localhost:5000/api/health
```

**Test login**:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"farmer@ess9ini.com","password":"123456"}'
```

## 🎯 Test Accounts

Use these accounts to test your frontend:

### 👨‍🌾 Farmer Account
- **Email**: `farmer@ess9ini.com`
- **Password**: `123456`
- **Name**: أحمد بن علي (Ahmed Ben Ali)
- **Has**: Complete farm with 4 sensors

### 👨‍💼 Admin Account
- **Email**: `admin@ess9ini.com`
- **Password**: `123456`
- **Name**: محمد الإداري (Mohamed Admin)
- **Has**: Full system access

## 📊 What's in Your Database

### 🏡 Sample Farm: "مزرعة الزياتين"
- **Location**: Gabès, Tunisia
- **Size**: 12.5 hectares
- **4 Zones**: North, South, East, West
- **Crops**: Olive trees + Date palms

### 📡 4 IoT Sensors
- **ESP32_001**: North zone (75% moisture)
- **ESP32_002**: South zone (68% moisture)
- **ESP32_003**: East zone (82% moisture)
- **ESP32_004**: West zone (71% moisture)

### 🚿 Irrigation Data
- Recent irrigation event
- Water usage: 145 liters
- Efficiency: 96.7%

## 🔧 Available Scripts

```bash
# Start development server
npm run dev

# Start production server
npm start

# Import fresh database (keeps existing data)
npm run db:import

# Import database (clears existing data first)
npm run db:import:clear

# Run tests
npm test
```

## 🌐 API Endpoints

Your backend is now running with these endpoints:

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `GET /api/auth/me` - Get current user

### Health Check
- `GET /api/health` - Server status

### Coming Soon
- Farms, Sensors, Irrigation endpoints

## 🔍 Verify Everything Works

1. **Backend running**: ✅ `http://localhost:5000/api/health`
2. **Database connected**: ✅ Check console for "Connected to MongoDB Atlas"
3. **Data imported**: ✅ Login with test accounts works
4. **Ready for frontend**: ✅ All API endpoints respond

## 🎉 You're Ready!

Your Ess9ini backend is now running with:
- ✅ Complete authentication system
- ✅ Sample farm data
- ✅ IoT sensor simulation
- ✅ MongoDB Atlas integration
- ✅ Production-ready security

**Next**: Connect your React frontend and start building! 🌱

## 🆘 Troubleshooting

### "Connection failed"
- ✅ Check MongoDB Atlas IP whitelist
- ✅ Verify username/password in connection string
- ✅ Ensure cluster is running

### "Import failed"
- ✅ Run `npm install` first
- ✅ Check `.env` file exists and has MONGODB_URI
- ✅ Verify you're in `ess9ini-backend` directory

### "Server won't start"
- ✅ Check if port 5000 is available
- ✅ Verify all dependencies installed
- ✅ Check console for error messages

---

**Happy farming! 🌱🚀**
