import dotenv from 'dotenv';

dotenv.config();

interface Config {
  env: string;
  port: number;
  mongoUri: string;
  dbName: string;
  clientUrl: string;
  allowedOrigins: string[];
  sessionSecret: string;
  jwtSecret: string;
  socketCorsOrigin: string;
  maxPlayersPerTable: number;
}

export const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/teenpatti',
  dbName: process.env.DB_NAME || 'teenpatti',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  sessionSecret: process.env.SESSION_SECRET || 'your-secret-key',
  jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret',
  socketCorsOrigin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:5173',
  maxPlayersPerTable: parseInt(process.env.MAX_PLAYERS_PER_TABLE || '6', 10),
};
