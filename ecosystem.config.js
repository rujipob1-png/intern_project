/**
 * PM2 Ecosystem Configuration
 * ใช้สำหรับ Production Deployment
 * 
 * คำสั่งใช้งาน:
 *   pm2 start ecosystem.config.js        # เริ่ม server
 *   pm2 restart leave-system              # restart
 *   pm2 stop leave-system                 # หยุด
 *   pm2 logs leave-system                 # ดู log
 *   pm2 monit                             # monitor แบบ realtime
 *   pm2 save                              # บันทึก process list
 *   pm2 startup                           # ตั้งค่า auto-start ตอนเปิดเครื่อง
 */

module.exports = {
  apps: [
    {
      name: 'leave-system',
      script: 'src/server.js',
      cwd: './backend',
      
      // Node.js options
      node_args: '--experimental-modules',
      
      // Instance & Mode
      instances: 1,           // ใช้ 1 instance (เพิ่มได้ถ้า server แรง)
      exec_mode: 'fork',      // fork mode สำหรับ 1 instance
      
      // Auto-restart
      watch: false,            // ไม่ watch file ใน production
      max_restarts: 10,        // restart สูงสุด 10 ครั้ง
      min_uptime: 5000,        // ถ้า crash ภายใน 5 วินาที นับเป็น unstable
      restart_delay: 3000,     // รอ 3 วินาที ก่อน restart
      
      // Memory
      max_memory_restart: '500M',  // restart ถ้าใช้ memory เกิน 500MB
      
      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/error.log',
      out_file: './logs/output.log',
      merge_logs: true,
      
      // Environment
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
