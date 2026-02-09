# Health Check endpoint
/api/health

# API Documentation (development only)
/api-docs

# ==================== Production Deployment Checklist ====================

## Pre-Deployment

- [ ] All tests pass (`npm test` in both frontend and backend)
- [ ] No ESLint errors
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Database indexes created (performance_indexes.sql)
- [ ] Audit logs table created (create_audit_logs_table.sql)
- [ ] SSL certificates configured
- [ ] CORS origin set to production domain

## Security Checklist

- [ ] JWT_SECRET is strong (64+ characters)
- [ ] SUPABASE_SERVICE_ROLE_KEY is kept secret
- [ ] SMTP credentials are app-specific passwords
- [ ] Rate limiting configured
- [ ] CSRF protection enabled
- [ ] Security headers configured
- [ ] Disable Swagger UI in production

## Backend Configuration

```bash
# Set production environment
NODE_ENV=production

# Generate strong JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Start with PM2
pm2 start src/server.js --name leave-api

# Or with node directly
node src/server.js
```

## Frontend Build

```bash
cd frontend

# Set environment
export VITE_API_URL=https://your-api-domain.com/api

# Build for production
npm run build

# Output will be in dist/ folder
```

## Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend (static files)
    location / {
        root /var/www/leave-system/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## PM2 Ecosystem File (ecosystem.config.js)

```javascript
module.exports = {
  apps: [
    {
      name: 'leave-api',
      script: 'src/server.js',
      cwd: '/var/www/leave-system/backend',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/pm2/leave-api-error.log',
      out_file: '/var/log/pm2/leave-api-out.log',
      log_file: '/var/log/pm2/leave-api-combined.log',
      time: true
    }
  ]
};
```

## Docker Deployment (Optional)

```dockerfile
# Backend Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "src/server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - ./backend/.env
    restart: unless-stopped
```

## Monitoring

- [ ] PM2 monitoring configured
- [ ] Log rotation configured
- [ ] Health check endpoint accessible
- [ ] Error tracking (Sentry) optional
- [ ] Performance monitoring optional

## Backup Strategy

- [ ] Database auto-backup enabled in Supabase
- [ ] Point-in-time recovery enabled
- [ ] Test restore process

## Post-Deployment

- [ ] Verify health check: `curl https://your-api/api/health`
- [ ] Test login functionality
- [ ] Test leave creation
- [ ] Test approval workflow
- [ ] Check logs for errors
- [ ] Monitor performance metrics
