from flask.json.provider import DefaultJSONProvider
from datetime import date, datetime

class CustomJSONProvider(DefaultJSONProvider):
    def default(self, obj):
        # המרה אוטומטית של תאריכים למחרוזת כדי למנוע שגיאות ב-JSON
        if isinstance(obj, (date, datetime)):
            return obj.isoformat()
        return super().default(obj)