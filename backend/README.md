# מדריך הרצת Backend

## דרישות מקדימות
- **Docker Desktop** מותקן ופועל (חובה!)
- Python 3.8 ומעלה
- pip (מנהל החבילות של Python)

## שלבי ההתקנה וההרצה

### 1. הפעלת מסד הנתונים (Docker) - **צעד קריטי**
לפני הרצת השרת, חובה להפעיל את מסד הנתונים דרך Docker.
פתח טרמינל בתיקייה הראשית של הפרויקט (איפה שנמצא `docker-compose.yml`) והרץ:

```bash
docker-compose up -d
```

פקודה זו תרים את:
- **PostgreSQL**: מסד הנתונים (פורט 5432)
- **pgAdmin**: ממשק ניהול למסד הנתונים (פורט 5050)
  - **כתובת:** `http://localhost:5050`
  - **שם משתמש:** `admin@admin.com`
  - **סיסמה:** `admin`

### 2. הגדרת סביבה וירטואלית (Virtual Environment)
כנס לתיקיית `backend`:
```bash
cd backend
```

יצירה והפעלה של הסביבה:
```bash
# יצירת סביבה וירטואלית אם לא יצרת
python -m venv venv

# הפעלת הסביבה הוירטואלית
# ב-Windows:
venv\Scripts\activate


### 3. התקנת תלויות
```bash
pip install -r requirements.txt
```

### 4. הגדרת משתני סביבה
ודא שקובץ `.env` קיים בתיקיית `backend` עם ההגדרות שמתאימות ל-Docker:
```
FLASK_APP=run.py
FLASK_DEBUG=1
JWT_SECRET_KEY=change_this_to_a_complex_secret_key
DB_HOST=localhost
DB_NAME=postgres
DB_USER=postgres
DB_PASS=8245
```

### 5. הרצת השרת
לאחר שהדוקר פועל והסביבה מוכנה:

#### אופציה א': הרצה ישירה עם Python
```bash
python run.py
```

#### אופציה ב': הרצה עם Flask CLI
```bash
flask run
```

השרת יעלה על: `http://localhost:5000`

---

## ניהול מסד הנתונים (pgAdmin)
ממשק הניהול זמין בכתובת: `http://localhost:5050`

**פרטי התחברות ל-pgAdmin:**
- **Email:** `admin@admin.com`
- **Password:** `root`

**פרטי התחברות לשרת (בתוך pgAdmin):**
- **Host name/address:** `mishmarot_db` (או `host.docker.internal` אם מתחברים מבחוץ)
- **Port:** `5432`
- **Username:** `postgres`
- **Password:** `8245`

---

## פתרון בעיות נפוצות

### שגיאת "Connection refused"
- ודא ש-Docker Desktop פתוח.
- ודא שהרצת `docker-compose up -d`.
- בדוק ב-Docker אם הקונטיינר `mishmarot_db` במצב Running.

### שינויים ב-Schema לא מתעדכנים
אם שינית שדות ב-Database, נסה להפיל ולהרים מחדש את הדוקר (זהירות - זה עלול למחוק נתונים אם לא הוגדר Volume קבוע):
```bash
docker-compose down
docker-compose up -d
```
