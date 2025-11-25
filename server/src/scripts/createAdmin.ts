import { User } from '../models/User.model.js';
import { database } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script to create the first admin user
 * Run with: npm run create-admin
 */
async function createAdmin() {
  try {
    await database.connect();

    const adminData = {
      username: 'admin',
      email: 'admin@teenpatti.com',
      password: 'Admin@123', // Change this password after first login!
      isAdmin: true,
      coins: 100,
      tokenBalance: 0
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({ username: adminData.username });
    if (existingAdmin) {
      process.exit(0);
    }

    const admin = await User.create(adminData);
    
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
