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
  // Use Render production MongoDB even for localhost development
  mongoUri: process.env.MONGODB_URI || 'mongodb+srv://teenpatti_admin:teenpatti123@cluster0.3rtayk3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
  dbName: process.env.DB_NAME || 'cluster0',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  sessionSecret: process.env.SESSION_SECRET || 'your-secret-key',
  jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret',
  socketCorsOrigin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:5173',
  maxPlayersPerTable: parseInt(process.env.MAX_PLAYERS_PER_TABLE || '5', 10),
};
