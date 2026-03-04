import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import leaveRoutes from './routes/leave.routes.js';
import directorRoutes from './routes/director.routes.js';
import centralOfficeRoutes from './routes/centralOffice.routes.js';
import adminRoutes from './routes/admin.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import actingRoutes from './routes/acting.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import healthRoutes from './routes/health.routes.js';
import { errorResponse } from './utils/response.js';
import { HTTP_STATUS } from './config/constants.js';
import { apiLimiter } from './middlewares/rateLimit.middleware.js';
import { csrfProtection, sanitizeBody } from './middlewares/security.middleware.js';

dotenv.config();

const app = express();

// Security Headers (helmet แทนที่ securityHeaders เดิม — ครอบคลุมกว่า 15+ headers)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // ปิดเพื่อให้โหลดรูปจาก Supabase Storage ได้
}));

// Gzip Compression — บีบอัด response ~70%
app.use(compression());

// Middleware
const allowedOrigins = (process.env.CORS_ORIGIN || '*').split(',').map(s => s.trim());
app.use(cors({
  origin: allowedOrigins.length === 1 && allowedOrigins[0] === '*' 
    ? '*' 
    : (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
  credentials: true
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Sanitize request body
app.use(sanitizeBody);

// CSRF Protection (for production)
app.use(csrfProtection);

// Global Rate Limiting (100 requests/minute)
app.use('/api', apiLimiter);

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
app.use('/api', healthRoutes); // Health check (no rate limit)
app.use('/api/auth', authRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/director', directorRoutes);
app.use('/api/central-office', centralOfficeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/acting', actingRoutes);
app.use('/api/notifications', notificationRoutes);

// Swagger API Documentation (only in development)
if (process.env.NODE_ENV !== 'production') {
  import('swagger-ui-express').then(swaggerUi => {
    import('./config/swagger.js').then(({ swaggerSpec }) => {
      app.use('/api-docs', swaggerUi.default.serve, swaggerUi.default.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'ระบบการลาอิเล็กทรอนิกส์ - API Documentation'
      }));
      console.log('📚 API Docs available at: http://localhost:3000/api-docs');
    });
  });
}

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
