import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

async function testConnection() {

  try {
    await mongoose.connect(MONGODB_URI);
    
    
    // Try to create a test user
    
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
    
    // Clean up
    await TestUser.deleteOne({ _id: testUser._id });
    
    
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
    process.exit(0);
  }
}

testConnection();
