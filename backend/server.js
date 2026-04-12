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

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Set custom DNS servers
dns.setServers(['1.1.1.1', '8.8.8.8']);

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

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

// Connect to database once at cold start
connectDatabase()
  .then(() => {
    console.log('Database connected');
  })
  .catch(err => {
    console.error('Database connection failed:', err);
  });

// Export the app for Vercel
export default app;
