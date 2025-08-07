const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import models
const User = require('../src/models/User');
const Farm = require('../src/models/Farm');
const Sensor = require('../src/models/Sensor');
const SensorReading = require('../src/models/SensorReading');
const IrrigationEvent = require('../src/models/IrrigationEvent');

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB Atlas');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Clear existing data
const clearDatabase = async () => {
  try {
    console.log('🧹 Clearing existing data...');
    
    await User.deleteMany({});
    await Farm.deleteMany({});
    await Sensor.deleteMany({});
    await SensorReading.deleteMany({});
    await IrrigationEvent.deleteMany({});
    
    console.log('✅ Database cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
    throw error;
  }
};

// Convert ObjectId strings to proper ObjectIds
const convertObjectIds = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(convertObjectIds);
  } else if (obj !== null && typeof obj === 'object') {
    if (obj.$oid) {
      return new mongoose.Types.ObjectId(obj.$oid);
    } else if (obj.$date) {
      return new Date(obj.$date);
    } else {
      const converted = {};
      for (const key in obj) {
        converted[key] = convertObjectIds(obj[key]);
      }
      return converted;
    }
  }
  return obj;
};

// Import data from JSON file
const importData = async () => {
  try {
    console.log('📥 Starting data import...');

    // Read the seed data file
    const seedDataPath = path.join(__dirname, 'ess9ini-database-seed.json');
    const rawData = JSON.parse(fs.readFileSync(seedDataPath, 'utf8'));

    // Convert ObjectIds and dates
    const seedData = convertObjectIds(rawData);
    const collections = seedData.collections;
    
    // Import Users
    if (collections.users && collections.users.length > 0) {
      console.log('👥 Importing users...');
      try {
        await User.insertMany(collections.users, { ordered: false });
        console.log(`✅ Imported ${collections.users.length} users`);
      } catch (error) {
        console.error('❌ Error importing users:', error.message);
        // Try importing one by one to identify problematic records
        for (const user of collections.users) {
          try {
            await User.create(user);
          } catch (userError) {
            console.error(`❌ Failed to import user ${user.email}:`, userError.message);
          }
        }
      }
    }

    // Import Farms
    if (collections.farms && collections.farms.length > 0) {
      console.log('🏡 Importing farms...');
      try {
        await Farm.insertMany(collections.farms, { ordered: false });
        console.log(`✅ Imported ${collections.farms.length} farms`);
      } catch (error) {
        console.error('❌ Error importing farms:', error.message);
        for (const farm of collections.farms) {
          try {
            await Farm.create(farm);
          } catch (farmError) {
            console.error(`❌ Failed to import farm ${farm.name}:`, farmError.message);
          }
        }
      }
    }

    // Import Sensors
    if (collections.sensors && collections.sensors.length > 0) {
      console.log('📡 Importing sensors...');
      try {
        await Sensor.insertMany(collections.sensors, { ordered: false });
        console.log(`✅ Imported ${collections.sensors.length} sensors`);
      } catch (error) {
        console.error('❌ Error importing sensors:', error.message);
        for (const sensor of collections.sensors) {
          try {
            await Sensor.create(sensor);
          } catch (sensorError) {
            console.error(`❌ Failed to import sensor ${sensor.name}:`, sensorError.message);
          }
        }
      }
    }

    // Import Sensor Readings
    if (collections.sensorreadings && collections.sensorreadings.length > 0) {
      console.log('📊 Importing sensor readings...');
      try {
        await SensorReading.insertMany(collections.sensorreadings, { ordered: false });
        console.log(`✅ Imported ${collections.sensorreadings.length} sensor readings`);
      } catch (error) {
        console.error('❌ Error importing sensor readings:', error.message);
        for (const reading of collections.sensorreadings) {
          try {
            await SensorReading.create(reading);
          } catch (readingError) {
            console.error(`❌ Failed to import sensor reading:`, readingError.message);
          }
        }
      }
    }

    // Import Irrigation Events
    if (collections.irrigationevents && collections.irrigationevents.length > 0) {
      console.log('🚿 Importing irrigation events...');
      try {
        await IrrigationEvent.insertMany(collections.irrigationevents, { ordered: false });
        console.log(`✅ Imported ${collections.irrigationevents.length} irrigation events`);
      } catch (error) {
        console.error('❌ Error importing irrigation events:', error.message);
        for (const event of collections.irrigationevents) {
          try {
            await IrrigationEvent.create(event);
          } catch (eventError) {
            console.error(`❌ Failed to import irrigation event:`, eventError.message);
          }
        }
      }
    }
    
    console.log('🎉 Data import completed successfully!');
    
    // Display summary
    console.log('\n📋 Database Summary:');
    console.log(`👥 Users: ${await User.countDocuments()}`);
    console.log(`🏡 Farms: ${await Farm.countDocuments()}`);
    console.log(`📡 Sensors: ${await Sensor.countDocuments()}`);
    console.log(`📊 Sensor Readings: ${await SensorReading.countDocuments()}`);
    console.log(`🚿 Irrigation Events: ${await IrrigationEvent.countDocuments()}`);
    
  } catch (error) {
    console.error('❌ Error importing data:', error.message);
    throw error;
  }
};

