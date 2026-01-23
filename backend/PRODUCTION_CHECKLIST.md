# Production Deployment Checklist

## 🔒 Security Checklist

### Environment Variables
- [ ] ตรวจสอบ `.env` ไม่ถูก commit ขึ้น git
- [ ] สร้าง `.env.production` สำหรับ production
- [ ] ใช้ strong JWT_SECRET (32+ characters, random)
- [ ] เปลี่ยน Supabase keys เป็น production keys
- [ ] ตั้งค่า CORS_ORIGIN ให้ชัดเจน (ไม่ใช้ *)

### Security Headers & Middleware
- [ ] ติดตั้ง helmet สำหรับ security headers
- [ ] เปิดใช้งาน rate limiting
- [ ] Input sanitization
- [ ] HTTPS only (ใน production)
- [ ] Secure cookies (httpOnly, secure, sameSite)

### Database Security
- [ ] Row Level Security (RLS) enabled ใน Supabase
- [ ] ตรวจสอบ policies ทุกตาราง
- [ ] Backup strategy
- [ ] ตรวจสอบ indexes สำหรับ performance

### API Security
- [ ] Validate inputs ทุก endpoint
- [ ] Sanitize user inputs
- [ ] Error messages ไม่เปิดเผยข้อมูลสำคัญ
- [ ] File upload validation (ขนาด, ประเภท)
- [ ] Rate limiting per IP/user

---

## 🚀 Performance Checklist

### Database
- [ ] สร้าง indexes สำหรับ queries ที่ใช้บ่อย
- [ ] Optimize query performance
- [ ] Connection pooling
- [ ] Query caching (ถ้าจำเป็น)

### API Response
- [ ] Pagination ทุกที่ที่ return array ใหญ่
- [ ] Response compression (gzip)
- [ ] Limit response size
- [ ] Cache static data

### File Storage
- [ ] ตั้งค่า file size limit
- [ ] Image compression (ถ้ามี)
- [ ] CDN สำหรับ static files
- [ ] Cleanup unused files

---

## 📝 Code Quality

### Code Review
- [ ] ลบ console.log ทั้งหมด
- [ ] ลบ commented code
- [ ] Error handling ครบถ้วน
- [ ] Consistent naming convention
- [ ] Add JSDoc comments สำหรับ functions สำคัญ

### Testing
- [ ] ทดสอบ happy path ทุก endpoint
- [ ] ทดสอบ error cases
- [ ] ทดสอบ authentication & authorization
- [ ] ทดสอบ workflow ทั้งหมด (User → Director → Central → Admin)
- [ ] Load testing (optional)

---

## 📊 Monitoring & Logging

### Logging
- [ ] ตั้งค่า proper logging (winston/pino)
- [ ] Log errors พร้อม stack trace
- [ ] Log important actions (login, approval, etc.)
- [ ] แยก log levels (error, warn, info, debug)
- [ ] Log rotation

### Monitoring
- [ ] Error tracking (Sentry/optional)
- [ ] Performance monitoring
- [ ] Uptime monitoring
- [ ] Database monitoring

---

## 🌍 Deployment

### Pre-deployment
- [ ] Update README.md
- [ ] Update API documentation
- [ ] Create .env.example
- [ ] Version bump
- [ ] Git tag release

### Deployment Steps
1. [ ] Clone repo to server
2. [ ] Install dependencies (`npm ci`)
3. [ ] Copy .env.production to .env
4. [ ] Run database migrations
5. [ ] Test connection to Supabase
6. [ ] Start server with PM2/systemd
7. [ ] Setup reverse proxy (Nginx)
8. [ ] Setup SSL certificate (Let's Encrypt)
9. [ ] Configure firewall
10. [ ] Test all endpoints

### Post-deployment
- [ ] Monitor error logs
- [ ] Check server resource usage
- [ ] Test critical workflows
- [ ] Backup database
- [ ] Document deployment process

---

## 🔄 Maintenance

### Regular Tasks
- [ ] Update dependencies monthly
- [ ] Review security advisories
- [ ] Backup database weekly
- [ ] Review logs weekly
- [ ] Performance monitoring
- [ ] Clean up old logs/files

### Emergency Procedures
- [ ] Rollback procedure documented
- [ ] Database restore procedure
- [ ] Emergency contacts list
- [ ] Incident response plan

---

## 📞 Support

### Documentation
- [ ] API documentation complete
- [ ] User guide (ถ้ามี)
- [ ] Troubleshooting guide
- [ ] FAQ

### Contact Information
- **Developer:** [Your Name]
- **Email:** [your-email@example.com]
- **Repository:** [GitHub/GitLab URL]
- **API URL:** [Production URL]

---

## ✅ Final Checks

เมื่อเช็คครบทุกข้อแล้ว:
- [ ] **All security measures implemented**
- [ ] **Performance optimized**
- [ ] **Documentation complete**
- [ ] **Testing passed**
- [ ] **Deployed successfully**
- [ ] **Monitoring active**

🎉 **พร้อม Production!**
