import app from './app.js';
import { testConnection } from './config/supabase.js';
import { startFiscalYearScheduler, checkAndProcessCarryoverIfNeeded } from './services/fiscalYearScheduler.js';
import { autoCleanupNotifications } from './controllers/notification.controller.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

// Test Supabase connection before starting server
const startServer = async () => {
  try {
    console.log('🔍 Testing Supabase connection...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('❌ Failed to connect to Supabase. Please check your credentials.');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log('\n========================================');
      console.log('🚀 Leave Management API Server');
      console.log('========================================');
      console.log(`📡 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API URL: http://localhost:${PORT}`);
      console.log(`💾 Database: Supabase (Connected)`);
      console.log('========================================\n');
      console.log('📚 Available endpoints:');
      console.log('   GET  /                      - Health check');
      console.log('   POST /api/auth/login        - Login');
      console.log('   GET  /api/auth/profile      - Get profile');
      console.log('   PUT  /api/auth/change-password - Change password');
      console.log('   POST /api/leaves            - Create leave request');
      console.log('   GET  /api/leaves            - Get my leaves');
      console.log('   GET  /api/leaves/balance    - Get leave balance');
      console.log('   GET  /api/leaves/:id        - Get leave details');
      console.log('   PUT  /api/leaves/:id/cancel - Cancel leave');
      console.log('========================================\n');
      
      // เริ่มต้น Fiscal Year Scheduler
      startFiscalYearScheduler();
      
      // ตรวจสอบและยกยอดวันลาถ้าจำเป็น (กรณี server restart หลังวันที่ 1 ต.ค.)
      checkAndProcessCarryoverIfNeeded();

      // Auto-cleanup: ลบแจ้งเตือนเก่าที่อ่านแล้ว (>90 วัน) เมื่อ server เริ่มต้น
      autoCleanupNotifications();

      // ตั้ง interval ล้าง notifications ทุก 24 ชม.
      setInterval(autoCleanupNotifications, 24 * 60 * 60 * 1000);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
