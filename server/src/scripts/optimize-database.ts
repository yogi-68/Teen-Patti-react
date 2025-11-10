/**
 * Database Optimization Script
 * Creates indexes for better query performance
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/teen-patti';

async function createIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    console.log('Creating indexes for bot_instances collection...');
    await db.collection('bot_instances').createIndex({ is_active: 1 });
    await db.collection('bot_instances').createIndex({ blueprint_id: 1 });
    await db.collection('bot_instances').createIndex({ created_at: -1 });
    await db.collection('bot_instances').createIndex({ 
      is_active: 1, 
      blueprint_id: 1 
    });
    console.log('✓ bot_instances indexes created');

    console.log('\nCreating indexes for bot_blueprints collection...');
    await db.collection('bot_blueprints').createIndex({ is_active: 1 });
    await db.collection('bot_blueprints').createIndex({ name: 1 });
    await db.collection('bot_blueprints').createIndex({ behavior_profile: 1 });
    console.log('✓ bot_blueprints indexes created');

    console.log('\nCreating indexes for table_seats collection...');
    await db.collection('table_seats').createIndex({ table_id: 1 });
    await db.collection('table_seats').createIndex({ seat_index: 1 });
    await db.collection('table_seats').createIndex({ bot_id: 1 });
    await db.collection('table_seats').createIndex({ is_occupied: 1 });
    await db.collection('table_seats').createIndex({ 
      table_id: 1, 
      seat_index: 1 
    }, { unique: true });
    await db.collection('table_seats').createIndex({ 
      table_id: 1, 
      is_occupied: 1 
    });
    console.log('✓ table_seats indexes created');

    console.log('\nCreating indexes for bot_complaints collection...');
    await db.collection('bot_complaints').createIndex({ table_id: 1 });
    await db.collection('bot_complaints').createIndex({ seat_index: 1 });
    await db.collection('bot_complaints').createIndex({ status: 1 });
    await db.collection('bot_complaints').createIndex({ severity: 1 });
    await db.collection('bot_complaints').createIndex({ reported_at: -1 });
    await db.collection('bot_complaints').createIndex({ 
      table_id: 1, 
      seat_index: 1 
    });
    await db.collection('bot_complaints').createIndex({ 
      status: 1, 
      severity: 1 
    });
    console.log('✓ bot_complaints indexes created');

    console.log('\nCreating indexes for bot_action_logs collection...');
    await db.collection('bot_action_logs').createIndex({ bot_id: 1 });
    await db.collection('bot_action_logs').createIndex({ action_type: 1 });
    await db.collection('bot_action_logs').createIndex({ timestamp: -1 });
    await db.collection('bot_action_logs').createIndex({ 
      bot_id: 1, 
      timestamp: -1 
    });
    console.log('✓ bot_action_logs indexes created');

    console.log('\nCreating indexes for bot_seat_assignments collection...');
    await db.collection('bot_seat_assignments').createIndex({ bot_id: 1 });
    await db.collection('bot_seat_assignments').createIndex({ table_id: 1 });
    await db.collection('bot_seat_assignments').createIndex({ assigned_at: -1 });
    await db.collection('bot_seat_assignments').createIndex({ 
      bot_id: 1, 
      table_id: 1 
    });
    console.log('✓ bot_seat_assignments indexes created');

    // List all indexes for verification
    console.log('\n=== Index Verification ===\n');
    const collections = [
      'bot_instances',
      'bot_blueprints',
      'table_seats',
      'bot_complaints',
      'bot_action_logs',
      'bot_seat_assignments'
    ];

    for (const collectionName of collections) {
      const indexes = await db.collection(collectionName).indexes();
      console.log(`${collectionName}:`);
      indexes.forEach(index => {
        console.log(`  - ${JSON.stringify(index.key)} ${index.unique ? '(unique)' : ''}`);
      });
      console.log('');
    }

    console.log('✓ All indexes created successfully!');
    console.log('\n=== Performance Tips ===');
    console.log('1. Indexes speed up queries but slow down writes slightly');
    console.log('2. Monitor index usage with db.collection.stats()');
    console.log('3. Use explain() on slow queries to verify index usage');
    console.log('4. Consider compound indexes for common query patterns');
    console.log('5. Drop unused indexes to save disk space and write performance');

  } catch (error) {
    console.error('Error creating indexes:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
  }
}

// Run the script
createIndexes().then(() => {
  console.log('\n✓ Database optimization complete!');
  process.exit(0);
}).catch(error => {
  console.error('\n✗ Database optimization failed:', error);
  process.exit(1);
});
