/**
 * Simple Script: Generate Referral Codes for All Users
 * 
 * This script generates unique referral codes for any user that doesn't have one.
 * Run with: npm run generate-codes
 */

import mongoose from 'mongoose';
import { User } from '../models/User.model.js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function generateReferralCodes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/teen-patti';
    await mongoose.connect(mongoUri);
    
    console.log('✅ Connected to MongoDB');
    console.log('📊 Finding users without referral codes...');

    // Find all users without referral codes
    const usersWithoutCodes = await User.find({
      $or: [
        { referralCode: { $exists: false } },
        { referralCode: null },
        { referralCode: '' }
      ]
    });

    console.log(`📝 Found ${usersWithoutCodes.length} users without referral codes`);

    if (usersWithoutCodes.length === 0) {
      console.log('✅ All users already have referral codes!');
      await mongoose.disconnect();
      process.exit(0);
    }

    let updated = 0;
    let errors = 0;

    console.log('🔄 Generating referral codes...\n');

    for (const user of usersWithoutCodes) {
      try {
        console.log(`Processing: ${user.username} (${user._id})`);
        
        // Simply save the user - the pre-save hook will generate the code
        await user.save();
        
        console.log(`✅ Generated code: ${user.referralCode}`);
        updated++;
      } catch (error: any) {
        console.error(`❌ Error for ${user.username}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Successfully generated: ${updated} codes`);
    console.log(`❌ Errors: ${errors}`);

    // Verify all users now have codes
    const remaining = await User.countDocuments({
      $or: [
        { referralCode: { $exists: false } },
        { referralCode: null },
        { referralCode: '' }
      ]
    });

    if (remaining === 0) {
      console.log('\n🎉 SUCCESS! All users now have referral codes!');
    } else {
      console.log(`\n⚠️ Warning: ${remaining} users still missing codes`);
    }

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('💥 Script failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the script
generateReferralCodes();