// Verify data integrity
const verifyData = async () => {
  try {
    console.log('\n🔍 Verifying data integrity...');
    
    // Check if users have valid farms
    const users = await User.find({ farmId: { $ne: null } }).populate('farmId');
    const usersWithFarms = users.filter(user => user.farmId);
    console.log(`✅ ${usersWithFarms.length} users have valid farm references`);
    
    // Check if sensors belong to valid farms
    const sensors = await Sensor.find().populate('farmId');
    const sensorsWithFarms = sensors.filter(sensor => sensor.farmId);
    console.log(`✅ ${sensorsWithFarms.length} sensors have valid farm references`);
    
    // Check if sensor readings have valid sensors
    const readings = await SensorReading.find().populate('sensorId');
    const readingsWithSensors = readings.filter(reading => reading.sensorId);
    console.log(`✅ ${readingsWithSensors.length} sensor readings have valid sensor references`);
    
    console.log('✅ Data integrity verification completed');
    
  } catch (error) {
    console.error('❌ Error verifying data:', error.message);
    throw error;
  }
};

// Create indexes for better performance
const createIndexes = async () => {
  try {
    console.log('\n🔧 Creating database indexes...');
    
    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ farmId: 1 });
    
    // Farm indexes
    await Farm.collection.createIndex({ owner: 1 });
    await Farm.collection.createIndex({ 'location.coordinates': '2dsphere' });
    
    // Sensor indexes
    await Sensor.collection.createIndex({ farmId: 1 });
    await Sensor.collection.createIndex({ deviceId: 1 }, { unique: true });
    
    // Sensor Reading indexes
    await SensorReading.collection.createIndex({ sensorId: 1, timestamp: -1 });
    await SensorReading.collection.createIndex({ farmId: 1, timestamp: -1 });
    
    // Irrigation Event indexes
    await IrrigationEvent.collection.createIndex({ farmId: 1, 'schedule.startTime': -1 });
    await IrrigationEvent.collection.createIndex({ userId: 1, createdAt: -1 });
    
    console.log('✅ Database indexes created successfully');
    
  } catch (error) {
    console.error('❌ Error creating indexes:', error.message);
    throw error;
  }
};

// Main import function
const main = async () => {
  try {
    console.log('🌱 Ess9ini Database Import Tool');
    console.log('================================\n');
    
    // Connect to database
    await connectDB();
    
    // Ask user if they want to clear existing data
    const args = process.argv.slice(2);
    const shouldClear = args.includes('--clear') || args.includes('-c');
    
    if (shouldClear) {
      await clearDatabase();
    }
    
    // Import data
    await importData();
    
    // Verify data integrity
    await verifyData();
    
    // Create indexes
    await createIndexes();
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('Farmer Account:');
    console.log('  Email: farmer@ess9ini.com');
    console.log('  Password: 123456');
    console.log('\nAdmin Account:');
    console.log('  Email: admin@ess9ini.com');
    console.log('  Password: 123456');
    
    console.log('\n🚀 You can now start your backend server with: npm run dev');
    
  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n📴 Database connection closed');
  }
};

// Run the import
if (require.main === module) {
  main();
}

module.exports = { main, importData, clearDatabase, verifyData };
