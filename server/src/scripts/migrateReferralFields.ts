/**
 * Migration Script: Add Referral Fields to Existing Users
 * 
 * This script:
 * 1. Generates unique referral codes for all existing users
 * 2. Initializes referralEarnings to 0
 * 3. Sets hasMadeFirstDeposit based on deposit history
 * 4. Initializes referredUsers array as empty
 * 
 * Run with: npx ts-node server/src/scripts/migrateReferralFields.ts
 */

import mongoose from 'mongoose';
import { User } from '../models/User.model.js';
import { Transaction } from '../models/Transaction.model.js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Generate a unique referral code
 */
function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'REF';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Check if referral code already exists
 */
async function isCodeUnique(code: string): Promise<boolean> {
  const existing = await User.findOne({ referralCode: code });
  return !existing;
}

/**
 * Generate a unique referral code (retry if collision)
 */
async function generateUniqueReferralCode(): Promise<string> {
  let code = generateReferralCode();
  let attempts = 0;
  const maxAttempts = 10;

  while (!(await isCodeUnique(code)) && attempts < maxAttempts) {
    code = generateReferralCode();
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique referral code after multiple attempts');
  }

  return code;
}

/**
 * Main migration function
 */
async function migrateReferralFields() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/teen-patti';
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get all users
    const users = await User.find({});
    console.log(`\n👥 Found ${users.length} users to migrate\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of users) {
      try {
        let needsUpdate = false;

        // 1. Generate referral code if not exists
        if (!user.referralCode) {
          user.referralCode = await generateUniqueReferralCode();
          console.log(`✅ Generated referral code for ${user.username}: ${user.referralCode}`);
          needsUpdate = true;
        } else {
          console.log(`⏭️  ${user.username} already has referral code: ${user.referralCode}`);
        }

        // 2. Initialize referralEarnings if not set
        if (user.referralEarnings === undefined || user.referralEarnings === null) {
          user.referralEarnings = 0;
          needsUpdate = true;
        }

        // 3. Initialize referredUsers array if not exists
        if (!user.referredUsers) {
          user.referredUsers = [];
          needsUpdate = true;
        }

        // 4. Set hasMadeFirstDeposit based on approved deposits
        if (user.hasMadeFirstDeposit === undefined || user.hasMadeFirstDeposit === null) {
          const hasDeposits = await Transaction.exists({
            userId: user._id,
            type: 'deposit',
            status: 'approved'
          });

          user.hasMadeFirstDeposit = !!hasDeposits;
          
          if (hasDeposits) {
            console.log(`   💳 ${user.username} has made deposits - setting hasMadeFirstDeposit = true`);
          }
          
          needsUpdate = true;
        }

        // 5. Calculate totalDeposited for Joker eligibility
        if (user.totalDeposited === undefined || user.totalDeposited === null) {
          const deposits = await Transaction.aggregate([
            {
              $match: {
                userId: user._id,
                type: 'deposit',
                status: 'approved'
              }
            },
            {
              $group: {
                _id: null,
                total: { $sum: '$amount' }
              }
            }
          ]);

          user.totalDeposited = deposits.length > 0 ? deposits[0].total : 0;
          
          if (user.totalDeposited > 0) {
            console.log(`   💰 ${user.username} total deposited: ₹${user.totalDeposited}`);
          }
          
          needsUpdate = true;
        }

        // Save if any updates were made
        if (needsUpdate) {
          await user.save();
          updated++;
          console.log(`✅ Updated ${user.username}\n`);
        } else {
          skipped++;
        }

      } catch (userError) {
        errors++;
        console.error(`❌ Error migrating user ${user.username}:`, userError);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully updated: ${updated} users`);
    console.log(`⏭️  Skipped (already migrated): ${skipped} users`);
    console.log(`❌ Errors: ${errors} users`);
    console.log('='.repeat(60) + '\n');

    // Verify migration
    const usersWithoutCode = await User.countDocuments({
      $or: [
        { referralCode: { $exists: false } },
        { referralCode: null },
        { referralCode: '' }
      ]
    });

    if (usersWithoutCode === 0) {
      console.log('✅ VERIFICATION PASSED: All users have referral codes');
    } else {
      console.warn(`⚠️  WARNING: ${usersWithoutCode} users still missing referral codes`);
    }

    // Close connection
    await mongoose.disconnect();
    console.log('\n👋 Migration completed. Connection closed.\n');
    process.exit(0);

  } catch (error) {
    console.error('💥 Migration failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run migration
console.log('\n' + '='.repeat(60));
console.log('🚀 STARTING REFERRAL FIELDS MIGRATION');
console.log('='.repeat(60) + '\n');

migrateReferralFields();
