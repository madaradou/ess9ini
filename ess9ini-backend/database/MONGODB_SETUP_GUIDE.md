# 🍃 MongoDB Atlas Setup Guide for Ess9ini

This guide will walk you through setting up MongoDB Atlas for your Ess9ini Smart Farm project, step by step.

## 📋 Prerequisites

- A MongoDB Atlas account (free tier is sufficient)
- Your backend project ready

## 🚀 Step-by-Step Setup

### Step 1: Create Database in MongoDB Atlas

1. **Go to your MongoDB Atlas Dashboard**
   - You're already in the right place based on your screenshot!

2. **Create a Database**
   - Click on **"Create Database on Atlas"** (the first option you see)
   - OR click **"Browse Collections"** if you want to create it manually

3. **Database Configuration**
   - **Database Name**: `ess9ini-farm`
   - **Collection Name**: `users` (we'll create others automatically)

### Step 2: Get Your Connection String

1. **Click on "Connect" button** in your cluster
2. **Choose "Connect your application"**
3. **Select "Node.js" as driver** and version 4.1 or later
4. **Copy the connection string** - it looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Step 3: Configure Network Access

1. **Go to "Network Access" in the left sidebar**
2. **Click "Add IP Address"**
3. **Choose "Allow Access from Anywhere"** (for development)
   - Or add your specific IP address for better security
4. **Click "Confirm"**

### Step 4: Create Database User

1. **Go to "Database Access" in the left sidebar**
2. **Click "Add New Database User"**
3. **Choose "Password" authentication**
4. **Set username and password** (remember these!)
5. **Set privileges to "Read and write to any database"**
6. **Click "Add User"**

## 🔧 Configure Your Backend

### Step 1: Update Environment Variables

1. **Open your `.env` file** in the backend directory
2. **Update the MongoDB URI**:
   ```env
   MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/ess9ini-farm?retryWrites=true&w=majority
   DB_NAME=ess9ini-farm
   ```

   **Replace**:
   - `your-username` with your database username
   - `your-password` with your database password
   - `cluster0.xxxxx` with your actual cluster address

### Step 2: Import Sample Data

1. **Open terminal in your backend directory**:
   ```bash
   cd ess9ini-backend
   ```

2. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

3. **Run the database import script**:
   ```bash
   node database/import-database.js --clear
   ```

   This will:
   - ✅ Connect to your MongoDB Atlas database
   - 🧹 Clear any existing data (if --clear flag is used)
   - 📥 Import sample users, farms, sensors, and data
   - 🔍 Verify data integrity
   - 🔧 Create performance indexes

### Step 3: Verify Import Success

You should see output like this:
```
🌱 Ess9ini Database Import Tool
================================

✅ Connected to MongoDB Atlas
🧹 Clearing existing data...
✅ Database cleared successfully
📥 Starting data import...
👥 Importing users...
✅ Imported 2 users
🏡 Importing farms...
✅ Imported 1 farms
📡 Importing sensors...
✅ Imported 4 sensors
📊 Importing sensor readings...
✅ Imported 2 sensor readings
🚿 Importing irrigation events...
✅ Imported 1 irrigation events
🎉 Data import completed successfully!

📋 Database Summary:
👥 Users: 2
🏡 Farms: 1
📡 Sensors: 4
📊 Sensor Readings: 2
🚿 Irrigation Events: 1

🔍 Verifying data integrity...
✅ 1 users have valid farm references
✅ 4 sensors have valid farm references
✅ 2 sensor readings have valid sensor references
✅ Data integrity verification completed

🔧 Creating database indexes...
✅ Database indexes created successfully

🎉 Database setup completed successfully!

📝 Test Credentials:
Farmer Account:
  Email: farmer@ess9ini.com
  Password: 123456

Admin Account:
  Email: admin@ess9ini.com
  Password: 123456

🚀 You can now start your backend server with: npm run dev
```

## 🎯 Test Your Setup

### Step 1: Start Your Backend Server

```bash
npm run dev
```

You should see:
```
🚀 Ess9ini Backend Server Started
📡 Server running on port 5000
🌍 Environment: development
🔗 API URL: http://localhost:5000
✅ Connected to MongoDB Atlas
📊 Database: ess9ini-farm
```

### Step 2: Test API Endpoints

1. **Health Check**:
   ```bash
   curl http://localhost:5000/api/health
   ```

2. **User Registration** (test with new user):
   ```bash
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "123456",
       "firstName": "Test",
       "lastName": "User"
     }'
   ```

3. **User Login** (test with imported user):
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "farmer@ess9ini.com",
       "password": "123456"
     }'
   ```

## 📊 View Your Data in MongoDB Atlas

1. **Go back to MongoDB Atlas Dashboard**
2. **Click "Browse Collections"**
3. **Select your database**: `ess9ini-farm`
4. **Explore the collections**:
   - `users` - User accounts
   - `farms` - Farm information
   - `sensors` - IoT sensors
   - `sensorreadings` - Sensor data
   - `irrigationevents` - Irrigation history

## 🔍 Sample Data Overview

Your database now contains:

### 👥 Users (2 accounts)
- **Farmer Account**: `farmer@ess9ini.com` / `123456`
  - Arabic name: أحمد بن علي
  - Has a farm with 4 zones
  - Phone: +216 98 123 456

- **Admin Account**: `admin@ess9ini.com` / `123456`
  - Arabic name: محمد الإداري
  - System administrator
  - Phone: +216 98 987 654

### 🏡 Farm (1 farm)
- **Name**: مزرعة الزياتين (Olive Farm Gabès)
- **Location**: Gabès, Tunisia
- **Area**: 12.5 hectares
- **4 Zones**: North, South, East, West
- **Crops**: Olive trees and date palms
- **Irrigation**: Drip and flood systems

### 📡 Sensors (4 sensors)
- **ESP32_001**: North zone (Olive trees)
- **ESP32_002**: South zone (Olive trees)
- **ESP32_003**: East zone (Date palms)
- **ESP32_004**: West zone (Olive trees)

### 📊 Data
- Recent sensor readings with moisture, temperature, battery levels
- Sample irrigation event with water usage and efficiency data

## 🛠️ Troubleshooting

### Connection Issues
- ✅ Check your internet connection
- ✅ Verify IP address is whitelisted in Network Access
- ✅ Confirm username/password in Database Access
- ✅ Check connection string format

### Import Issues
- ✅ Make sure you're in the `ess9ini-backend` directory
- ✅ Run `npm install` first
- ✅ Check `.env` file has correct MONGODB_URI
- ✅ Verify MongoDB Atlas cluster is running

### Authentication Issues
- ✅ Use the exact test credentials provided
- ✅ Check if backend server is running on port 5000
- ✅ Verify API endpoints with curl or Postman

## 🎉 Next Steps

1. **Start your frontend** and test the login
2. **Explore the dashboard** with real data
3. **Add more sensors** or modify existing ones
4. **Test irrigation controls** with the sample farm
5. **Customize the data** for your specific needs

## 📞 Need Help?

If you encounter any issues:
1. Check the console output for error messages
2. Verify your MongoDB Atlas configuration
3. Make sure all environment variables are set correctly
4. Test the connection with the health endpoint first

Your Ess9ini Smart Farm database is now ready! 🌱🚀
