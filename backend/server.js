import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDatabase from './src/config/database.js';
import authRoutes from './src/routes/authRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import studentRoutes from './src/routes/studentRoutes.js';
import attendanceRoutes from './src/routes/attendanceRoutes.js';
import reportRoutes from './src/routes/reportRoutes.js';
import taskRoutes from './src/routes/taskRoutes.js';
import scheduleRoutes from './src/routes/scheduleRoutes.js';
import healthRoutes from './src/routes/healthRoutes.js';
import dashboardRoutes from './src/routes/dashboardRoutes.js';
import departmentRoutes from './src/routes/departmentRoutes.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import dns from 'dns';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env file in the backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

// Set custom DNS servers to bypass WiFi restrictions
dns.setServers(['1.1.1.1', '8.8.8.8']);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
}));
// Increase body size limit to support Base64 encoded profile pictures
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Add connection pool monitoring (non-intrusive)
const monitorConnectionPool = () => {
  if (mongoose.connection.readyState === 1) { // Connected
    try {
      const client = mongoose.connection.getClient();
      if (client && client.topology) {
        const poolSize = client.topology.s.sessionPool?.sessions?.size || 0;
        if (poolSize > 40) {
          console.warn(`⚠️ [Connection Pool Warning] High active sessions: ${poolSize}`);
        }
      }
    } catch (e) {
      // Silently fail if unable to check pool
    }
  }
};

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/departments', departmentRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// Error handler middleware
app.use(errorHandler);

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDatabase();
    
    // Start connection pool monitoring after DB is connected
    setInterval(monitorConnectionPool, 30000);
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
