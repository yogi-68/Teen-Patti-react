/**
 * Jest Test Setup
 * Configures MongoDB connection for testing
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  // Create in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Connect to the in-memory database
  await mongoose.connect(mongoUri);
  
  console.log('✅ Test MongoDB connected:', mongoUri);
}, 30000);

afterAll(async () => {
  // Cleanup
  await mongoose.disconnect();
  await mongoServer.stop();
  
  console.log('✅ Test MongoDB disconnected');
});

beforeEach(async () => {
  // Clear all collections before each test
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

