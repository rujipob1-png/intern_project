/**
 * Health Check Endpoint
 * For load balancers and monitoring systems
 */

import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';

const router = Router();

/**
 * Basic health check
 * Returns 200 if the server is running
 */
router.get('/health', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Check database connection
    const { data, error } = await supabaseAdmin
      .from('roles')
      .select('id')
      .limit(1);
    
    const dbStatus = error ? 'unhealthy' : 'healthy';
    const dbLatency = Date.now() - startTime;
    
    const response = {
      status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: {
          status: dbStatus,
          latency: `${dbLatency}ms`
        },
        memory: {
          used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
          total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
        }
      }
    };
    
    const statusCode = dbStatus === 'healthy' ? 200 : 503;
    res.status(statusCode).json(response);
    
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * Liveness check (is the process alive?)
 */
router.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

/**
 * Readiness check (is the service ready to accept requests?)
 */
router.get('/health/ready', async (req, res) => {
  try {
    // Check if we can connect to the database
    const { error } = await supabaseAdmin
      .from('roles')
      .select('id')
      .limit(1);
    
    if (error) {
      return res.status(503).json({ 
        status: 'not ready',
        reason: 'Database connection failed'
      });
    }
    
    res.status(200).json({ status: 'ready' });
    
  } catch (error) {
    res.status(503).json({ 
      status: 'not ready',
      reason: error.message
    });
  }
});

export default router;
