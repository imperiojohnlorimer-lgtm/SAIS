import express from 'express';
import { healthCheck, getSystemStatus } from '../controllers/healthController.js';

const router = express.Router();

// Main health check endpoint
router.get('/', healthCheck);

// System status endpoint
router.get('/status', getSystemStatus);

export default router;
