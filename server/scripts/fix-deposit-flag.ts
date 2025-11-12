import mongoose from 'mongoose';
import { User } from '../src/models/User.model';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Fix hasMadeFirstDeposit flag for users who have real coins but flag is false
 * This can happen if the flag wasn't set during early deposits
 */
async function fixDepositFlags() {
  try {
    console.log('🔧 Starting deposit flag fix script...\n');
    
    // Connect to database
    const dbUrl = process.env.DATABASE_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/teen-patti';
    console.log('📡 Connecting to database...');
    await mongoose.connect(dbUrl);
    console.log('✅ Connected to database\n');
    
    // Find users who have real coins but hasMadeFirstDeposit is false
    console.log('🔍 Finding users with realCoins > 0 but hasMadeFirstDeposit = false...');
    
    const usersToFix = await User.find({
      realCoins: { $gt: 0 },
      hasMadeFirstDeposit: { $ne: true }
    });
    
    console.log(`\nFound ${usersToFix.length} users to fix:\n`);
    
    if (usersToFix.length === 0) {
      console.log('✅ No users need fixing! All users with real coins have the flag set correctly.');
      await mongoose.disconnect();
      process.exit(0);
    }
    
    // Display users before fixing
    console.log('Users to update:');
    console.log('─'.repeat(80));
    usersToFix.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (ID: ${user._id})`);
      console.log(`   Real Coins: ₹${user.realCoins}`);
      console.log(`   Total Deposited: ₹${user.totalDeposited || 0}`);
      console.log(`   hasMadeFirstDeposit: ${user.hasMadeFirstDeposit}`);
      console.log('─'.repeat(80));
    });
    
    console.log('\n⚙️  Updating users...\n');
    
    // Update each user
    let successCount = 0;
    let errorCount = 0;
    
    for (const user of usersToFix) {
      try {
        user.hasMadeFirstDeposit = true;
        await user.save();
        console.log(`✅ Fixed: ${user.username} - hasMadeFirstDeposit set to true`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error fixing ${user.username}:`, error);
        errorCount++;
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 Summary:');
    console.log(`   Total users found: ${usersToFix.length}`);
    console.log(`   Successfully fixed: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log('='.repeat(80) + '\n');
    
    if (successCount > 0) {
      console.log('✅ All users with real coins now have hasMadeFirstDeposit = true');
      console.log('🔓 Transfer feature will now be unlocked for these users\n');
    }
    
    // Disconnect and exit
    await mongoose.disconnect();
    console.log('📡 Disconnected from database');
    console.log('🎉 Script completed successfully!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
fixDepositFlags();
