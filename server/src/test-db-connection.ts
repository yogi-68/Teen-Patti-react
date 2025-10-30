import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

async function testConnection() {
  console.log('🧪 Testing MongoDB Connection...\n');
  console.log('📍 URI:', MONGODB_URI.substring(0, 50) + '...\n');

  try {
    console.log('⏳ Connecting...');
    await mongoose.connect(MONGODB_URI);
    
    console.log('✅ CONNECTION SUCCESSFUL!\n');
    console.log('📊 Connection Details:');
    console.log('   - Database:', mongoose.connection.name);
    console.log('   - Host:', mongoose.connection.host);
    console.log('   - Ready State:', mongoose.connection.readyState);
    
    // Try to create a test user
    console.log('\n🧪 Testing User Creation...');
    
    const UserSchema = new mongoose.Schema({
      username: String,
      coins: { type: Number, default: 100 },
      cashBalance: { type: Number, default: 0 },
      createdAt: { type: Date, default: Date.now }
    });
    
    const TestUser = mongoose.model('User', UserSchema);
    
    const testUser = new TestUser({
      username: 'test_' + Date.now(),
      coins: 100,
      cashBalance: 0
    });
    
    await testUser.save();
    console.log('✅ Test user created successfully!');
    console.log('   - User ID:', testUser._id);
    console.log('   - Username:', testUser.username);
    
    // Clean up
    await TestUser.deleteOne({ _id: testUser._id });
    console.log('✅ Test user deleted (cleanup)');
    
    console.log('\n✅ ALL TESTS PASSED - Database is working correctly!');
    
  } catch (error) {
    console.error('\n❌ CONNECTION FAILED!');
    console.error('Error:', error);
    
    if (error instanceof Error) {
      console.error('\n🔍 Troubleshooting:');
      
      if (error.message.includes('ENOTFOUND')) {
        console.error('   - DNS issue: Cannot resolve MongoDB host');
        console.error('   - Check your internet connection');
        console.error('   - Verify the cluster URL is correct');
      } else if (error.message.includes('authentication')) {
        console.error('   - Authentication failed');
        console.error('   - Check username and password');
        console.error('   - Verify database user has correct permissions');
      } else if (error.message.includes('timeout')) {
        console.error('   - Connection timeout');
        console.error('   - Check MongoDB Atlas Network Access');
        console.error('   - Add 0.0.0.0/0 to allow all IPs (for testing)');
      }
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

testConnection();
