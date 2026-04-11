import mongoose from 'mongoose';
import User from '../models/User.js';
import Report from '../models/Report.js';

export const healthCheck = async (req, res) => {
  const startTime = Date.now();
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: { status: 'unknown', responseTime: 0 },
      auth: { status: 'unknown', responseTime: 0 },
      reports: { status: 'unknown', responseTime: 0 },
    },
    totalResponseTime: 0,
  };

  try {
    // 1. Check MongoDB connection
    const dbStart = Date.now();
    try {
      if (mongoose.connection.readyState === 1) {
        // Connection is open
        const dbTest = await User.findOne({}).lean();
        health.services.database.status = 'healthy';
        health.services.database.responseTime = Date.now() - dbStart;
      } else {
        health.services.database.status = 'unhealthy';
        health.services.database.message = 'Database connection not ready';
      }
    } catch (dbError) {
      health.services.database.status = 'unhealthy';
      health.services.database.message = dbError.message;
      health.status = 'degraded';
    }

    // 2. Check Auth service (verify token functionality)
    const authStart = Date.now();
    try {
      // Check if auth models exist and can be queried
      const userCount = await User.countDocuments({}).limit(1);
      health.services.auth.status = 'healthy';
      health.services.auth.responseTime = Date.now() - authStart;
      health.services.auth.usersInSystem = userCount;
    } catch (authError) {
      health.services.auth.status = 'unhealthy';
      health.services.auth.message = authError.message;
      health.status = 'degraded';
    }

    // 3. Check Reports service
    const reportStart = Date.now();
    try {
      const reportCount = await Report.countDocuments({}).limit(1);
      health.services.reports.status = 'healthy';
      health.services.reports.responseTime = Date.now() - reportStart;
      health.services.reports.reportCount = reportCount;
    } catch (reportError) {
      health.services.reports.status = 'unhealthy';
      health.services.reports.message = reportError.message;
      health.status = 'degraded';
    }

    health.totalResponseTime = Date.now() - startTime;

    // Determine overall status
    const allHealthy = Object.values(health.services).every(
      (service) => service.status === 'healthy'
    );
    if (allHealthy) {
      health.status = 'healthy';
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;
    return res.status(statusCode).json(health);
  } catch (error) {
    console.error('Health check error:', error);
    health.status = 'unhealthy';
    health.error = error.message;
    health.totalResponseTime = Date.now() - startTime;
    return res.status(503).json(health);
  }
};

export const getSystemStatus = async (req, res) => {
  try {
    const stats = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
      nodeVersion: process.version,
    };

    return res.status(200).json(stats);
  } catch (error) {
    console.error('System status error:', error);
    return res.status(500).json({ error: error.message });
  }
};
