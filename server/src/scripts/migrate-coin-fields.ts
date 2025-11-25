/**
 * Migration Script: Update field names from old to new terminology
 * - practiceCoins → practiceTrial
 * - realCoins → realToken
 * 
 * Run this once to migrate existing database records
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/teen-patti';

interface OldUserDoc {
  practiceCoins?: number;
  realCoins?: number;
  practiceTrial?: number;
  realToken?: number;
}

async function migrateDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    const usersCollection = db.collection('users');

    // Check if migration is needed
    const oldFieldsCount = await usersCollection.countDocuments({
      $or: [
        { practiceCoins: { $exists: true } },
        { realCoins: { $exists: true } }
      ]
    });

    console.log(`📊 Found ${oldFieldsCount} users with old field names\n`);

    if (oldFieldsCount === 0) {
      console.log('✅ No migration needed - all users already using new field names');
      await mongoose.connection.close();
      return;
    }

    console.log('🔄 Starting migration...\n');

    // Find all users with old field names
    const usersToMigrate = await usersCollection.find({
      $or: [
        { practiceCoins: { $exists: true } },
        { realCoins: { $exists: true } }
      ]
    }).toArray();

    let migratedCount = 0;
    let skippedCount = 0;

    for (const user of usersToMigrate) {
      const oldUser = user as unknown as OldUserDoc;
      const updates: any = {};
      const unsets: any = {};

      // Migrate practiceCoins → practiceTrial
      if (oldUser.practiceCoins !== undefined) {
        updates.practiceTrial = oldUser.practiceCoins;
        unsets.practiceCoins = '';
        console.log(`  User ${user.username}: practiceCoins (${oldUser.practiceCoins}) → practiceTrial`);
      }

      // Migrate realCoins → realToken
      if (oldUser.realCoins !== undefined) {
        updates.realToken = oldUser.realCoins;
        unsets.realCoins = '';
        console.log(`  User ${user.username}: realCoins (${oldUser.realCoins}) → realToken`);
      }

      if (Object.keys(updates).length > 0) {
        const updateOps: any = {};
        if (Object.keys(updates).length > 0) updateOps.$set = updates;
        if (Object.keys(unsets).length > 0) updateOps.$unset = unsets;

        await usersCollection.updateOne(
          { _id: user._id },
          updateOps
        );
        migratedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`  ✅ Migrated: ${migratedCount} users`);
    console.log(`  ⏭️  Skipped: ${skippedCount} users`);
    console.log(`  📝 Total processed: ${usersToMigrate.length} users\n`);

    // Verify migration
    const remainingOldFields = await usersCollection.countDocuments({
      $or: [
        { practiceCoins: { $exists: true } },
        { realCoins: { $exists: true } }
      ]
    });

    if (remainingOldFields === 0) {
      console.log('✅ Migration completed successfully!');
      console.log('   All users now using new field names: practiceTrial, realToken\n');
    } else {
      console.log(`⚠️  Warning: ${remainingOldFields} users still have old field names\n`);
    }

    await mongoose.connection.close();
    console.log('✅ Database connection closed');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run migration
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  Database Field Migration: coins → trial/token            ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

migrateDatabase()
  .then(() => {
    console.log('✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });
