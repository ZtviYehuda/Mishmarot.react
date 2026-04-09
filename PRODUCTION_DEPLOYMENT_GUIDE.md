# מדריך העלאה לפרודקשן עם אימות ביומטרי

## תוכן עניינים
1. [דרישות מקדימות](#דרישות-מקדימות)
2. [הגדרת דומיין ו-SSL](#הגדרת-דומיין-ו-ssl)
3. [התקנת Backend](#התקנת-backend)
4. [התקנת Frontend](#התקנת-frontend)
5. [הגדרת WebAuthn](#הגדרת-webauthn)
6. [בדיקות](#בדיקות)
7. [תחזוקה](#תחזוקה)

---

## דרישות מקדימות

### חומרה ותוכנה
- ✅ שרת עם Ubuntu 20.04+ / Debian 11+
- ✅ לפחות 2GB RAM
- ✅ 20GB דיסק פנוי
- ✅ Python 3.9+
- ✅ Node.js 18+
- ✅ PostgreSQL 13+
- ✅ Nginx
- ✅ דומיין רשום עם גישה ל-DNS

### רשימת בדיקה
- [ ] דומיין רשום ופעיל
- [ ] גישה ל-DNS של הדומיין
- [ ] שרת עם IP ציבורי
- [ ] פורטים 80, 443 פתוחים
- [ ] גישת SSH לשרת

---

## הגדרת דומיין ו-SSL

### אפשרות 1: Cloudflare (מומלץ)

#### 1. הוסף דומיין ל-Cloudflare
```bash
# עבור ל: https://dash.cloudflare.com
# לחץ "Add a Site" והזן את הדומיין שלך
```

#### 2. עדכן Name Servers
עדכן את ה-Name Servers אצל רשם הדומיין ל:
```
ns1.cloudflare.com
ns2.cloudflare.com
```

#### 3. הגדר DNS Records
```
Type: A
Name: @
Content: [IP של השרת]
Proxy: Enabled (☁️)

Type: A  
Name: api
Content: [IP של השרת]
Proxy: Enabled (☁️)
```

#### 4. הגדר SSL
```
SSL/TLS → Overview → Encryption mode: Full (strict)
```

### אפשרות 2: Let's Encrypt

```bash
# התקן Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# קבל תעודת SSL
sudo certbot --nginx -d shiftguard.co.il -d www.shiftguard.co.il -d api.shiftguard.co.il

# אישור חידוש אוטומטי
sudo certbot renew --dry-run
```

---

## התקנת Backend

### 1. התקן תלויות מערכת
```bash
sudo apt update
sudo apt install python3-pip python3-venv postgresql postgresql-contrib nginx -y
```

### 2. הגדר PostgreSQL
```bash
# התחבר ל-PostgreSQL
sudo -u postgres psql

# צור database ו-user
CREATE DATABASE shiftguard_prod;
CREATE USER shiftguard WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE shiftguard_prod TO shiftguard;
\q
```

### 3. העתק קבצי Backend
```bash
# צור תיקייה
sudo mkdir -p /var/www/shiftguard
sudo chown $USER:$USER /var/www/shiftguard

# העתק קבצים (מהמחשב המקומי)
scp -r backend/ user@server:/var/www/shiftguard/
```

### 4. הגדר סביבה וירטואלית
```bash
cd /var/www/shiftguard/backend

# צור venv
python3 -m venv venv
source venv/bin/activate

# התקן תלויות
pip install -r requirements.txt
pip install gunicorn
```

### 5. הגדר משתני סביבה
```bash
# העתק והגדר .env
cp .env.production.example .env.production
nano .env.production
```

עדכן את הערכים:
```env
FLASK_ENV=production
SECRET_KEY=your-super-secret-key-here
DATABASE_URL=postgresql://shiftguard:your-secure-password@localhost/shiftguard_prod
JWT_SECRET_KEY=your-jwt-secret-here
FRONTEND_URL=https://shiftguard.co.il
WEBAUTHN_RP_ID=shiftguard.co.il
WEBAUTHN_RP_NAME=ShiftGuard
WEBAUTHN_RP_ORIGIN=https://shiftguard.co.il
```

### 6. הרץ Migrations
```bash
# הפעל את ה-venv
source venv/bin/activate

# הרץ migrations
python migrations/add_webauthn_table.py

# צור משתמש admin
python create_test_admin.py
```

### 7. הגדר Gunicorn Service
```bash
sudo nano /etc/systemd/system/shiftguard.service
```

תוכן הקובץ:
```ini
[Unit]
Description=ShiftGuard Backend
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/shiftguard/backend
Environment="PATH=/var/www/shiftguard/backend/venv/bin"
Environment="FLASK_ENV=production"
ExecStart=/var/www/shiftguard/backend/venv/bin/gunicorn \
    --workers 4 \
    --bind 127.0.0.1:5000 \
    --timeout 120 \
    --access-logfile /var/log/shiftguard/access.log \
    --error-logfile /var/log/shiftguard/error.log \
    run:app

[Install]
WantedBy=multi-user.target
```

```bash
# צור תיקיית logs
sudo mkdir -p /var/log/shiftguard
sudo chown www-data:www-data /var/log/shiftguard

# הפעל את השירות
sudo systemctl daemon-reload
sudo systemctl start shiftguard
sudo systemctl enable shiftguard
sudo systemctl status shiftguard
```

---

## התקנת Frontend

### 1. התקן Node.js
```bash
# התקן Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. העתק קבצי Frontend
```bash
# העתק קבצים
scp -r frontend/ user@server:/var/www/shiftguard/
```

### 3. הגדר משתני סביבה
```bash
cd /var/www/shiftguard/frontend

# העתק והגדר .env
cp .env.production.example .env.production
nano .env.production
```

עדכן:
```env
VITE_API_URL=https://api.shiftguard.co.il
VITE_WEBAUTHN_RP_ID=shiftguard.co.il
VITE_WEBAUTHN_RP_NAME=ShiftGuard
VITE_ENABLE_BIOMETRIC_AUTH=true
```

### 4. בנה את האפליקציה
```bash
# התקן תלויות
npm install

# בנה לפרודקשן
npm run build
```

---

## הגדרת Nginx

### 1. צור קובץ הגדרה
```bash
sudo nano /etc/nginx/sites-available/shiftguard
```

תוכן הקובץ:
```nginx
# Backend API
server {
    listen 80;
    server_name api.shiftguard.co.il;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.shiftguard.co.il;
    
    # SSL Configuration (Let's Encrypt will add this)
    # ssl_certificate /etc/letsencrypt/live/api.shiftguard.co.il/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/api.shiftguard.co.il/privkey.pem;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Proxy to Gunicorn
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # Increase timeouts for long requests
    proxy_connect_timeout 120s;
    proxy_send_timeout 120s;
    proxy_read_timeout 120s;
}

# Frontend
server {
    listen 80;
    server_name shiftguard.co.il www.shiftguard.co.il;
    
    # Redirect to HTTPS
    return 301 https://shiftguard.co.il$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.shiftguard.co.il;
    
    # Redirect www to non-www
    return 301 https://shiftguard.co.il$request_uri;
}

server {
    listen 443 ssl http2;
    server_name shiftguard.co.il;
    
    # SSL Configuration (Let's Encrypt will add this)
    # ssl_certificate /etc/letsencrypt/live/shiftguard.co.il/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/shiftguard.co.il/privkey.pem;
    
    root /var/www/shiftguard/frontend/dist;
    index index.html;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 2. הפעל את ההגדרה
```bash
# צור symlink
sudo ln -s /etc/nginx/sites-available/shiftguard /etc/nginx/sites-enabled/

# בדוק תקינות
sudo nginx -t

# הפעל מחדש
sudo systemctl restart nginx
```

---

## הגדרת WebAuthn

### 1. ודא HTTPS פעיל
```bash
# בדוק תעודת SSL
curl -I https://shiftguard.co.il
curl -I https://api.shiftguard.co.il
```

### 2. בדוק הגדרות Backend
```bash
# ודא שמשתני הסביבה נכונים
cd /var/www/shiftguard/backend
source venv/bin/activate
python -c "import os; print('RP_ID:', os.getenv('WEBAUTHN_RP_ID')); print('RP_ORIGIN:', os.getenv('WEBAUTHN_RP_ORIGIN'))"
```

### 3. בדוק הגדרות Frontend
```bash
# ודא שהקבצים נבנו עם המשתנים הנכונים
cat /var/www/shiftguard/frontend/.env.production
```

### 4. הפעל מחדש את השירותים
```bash
sudo systemctl restart shiftguard
sudo systemctl restart nginx
```

---

## בדיקות

### 1. בדוק Backend
```bash
# בדוק שהשרת רץ
curl https://api.shiftguard.co.il/api/health

# בדוק WebAuthn endpoint
curl https://api.shiftguard.co.il/api/webauthn/credentials
```

### 2. בדוק Frontend
```bash
# פתח בדפדפן
https://shiftguard.co.il

# פתח Developer Console ובדוק:
console.log('WebAuthn supported:', !!window.PublicKeyCredential);
console.log('HTTPS:', window.location.protocol === 'https:');
```

### 3. בדוק אימות ביומטרי

1. היכנס למערכת עם שם משתמש וסיסמה
2. עבור להגדרות → פרופיל
3. גלול ל"אימות ביומטרי"
4. לחץ "הוסף מכשיר"
5. אשר עם טביעת אצבע / Face ID
6. התנתק
7. לחץ על כפתור טביעת האצבע בדף ההתחברות
8. אשר עם טביעת אצבע / Face ID
9. ודא שנכנסת בהצלחה

---

## תחזוקה

### Logs
```bash
# Backend logs
sudo tail -f /var/log/shiftguard/error.log
sudo tail -f /var/log/shiftguard/access.log

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# System logs
sudo journalctl -u shiftguard -f
```

### Backups
```bash
# Backup database
pg_dump -U shiftguard shiftguard_prod > backup_$(date +%Y%m%d).sql

# Backup files
tar -czf backup_files_$(date +%Y%m%d).tar.gz /var/www/shiftguard
```

### Updates
```bash
# Update backend
cd /var/www/shiftguard/backend
source venv/bin/activate
git pull
pip install -r requirements.txt
sudo systemctl restart shiftguard

# Update frontend
cd /var/www/shiftguard/frontend
git pull
npm install
npm run build
```

### Monitoring
```bash
# בדוק שירותים
sudo systemctl status shiftguard
sudo systemctl status nginx
sudo systemctl status postgresql

# בדוק שימוש במשאבים
htop
df -h
free -h
```

---

## Troubleshooting

### WebAuthn לא עובד

**בעיה:** "NotAllowedError" או "SecurityError"

**פתרון:**
1. ודא ש-HTTPS פעיל ותקין
2. ודא ש-RP_ID תואם לדומיין בדיוק
3. ודא ש-RP_ORIGIN כולל https://
4. נקה cache של הדפדפן
5. בדוק browser console לשגיאות

### Backend לא עובד

**בעיה:** 502 Bad Gateway

**פתרון:**
```bash
# בדוק שהשירות רץ
sudo systemctl status shiftguard

# בדוק logs
sudo journalctl -u shiftguard -n 50

# הפעל מחדש
sudo systemctl restart shiftguard
```

### SSL לא עובד

**בעיה:** "Your connection is not private"

**פתרון:**
```bash
# חדש תעודה
sudo certbot renew --force-renewal

# בדוק תעודה
sudo certbot certificates

# הפעל מחדש nginx
sudo systemctl restart nginx
```

---

## אבטחה

### Firewall
```bash
# הפעל UFW
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status
```

### Fail2Ban
```bash
# התקן
sudo apt install fail2ban -y

# הגדר
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true
```

```bash
sudo systemctl restart fail2ban
```

---

## תמיכה

אם נתקלת בבעיות:
1. בדוק logs
2. ודא שכל השירותים רצים
3. בדוק הגדרות DNS
4. ודא ש-SSL תקין
5. בדוק browser console

---

**הצלחה! המערכת שלך אמורה לרוץ עם אימות ביומטרי מלא! 🎉**
