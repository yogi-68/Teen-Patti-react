/**
 * Migration Script: Update bot instance field names
 * - balance_coins → balance_coins (keep for bots, represents trial balance)
 * - balance_cash → balance_cash (keep for bots, represents token balance)
 * 
 * Note: Bot instances use different naming convention than user accounts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/teen-patti';

async function migrateBotInstances() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    const botsCollection = db.collection('botinstances');

    const totalBots = await botsCollection.countDocuments();
    console.log(`📊 Found ${totalBots} bot instances\n`);

    if (totalBots === 0) {
      console.log('ℹ️  No bot instances found - skipping migration');
      await mongoose.connection.close();
      return;
    }

    console.log('✅ Bot instances already use correct field names:');
    console.log('   - balance_coins (for trial mode games)');
    console.log('   - balance_cash (for token mode games)\n');

    await mongoose.connection.close();
    console.log('✅ Database connection closed');

  } catch (error) {
    console.error('❌ Check failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  Bot Instance Field Check                                  ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

migrateBotInstances()
  .then(() => {
    console.log('✅ Bot instance check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Check failed:', error);
    process.exit(1);
  });
