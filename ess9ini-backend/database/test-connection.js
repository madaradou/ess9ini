const mongoose = require('mongoose');
require('dotenv').config();

const testConnection = async () => {
  try {
    console.log('🔗 Testing MongoDB connection...');
    console.log('📍 Connection string:', process.env.MONGODB_URI?.replace(/\/\/.*:.*@/, '//***:***@'));
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log('📊 Database name:', mongoose.connection.db.databaseName);
    console.log('🌐 Connection state:', mongoose.connection.readyState);
    
    // Test basic operations
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📁 Existing collections:', collections.map(c => c.name));
    
    // Create a simple test document
    const testCollection = mongoose.connection.db.collection('connection_test');
    const testDoc = {
      message: 'Connection test successful',
      timestamp: new Date(),
      server: 'ess9ini-backend'
    };
    
    await testCollection.insertOne(testDoc);
    console.log('✅ Test document inserted successfully');
    
    // Clean up test document
    await testCollection.deleteOne({ message: 'Connection test successful' });
    console.log('🧹 Test document cleaned up');
    
    console.log('\n🎉 MongoDB connection test passed!');
    console.log('✅ Ready to import your database');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('\n🔐 Authentication Error Solutions:');
      console.log('1. Check your username and password in the connection string');
      console.log('2. Make sure the user exists in MongoDB Atlas Database Access');
      console.log('3. Verify the user has "Read and write to any database" permissions');
    }
    
    if (error.message.includes('IP')) {
      console.log('\n🌐 Network Error Solutions:');
      console.log('1. Add your IP address to MongoDB Atlas Network Access');
      console.log('2. Or allow access from anywhere (0.0.0.0/0) for development');
    }
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n🔗 DNS Error Solutions:');
      console.log('1. Check your internet connection');
      console.log('2. Verify the cluster URL in your connection string');
      console.log('3. Make sure your cluster is running in MongoDB Atlas');
    }
    
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('📴 Connection closed');
  }
};

// Run the test
if (require.main === module) {
  testConnection();
}

module.exports = { testConnection };
