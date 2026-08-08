# Deployment Guide

## Deployment Scenarios

### 1. Local Development

**Requirements:**
- Python 3.8+
- Ollama service running locally

**Setup:**
```bash
cd backend
pip install -r requirements.txt
python run.py
```

Server runs on `http://localhost:5000`

---

## 2. Raspberry Pi Deployment

### Prerequisites
- Raspberry Pi 4 (2GB+ RAM) or similar
- Raspberry Pi OS Lite or Full
- Internet connection for setup only

### Installation Steps

#### Step 1: System Update
```bash
sudo apt-get update
sudo apt-get upgrade -y
```

#### Step 2: Install Python
```bash
sudo apt-get install -y python3 python3-pip python3-venv
```

#### Step 3: Clone Project
```bash
cd /home/pi
git clone <repository-url> disaster-bot
cd disaster-bot/backend
```

#### Step 4: Create Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate
```

#### Step 5: Install Dependencies
```bash
pip install -r requirements.txt
```

#### Step 6: Install Ollama
```bash
curl https://ollama.ai/install.sh | sh
ollama pull gemma
```

#### Step 7: Configure Systemd Service

Create `/etc/systemd/system/disaster-bot.service`:
```ini
[Unit]
Description=Offline Disaster Response Chatbot
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/disaster-bot/backend
Environment="PATH=/home/pi/disaster-bot/backend/venv/bin"
ExecStart=/home/pi/disaster-bot/backend/venv/bin/python run.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### Step 8: Enable and Start Service
```bash
sudo systemctl daemon-reload
sudo systemctl enable disaster-bot
sudo systemctl start disaster-bot
```

#### Step 9: Check Status
```bash
sudo systemctl status disaster-bot
curl http://localhost:5000/api/health
```

---

## 3. Docker Deployment

### Dockerfile
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install -r requirements.txt

COPY backend/ .

EXPOSE 5000

CMD ["python", "run.py"]
```

### Docker Compose
```yaml
version: '3.8'

services:
  disaster-bot:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=production
      - OLLAMA_URL=http://ollama:11434
    depends_on:
      - ollama
    volumes:
      - ./backend/data:/app/data

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama

volumes:
  ollama_data:
```

### Deploy with Docker Compose
```bash
docker-compose up -d
```

---

## 4. Mobile Deployment (Flutter App)

### Prerequisites
- Flutter SDK 3.0+
- Dart 2.19+
- Android Studio or Xcode

### Build Android APK
```bash
cd frontend
flutter pub get
flutter build apk --release
```

APK location: `build/app/outputs/apk/release/app-release.apk`

### Build iOS App
```bash
cd frontend
flutter pub get
flutter build ios --release
```

### Deployment
- Use Firebase App Distribution for beta testing
- Upload to Google Play Store or Apple App Store
- Configure backend URL in app configuration

---

## 5. Production Environment Setup

### Security Considerations

#### 1. Environment Variables
Create `.env` file with production values:
```bash
FLASK_ENV=production
FLASK_DEBUG=False
SERVER_HOST=0.0.0.0
SERVER_PORT=5000
CORS_ORIGINS=your-domain.com
```

#### 2. Use Gunicorn for Production
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

#### 3. Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### 4. SSL/TLS Certificates
```bash
sudo certbot certonly --standalone -d your-domain.com
# Configure Nginx with SSL certs
```

#### 5. Firewall Rules
```bash
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS
sudo ufw enable
```

---

## 6. Offline Data Synchronization

### Pre-deployment Data

1. **Export Database**
   ```bash
   sqlite3 data/disaster_response.db ".dump" > backup.sql
   ```

2. **Package with App**
   ```bash
   # Copy database to deployment package
   cp data/disaster_response.db deployment/
   ```

3. **Post-deployment Sync**
   - When internet available, sync new data from server
   - Use differential sync to minimize bandwidth

---

## 7. Monitoring and Maintenance

### Health Check Script
```bash
#!/bin/bash
curl -f http://localhost:5000/api/health && echo "OK" || echo "FAILED"
```

### Log Management
```bash
# Check service logs
sudo journalctl -u disaster-bot -f

# Archive old logs
tar -czf backup-$(date +%Y%m%d).tar.gz /var/log/disaster-bot/
```

### Database Maintenance
```bash
# Backup database
cp data/disaster_response.db data/backup_$(date +%Y%m%d).db

# Vacuum database (optimize)
sqlite3 data/disaster_response.db "VACUUM;"

# Check database integrity
sqlite3 data/disaster_response.db "PRAGMA integrity_check;"
```

---

## 8. Scaling Considerations

### Multi-Instance Setup
```yaml
# Using load balancer
upstream disaster_bot {
    server 127.0.0.1:5000;
    server 127.0.0.1:5001;
    server 127.0.0.1:5002;
}
```

### Caching Layer
- Add Redis for chat history caching
- Cache first aid guides and emergency contacts
- Reduce database queries

### Database Optimization
- Index frequently queried columns
- Archive old chat history
- Partition large tables by date

---

## 9. Troubleshooting Deployment

### Port Already in Use
```bash
lsof -i :5000
kill -9 <PID>
```

### Permission Issues
```bash
sudo chown -R pi:pi /home/pi/disaster-bot
sudo chmod +x /home/pi/disaster-bot/backend/run.py
```

### Memory Issues
```bash
# Check memory usage
free -h
top

# Increase swap
sudo dphys-swapfile swapoff
# Edit /etc/dphys-swapfile
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

### Ollama Connection Issues
```bash
# Check if Ollama is running
curl http://localhost:11434

# Restart Ollama
pkill ollama
ollama serve
```

---

## 10. Checklist Before Production

- [ ] Environment variables configured
- [ ] Database initialized with sample data
- [ ] Ollama service running and model pulled
- [ ] Firewall rules configured
- [ ] SSL/TLS certificates installed
- [ ] Backup and recovery plan tested
- [ ] Monitoring and alerts configured
- [ ] Load balancing (if multi-instance)
- [ ] Log rotation configured
- [ ] Regular backup schedule established
