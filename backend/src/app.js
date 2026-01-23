import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import leaveRoutes from './routes/leave.routes.js';
import directorRoutes from './routes/director.routes.js';
import centralOfficeRoutes from './routes/centralOffice.routes.js';
import adminRoutes from './routes/admin.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import { errorResponse } from './utils/response.js';
import { HTTP_STATUS } from './config/constants.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Leave Management API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/director', directorRoutes);
app.use('/api/central-office', centralOfficeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/reports', reportsRoutes);

// 404 Handler
app.use((req, res) => {
  errorResponse(
    res,
    HTTP_STATUS.NOT_FOUND,
    `Route ${req.originalUrl} not found`
  );
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  errorResponse(
    res,
    err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR,
    err.message || 'Internal Server Error'
  );
});

export default app;
