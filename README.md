# מערכת ניהול משמרות - Mishmarot.react

מערכת לניהול נוכחות, משמרות ועובדים הכוללת ממשק משתמש מתקדם (React) ושרת Backend (Flask) עם מסד נתונים PostgreSQL.

## מבנה הפרויקט
- `frontend/`: אפליקציית ה-React (Vite).
- `backend/`: שרת ה-API (Flask) וניהול הנתונים.
- `docker-compose.yml`: הגדרות מסד הנתונים ו-pgAdmin.

---

## 🚀 הוראות הרצה מהירות

### 1. הכנת מסד הנתונים (Docker)
יש לוודא ש-Docker Desktop פועל, ואז להריץ מהתיקייה הראשית:
```powershell
docker-compose up -d
```
*פעולה זו תפעיל את ה-PostgreSQL ואת ה-pgAdmin.*

### 2. הרצת ה-Backend
1. כנס לתיקיית `backend`: `cd backend`
2. הפעל את הסביבה הווירטואלית: `venv\Scripts\activate`
3. התקן תלויות (במידת הצורך): `pip install -r requirements.txt`
4. הרץ את השרת: `python run.py`

#בפקודה אחת
cd backend; .\venv\Scripts\Activate.ps1; python run.py

### 3. הרצת ה-Frontend
1. פתח טרמינל חדש וכנס לתיקיית `frontend`: `cd frontend`
2. התקן חבילות (במידת הצורך): `npm install`
3. הרץ את האפליקציה: `npm run dev`

#בפקודה אחת
cd frontend; npm run dev

---

## 🛠 ניהול מסד הנתונים (pgAdmin)

ניתן לגשת לממשק הניהול בכתובת: `http://localhost:5050`

**פרטי התחברות לממשק:**
- **Email:** `admin@admin.com`
- **Password:** `admin`

**הגדרת חיבור לשרת הנתונים (בתוך pgAdmin):**
במידה וצריך להוסיף את השרת (Register Server):
1. בטאב **General**:
   - **Name:** `Mishmarot DB` (או כל שם אחר לבחירתך)
2. בטאב **Connection**:
   - **Host name/address:** `db`
   - **Port:** `5432`
   - **Username:** `postgres`
   - **Password:** `8245`
   - *(חשוב: ודא שאין רווחים מיותרים בשם המשתמש)*

---

## 💾 גיבויים
- גיבויים אוטומטיים נשמרים בתיקייה: `backend/backups/`.
- הגדרות הגיבוי נמצאות בקובץ: `backend/backup_config.json`.

---

## ❓ פתרון בעיות נפוצות

- **ERR_CONNECTION_REFUSED (Frontend):** ודא ששרת ה-Backend פועל בפורט 5000.
- **ERR_EMPTY_RESPONSE (pgAdmin):** נסה לגשת דרך `127.0.0.1:5051` או להמתין דקה לעליית הקונטיינר.
- **relation "employees" does not exist:** מסד הנתונים אותחל והוא ריק. יש להריץ את סקריפט האתחול או לשחזר מגיבוי.
