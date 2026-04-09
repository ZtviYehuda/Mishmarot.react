# 🔐 אימות ביומטרי עם WebAuthn

## סקירה כללית

מערכת ShiftGuard כוללת תמיכה מלאה באימות ביומטרי באמצעות תקן WebAuthn (FIDO2). המערכת מאפשרת למשתמשים להיכנס באמצעות טביעת אצבע, זיהוי פנים (Face ID), או מפתחות אבטחה חומרתיים.

## ✨ תכונות

- ✅ **אימות ביומטרי אמיתי** - שימוש בחומרת האבטחה של המכשיר
- ✅ **תמיכה במספר מכשירים** - רישום מספר מכשירים לאותו משתמש
- ✅ **ניהול מכשירים** - צפייה, שינוי שם, והסרה של מכשירים רשומים
- ✅ **אבטחה מקסימלית** - מפתחות קריפטוגרפיים לא עוזבים את המכשיר
- ✅ **תמיכה רחבה** - עובד על iOS, Android, Windows, Mac
- ✅ **חוויית משתמש מצוינת** - כניסה מהירה ונוחה

## 🔧 דרישות טכניות

### דרישות שרת
- Python 3.9+
- PostgreSQL 13+
- דומיין עם HTTPS (SSL/TLS)
- RP_ID חייב להתאים לדומיין בדיוק

### דרישות לקוח
- דפדפן מודרני (Chrome 67+, Safari 14+, Edge 18+, Firefox 60+)
- HTTPS (WebAuthn לא עובד על HTTP)
- מכשיר עם תמיכה ביומטרית (טביעת אצבע / Face ID)

## 📦 התקנה

### 1. התקן תלויות Backend

```bash
cd backend
pip install -r requirements.txt
```

הקובץ `requirements.txt` כולל:
```
webauthn==2.2.0
```

### 2. התקן תלויות Frontend

```bash
cd frontend
npm install
```

הקובץ `package.json` כולל:
```json
{
  "@simplewebauthn/browser": "^10.0.0",
  "@simplewebauthn/types": "^10.0.0"
}
```

### 3. הרץ Migration

```bash
cd backend
python migrations/add_webauthn_table.py
```

זה יוצר את הטבלה `webauthn_credentials` במסד הנתונים.

### 4. הגדר משתני סביבה

**Backend (.env.production):**
```env
WEBAUTHN_RP_ID=shiftguard.co.il
WEBAUTHN_RP_NAME=ShiftGuard
WEBAUTHN_RP_ORIGIN=https://shiftguard.co.il
```

**Frontend (.env.production):**
```env
VITE_WEBAUTHN_RP_ID=shiftguard.co.il
VITE_WEBAUTHN_RP_NAME=ShiftGuard
VITE_ENABLE_BIOMETRIC_AUTH=true
```

