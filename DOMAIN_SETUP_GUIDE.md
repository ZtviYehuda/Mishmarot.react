# מדריך הגדרת דומיין קבוע עם SSL

## דרישות מקדימות
- דומיין רשום (לדוגמה: `shiftguard.co.il`)
- גישה לניהול DNS של הדומיין
- שרת עם כתובת IP ציבורית
- פורטים 80 ו-443 פתוחים

## אפשרות 1: Cloudflare עם דומיין קבוע (מומלץ)

### יתרונות:
- ✅ SSL חינמי אוטומטי
- ✅ CDN מהיר
- ✅ הגנת DDoS
- ✅ ניהול DNS קל
- ✅ תמיכה ב-WebAuthn

### שלבי הגדרה:

#### 1. הוסף את הדומיין ל-Cloudflare
```bash
# עבור ל-Cloudflare Dashboard
https://dash.cloudflare.com

# לחץ "Add a Site"
# הזן את הדומיין שלך
# בחר תוכנית (Free מספיק)
```

#### 2. עדכן Name Servers
Cloudflare יספק לך 2 name servers, לדוגמה:
```
ns1.cloudflare.com
ns2.cloudflare.com
```

עדכן אותם אצל רשם הדומיין שלך (לדוגמה: GoDaddy, Namecheap, וכו')

#### 3. הגדר DNS Records
ב-Cloudflare DNS:
```
Type: A
Name: @
Content: [IP של השרת שלך]
Proxy: Enabled (☁️ כתום)

Type: A
Name: www
Content: [IP של השרת שלך]
Proxy: Enabled (☁️ כתום)
```

#### 4. הגדר SSL/TLS
```
SSL/TLS → Overview → Encryption mode: Full (strict)
```

#### 5. הגדר Cloudflare Tunnel (אופציונלי אך מומלץ)
```bash
# התקן cloudflared
# Windows:
winget install --id Cloudflare.cloudflared

# צור tunnel
cloudflared tunnel create shiftguard

# הגדר config
notepad %USERPROFILE%\.cloudflared\config.yml
```

**config.yml:**
```yaml
tunnel: [TUNNEL-ID]
credentials-file: C:\Users\[USER]\.cloudflared\[TUNNEL-ID].json

ingress:
  # Frontend
  - hostname: shiftguard.co.il
    service: http://localhost:5173
  
  # Backend API
  - hostname: api.shiftguard.co.il
    service: http://localhost:5000
  
  # Catch-all
  - service: http_status:404
```

#### 6. הפעל את ה-Tunnel
```bash
cloudflared tunnel run shiftguard
```

#### 7. חבר את ה-Tunnel ל-DNS
ב-Cloudflare Dashboard:
```
DNS → Add Record
Type: CNAME
Name: shiftguard.co.il
Content: [TUNNEL-ID].cfargotunnel.com
Proxy: Enabled
```

---

## אפשרות 2: Let's Encrypt עם Nginx (שרת פרטי)

### דרישות:
- שרת Linux (Ubuntu/Debian מומלץ)
- Nginx מותקן
- Certbot מותקן

### שלבי הגדרה:

#### 1. התקן Nginx ו-Certbot
```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y
```

#### 2. הגדר Nginx
```bash
sudo nano /etc/nginx/sites-available/shiftguard
```

**תוכן הקובץ:**
```nginx
# Frontend
server {
    listen 80;
    server_name shiftguard.co.il www.shiftguard.co.il;
    
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API
server {
    listen 80;
    server_name api.shiftguard.co.il;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 3. הפעל את ההגדרה
```bash
sudo ln -s /etc/nginx/sites-available/shiftguard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 4. קבל תעודת SSL
```bash
sudo certbot --nginx -d shiftguard.co.il -d www.shiftguard.co.il -d api.shiftguard.co.il
```

#### 5. חידוש אוטומטי
```bash
sudo certbot renew --dry-run
```

---

## אפשרות 3: Azure/AWS/GCP עם Load Balancer

### Azure App Service (הכי פשוט)
```bash
# צור App Service
az webapp create --name shiftguard --resource-group myResourceGroup --plan myAppServicePlan

# הוסף דומיין מותאם אישית
az webapp config hostname add --webapp-name shiftguard --resource-group myResourceGroup --hostname shiftguard.co.il

# הפעל SSL
az webapp config ssl bind --certificate-thumbprint [THUMBPRINT] --ssl-type SNI --name shiftguard --resource-group myResourceGroup
```

---

## בדיקת ההגדרה

### 1. בדוק DNS
```bash
nslookup shiftguard.co.il
```

### 2. בדוק SSL
```bash
curl -I https://shiftguard.co.il
```

### 3. בדוק WebAuthn Support
פתח את הדפדפן ב-Developer Console:
```javascript
// בדוק אם WebAuthn נתמך
console.log('WebAuthn supported:', !!window.PublicKeyCredential);

// בדוק אם HTTPS
console.log('HTTPS:', window.location.protocol === 'https:');
```

---

## עדכון קבצי הגדרה

### Frontend - vite.config.ts
```typescript
export default defineConfig({
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://api.shiftguard.co.il',
        changeOrigin: true,
        secure: true
      }
    }
  }
})
```

### Backend - config.py
```python
class Config:
    # Production domain
    FRONTEND_URL = "https://shiftguard.co.il"
    BACKEND_URL = "https://api.shiftguard.co.il"
    
    # WebAuthn settings
    RP_ID = "shiftguard.co.il"  # Relying Party ID
    RP_NAME = "ShiftGuard"
    RP_ORIGIN = "https://shiftguard.co.il"
```

---

## Troubleshooting

### בעיה: SSL לא עובד
```bash
# בדוק תעודה
openssl s_client -connect shiftguard.co.il:443 -servername shiftguard.co.il

# בדוק Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### בעיה: DNS לא מתעדכן
- המתן 24-48 שעות להתפשטות DNS
- נקה cache:
```bash
ipconfig /flushdns  # Windows
sudo systemd-resolve --flush-caches  # Linux
```

### בעיה: WebAuthn לא עובד
- ודא ש-HTTPS פעיל
- ודא ש-RP_ID תואם לדומיין
- בדוק browser console לשגיאות

---

## המלצות אבטחה

1. ✅ השתמש ב-HTTPS בלבד (הפעל HSTS)
2. ✅ הגדר CSP headers
3. ✅ הפעל rate limiting
4. ✅ השתמש ב-firewall (Cloudflare / AWS WAF)
5. ✅ עדכן תעודות SSL באופן אוטומטי

---

## עלויות משוערות

| פתרון | עלות חודשית |
|-------|-------------|
| Cloudflare Free + Tunnel | ₪0 |
| Let's Encrypt + VPS | ₪20-50 |
| Azure App Service | ₪50-200 |
| AWS + Load Balancer | ₪100-300 |

---

## הצעד הבא

לאחר הגדרת הדומיין, נוכל ליישם WebAuthn אמיתי עם:
- רישום מכשיר ביומטרי
- אימות עם טביעת אצבע / Face ID
- תמיכה במספר מכשירים
- ניהול מכשירים רשומים
