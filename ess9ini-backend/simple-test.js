const mongoose = require('mongoose');
require('dotenv').config();

console.log('Starting simple test...');

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB Atlas');
  console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
  
  // Test User model
  testUserModel();
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  process.exit(1);
});

async function testUserModel() {
  try {
    console.log('Testing User model...');
    const User = require('./src/models/User');
    console.log('User model loaded successfully');
    
    const userCount = await User.countDocuments();
    console.log(`Found ${userCount} users in database`);
    
    // Try to find the admin user
    const adminUser = await User.findOne({ email: 'admin@ess9ini.com' });
    if (adminUser) {
      console.log('Admin user found:', adminUser.firstName, adminUser.lastName);
    } else {
      console.log('Admin user not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error testing User model:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}