⚠️ **חשוב:** ה-RP_ID חייב להתאים בדיוק לדומיין שלך (ללא https://)

## 🚀 שימוש

### רישום מכשיר ביומטרי

1. התחבר למערכת עם שם משתמש וסיסמה
2. עבור ל**הגדרות** → **פרופיל**
3. גלול לסעיף **"אימות ביומטרי"**
4. לחץ על **"הוסף מכשיר"**
5. המערכת תבקש אימות ביומטרי (טביעת אצבע / Face ID)
6. אשר את הרישום
7. המכשיר נרשם בהצלחה!

### כניסה עם אימות ביומטרי

1. בדף ההתחברות, הזן את שם המשתמש שלך
2. לחץ על כפתור **טביעת האצבע** 👆
3. המערכת תבקש אימות ביומטרי
4. אשר עם טביעת אצבע / Face ID
5. נכנסת למערכת!

### ניהול מכשירים

בדף ההגדרות תוכל:
- 👀 לראות את כל המכשירים הרשומים
- ✏️ לשנות שם למכשיר
- 🗑️ להסיר מכשיר
- ➕ להוסיף מכשירים נוספים

## 🏗️ ארכיטקטורה

### Backend API Endpoints

```
POST   /api/webauthn/register/begin       - התחל רישום מכשיר
POST   /api/webauthn/register/complete    - השלם רישום מכשיר
POST   /api/webauthn/authenticate/begin   - התחל אימות
POST   /api/webauthn/authenticate/complete - השלם אימות
GET    /api/webauthn/credentials          - קבל רשימת מכשירים
DELETE /api/webauthn/credentials/:id      - מחק מכשיר
PUT    /api/webauthn/credentials/:id/rename - שנה שם מכשיר
```

### Database Schema

```sql
CREATE TABLE webauthn_credentials (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    credential_id BYTEA UNIQUE NOT NULL,
    public_key BYTEA NOT NULL,
    sign_count INTEGER DEFAULT 0,
    device_name VARCHAR(100),
    transports JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    last_used_at TIMESTAMP
);
```

### Frontend Services

```typescript
// webauthn.service.ts
- isWebAuthnSupported()
- isPlatformAuthenticatorAvailable()
- registerBiometric(deviceName)
- authenticateBiometric(username)
- getCredentials()
- deleteCredential(id)
- renameCredential(id, name)
```

## 🔒 אבטחה

### איך זה עובד?

1. **רישום:**
   - השרת יוצר challenge אקראי
   - הדפדפן מבקש מהמכשיר ליצור זוג מפתחות (public/private)
   - המפתח הפרטי נשמר במכשיר ולעולם לא עוזב אותו
   - המפתח הציבורי נשלח לשרת ונשמר במסד הנתונים

2. **אימות:**
   - השרת יוצר challenge אקראי
   - הדפדפן מבקש מהמכשיר לחתום על ה-challenge עם המפתח הפרטי
   - החתימה נשלחת לשרת
   - השרת מאמת את החתימה עם המפתח הציבורי

### יתרונות אבטחה

- 🔐 **Phishing-resistant** - לא ניתן לגנוב credentials
- 🔐 **No passwords** - אין סיסמאות לדליפה
- 🔐 **Hardware-backed** - מפתחות מאוחסנים בחומרה מאובטחת
- 🔐 **Origin-bound** - עובד רק על הדומיין הרשום
- 🔐 **User verification** - דורש אימות ביומטרי בכל כניסה

## 🌐 תמיכה בדפדפנים

| דפדפן | גרסה מינימלית | תמיכה |
|-------|---------------|--------|
| Chrome | 67+ | ✅ מלאה |
| Safari | 14+ | ✅ מלאה |
| Edge | 18+ | ✅ מלאה |
| Firefox | 60+ | ✅ מלאה |
| Opera | 54+ | ✅ מלאה |

## 📱 תמיכה במכשירים

| פלטפורמה | אימות ביומטרי |
|----------|---------------|
| iOS 14+ | Face ID / Touch ID |
| Android 7+ | Fingerprint / Face Unlock |
| Windows 10+ | Windows Hello |
| macOS | Touch ID / Face ID |

## 🐛 Troubleshooting

### "WebAuthn לא נתמך"
- ודא שאתה משתמש בדפדפן מודרני
- ודא ש-HTTPS פעיל
- נסה דפדפן אחר

### "NotAllowedError"
- ודא שה-RP_ID תואם לדומיין
- ודא שה-RP_ORIGIN כולל https://
- נקה cache של הדפדפן
- ודא שיש לך אימות ביומטרי מוגדר במכשיר

### "SecurityError"
- ודא ש-HTTPS פעיל ותקין
- ודא שהתעודת SSL תקפה
- בדוק שאין mixed content (HTTP + HTTPS)

### "InvalidStateError"
- המכשיר כבר רשום
- נסה להסיר את המכשיר ולרשום מחדש

## 📚 משאבים נוספים

- [WebAuthn Specification](https://www.w3.org/TR/webauthn/)
- [FIDO Alliance](https://fidoalliance.org/)
- [SimpleWebAuthn Documentation](https://simplewebauthn.dev/)
- [WebAuthn Guide](https://webauthn.guide/)

## 🔄 השוואה: PIN vs WebAuthn

| תכונה | PIN System | WebAuthn |
|-------|-----------|----------|
| אבטחה | ⭐⭐⭐ טובה | ⭐⭐⭐⭐⭐ מצוינת |
| ביומטריה אמיתית | ❌ לא | ✅ כן |
| דורש HTTPS יציב | ❌ לא | ✅ כן |
| עובד ב-Cloudflare Tunnel | ✅ כן | ❌ לא |
| Phishing-resistant | ❌ לא | ✅ כן |
| תמיכה בדפדפנים | ✅ כולם | ⚠️ מודרניים |
| קלות הטמעה | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

## 💡 המלצות

### לפיתוח (Development)
- השתמש במערכת ה-PIN (כבר מוטמעת)
- עובד עם Cloudflare Tunnel
- מספיק טוב לבדיקות

### לפרודקשן (Production)
- השתמש ב-WebAuthn (מוטמע במדריך זה)
- דורש דומיין קבוע עם SSL
- אבטחה מקסימלית
- חוויית משתמש מצוינת

## 🎯 סיכום

מערכת ה-WebAuthn מספקת את רמת האבטחה הגבוהה ביותר האפשרית לאימות משתמשים. היא משתמשת בחומרת האבטחה של המכשיר ומספקת הגנה מפני phishing, credential theft, ו-replay attacks.

לאחר הגדרת דומיין קבוע עם SSL, המערכת תעבוד בצורה מושלמת ותספק למשתמשים חוויית כניסה מהירה, נוחה, ומאובטחת ביותר.

---

**נוצר ב:** 26 במרץ 2026  
**גרסה:** 1.0.0  
**מחבר:** ShiftGuard Development Team
