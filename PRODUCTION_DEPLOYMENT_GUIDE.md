# מדריך הפעלה למערכת Toren בלינוקס (Ubuntu) באמצעות Docker Compose

מדריך זה מיועד להפעלת המערכת באופן קבוע ומאובטח על גבי שרת הלינוקס שלך.

## 1. דרישות קדם על הלינוקס
ודא שהתקנת את `docker` ו-`docker-compose` על שרת ה-Ubuntu:
```bash
sudo apt update
sudo apt install -y docker.io docker-compose
sudo systemctl enable --now docker
```

## 2. העברת הקוד
העבר את תיקיית הפרויקט לשרת הלינוקס (לדוגמה באמצעות Git או דיסק און קי).

## 3. קביעת מפתח המנהרה (Cloudflare Tunnel)
שירות ה-Tunnel מוגדר בתוך ה-`docker-compose.yml` כך שירוץ אוטומטית. 

### אופציה א': מנהרה חינמית מהירה (Quick Tunnel) - מצב נוכחי
במצב הנוכחי, המנהרה תיצור כתובת `trycloudflare.com` זמנית אוטומטית ברגע שתריץ את המערכת. תוכל לראות את הכתובת בלוגים על ידי הרצת:
```bash
docker logs toren_cloudflare_tunnel
```

### אופציה ב': מנהרה קבועה עם דומיין (מומלץ לפרודקשן)
אם קנית דומיין ואתה רוצה כתובת קבועה:
1. כנס ללוח הבקרה של Cloudflare Zero Trust והקם מנהרה חדשה (Tunnel).
2. העתק את ה-Token (המפתח) שקיבלת מ-Cloudflare.
3. עדכן את קובץ ה-`docker-compose.yml` תחת השירות `tunnel` להרצת הפקודה עם ה-Token שלך:
```yaml
  tunnel:
    image: cloudflare/cloudflared:latest
    container_name: toren_cloudflare_tunnel
    restart: always
    command: tunnel --no-autoupdate run --token <YOUR_CLOUDFLARE_TUNNEL_TOKEN>
```

## 4. הרצת המערכת
בתיקיית הפרויקט הראשית בלינוקס, הרץ את הפקודה הבאה כדי לבנות ולהעלות את כל המערכת ברקע:
```bash
sudo docker-compose up -d --build
```

המערכת תבנה את ה-Frontend ב-Nginx, תפעיל את ה-Backend ב-Gunicorn, ותפתח את מנהרת ה-Cloudflare באופן אוטומטי! המערכת תאתחל את עצמה מחדש אוטומטית לאחר כל כיבוי או נפילת שרת.
