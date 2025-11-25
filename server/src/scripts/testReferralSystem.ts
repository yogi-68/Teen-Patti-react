/**
 * Test Script: Verify Referral System Database Linking
 * 
 * This script tests the complete referral flow:
 * 1. Creates a referrer user with a referral code
 * 2. Creates a referred user using the referral code
 * 3. Verifies the database link (referredBy field)
 * 4. Simulates a deposit approval
 * 5. Verifies the referrer receives the bonus
 */

import mongoose from 'mongoose';
import { User } from '../models/User.model.js';
import { TransactionHistory, TransactionHistoryType } from '../models/TransactionHistory.model.js';
import ReferralService from '../services/ReferralService.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/teen-patti';

async function testReferralSystem() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Create or find referrer user
    console.log('👤 Step 1: Setting up REFERRER user...');
    let referrer = await User.findOne({ username: 'test_referrer' });
    
    if (!referrer) {
      referrer = await User.create({
        username: 'test_referrer',
        email: 'referrer@test.com',
        password: 'password123',
        referralCode: 'TESTREF001',
        practiceTrial: 100,
        realToken: 0,
        referralEarnings: 0
      });
      console.log(`   ✅ Created referrer: ${referrer.username} with code ${referrer.referralCode}`);
    } else {
      console.log(`   ℹ️  Using existing referrer: ${referrer.username} (${referrer.referralCode})`);
    }
    console.log(`   - Referrer ID: ${referrer._id}`);
    console.log(`   - Initial realToken: ₹${referrer.realToken}`);
    console.log(`   - Initial referralEarnings: ₹${referrer.referralEarnings}`);

    // Step 2: Create referred user
    console.log('\n👤 Step 2: Creating REFERRED user...');
    
    // Delete test user if exists
    await User.deleteOne({ username: 'test_referred' });
    
    const referred = await User.create({
      username: 'test_referred',
      email: 'referred@test.com',
      password: 'password123',
      referredBy: referrer._id.toString(), // Link to referrer
      practiceTrial: 100,
      realToken: 0
    });
    
    console.log(`   ✅ Created referred user: ${referred.username}`);
    console.log(`   - Referred User ID: ${referred._id}`);
    console.log(`   - referredBy: ${referred.referredBy}`);

    // Step 3: Verify database link
    console.log('\n🔍 Step 3: Verifying database link...');
    const referredUserCheck = await User.findById(referred._id);
    const referrerCheck = await User.findById(referredUserCheck?.referredBy);
    
    if (referrerCheck && referrerCheck._id.toString() === referrer._id.toString()) {
      console.log(`   ✅ DATABASE LINK VERIFIED!`);
      console.log(`   - Referred user ${referred.username} is linked to ${referrerCheck.username}`);
    } else {
      console.log(`   ❌ DATABASE LINK FAILED!`);
      console.log(`   - referredBy: ${referredUserCheck?.referredBy}`);
      console.log(`   - Expected: ${referrer._id}`);
      return;
    }

    // Step 4: Simulate deposit (create transaction history entry)
    console.log('\n💰 Step 4: Simulating deposit approval...');
    const depositAmount = 1000;
    
    // First deposit
    await TransactionHistory.create({
      userId: referred._id.toString(),
      type: TransactionHistoryType.DEPOSIT,
      amount: depositAmount,
      balanceBefore: 0,
      balanceAfter: depositAmount,
      description: `Test deposit for ${referred.username}`
    });
    
    console.log(`   ✅ Created deposit transaction: ₹${depositAmount}`);

    // Step 5: Process referral bonus
    console.log('\n🎁 Step 5: Processing referral bonus...');
    const result = await ReferralService.processDepositBonus(
      referred._id.toString(),
      depositAmount
    );

    if (result.bonusProcessed) {
      console.log(`   ✅ BONUS PROCESSED SUCCESSFULLY!`);
      console.log(`   - Bonus Amount: ₹${result.bonusAmount}`);
      console.log(`   - Referrer ID: ${result.referrerId}`);
    } else {
      console.log(`   ❌ BONUS PROCESSING FAILED!`);
    }

    // Step 6: Verify referrer's balance updated
    console.log('\n💵 Step 6: Verifying referrer\'s balance...');
    const updatedReferrer = await User.findById(referrer._id);
    
    console.log(`   - Previous realToken: ₹${referrer.realToken}`);
    console.log(`   - Current realToken: ₹${updatedReferrer?.realToken}`);
    console.log(`   - referralEarnings: ₹${updatedReferrer?.referralEarnings}`);
    
    const expectedBonus = Math.floor(depositAmount * 0.05); // 5% of 1000 = 50
    
    if (updatedReferrer?.realToken === referrer.realToken + expectedBonus) {
      console.log(`   ✅ BALANCE UPDATED CORRECTLY! (+₹${expectedBonus})`);
    } else {
      console.log(`   ❌ BALANCE UPDATE FAILED!`);
      console.log(`   - Expected: ₹${referrer.realToken + expectedBonus}`);
      console.log(`   - Got: ₹${updatedReferrer?.realToken}`);
    }

    // Step 7: Check transaction history
    console.log('\n📝 Step 7: Checking transaction history...');
    const bonusHistory = await TransactionHistory.findOne({
      userId: referrer._id.toString(),
      type: TransactionHistoryType.REFERRAL_BONUS
    }).sort({ createdAt: -1 });
    
    if (bonusHistory) {
      console.log(`   ✅ Transaction history entry found:`);
      console.log(`   - Amount: ₹${bonusHistory.amount}`);
      console.log(`   - Description: ${bonusHistory.description}`);
      console.log(`   - From: ${bonusHistory.fromUsername}`);
    } else {
      console.log(`   ❌ No transaction history entry found`);
    }

    console.log('\n🎉 TEST COMPLETE!\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testReferralSystem();
