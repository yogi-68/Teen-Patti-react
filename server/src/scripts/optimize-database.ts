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
    await mongoose.connect(MONGODB_URI);

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    await db.collection('bot_instances').createIndex({ is_active: 1 });
    await db.collection('bot_instances').createIndex({ blueprint_id: 1 });
    await db.collection('bot_instances').createIndex({ created_at: -1 });
    await db.collection('bot_instances').createIndex({ 
      is_active: 1, 
      blueprint_id: 1 
    });

    await db.collection('bot_blueprints').createIndex({ is_active: 1 });
    await db.collection('bot_blueprints').createIndex({ name: 1 });
    await db.collection('bot_blueprints').createIndex({ behavior_profile: 1 });

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

    await db.collection('bot_action_logs').createIndex({ bot_id: 1 });
    await db.collection('bot_action_logs').createIndex({ action_type: 1 });
    await db.collection('bot_action_logs').createIndex({ timestamp: -1 });
    await db.collection('bot_action_logs').createIndex({ 
      bot_id: 1, 
      timestamp: -1 
    });

    await db.collection('bot_seat_assignments').createIndex({ bot_id: 1 });
    await db.collection('bot_seat_assignments').createIndex({ table_id: 1 });
    await db.collection('bot_seat_assignments').createIndex({ assigned_at: -1 });
    await db.collection('bot_seat_assignments').createIndex({ 
      bot_id: 1, 
      table_id: 1 
    });

    // List all indexes for verification
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
      indexes.forEach(index => {
      });
    }


  } catch (error) {
    console.error('Error creating indexes:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

// Run the script
createIndexes().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('\n✗ Database optimization failed:', error);
  process.exit(1);
});
