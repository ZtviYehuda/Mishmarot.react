from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from app.config import Config
from app.utils.json_provider import CustomJSONProvider
from app.utils.setup import setup_database


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Disable redirect on trailing slash for CORS preflight
    app.url_map.strict_slashes = False

    # הגדרת פורמט JSON תקין
    app.json = CustomJSONProvider(app)

    # --- תיקון CORS קריטי ---
    # מאפשר גישה מהפרונט לכל הנתיבים
    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": ["http://localhost:5173", "http://localhost:5174"],
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization"],
                "expose_headers": ["Content-Type"],
                "max_age": 3600,
            }
        },
        supports_credentials=True,
        automatic_options=True,
    )

    jwt = JWTManager(app)

    # JWT error handlers - עבור debug
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        print(f"[JWT ERROR] Invalid token: {error}")
        return {"error": f"Invalid token: {error}"}, 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        print(f"[JWT ERROR] Missing token: {error}")
        return {"error": f"Missing token: {error}"}, 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_data):
        print(f"[JWT ERROR] Token expired")
        return {"error": "Token has expired"}, 401

    # חיבור וניתוק ממסד הנתונים
    from app.utils.db import close_db

    app.teardown_appcontext(close_db)

    # אתחול מסד הנתונים
    with app.app_context():
        try:
            setup_database()
        except Exception as e:
            print(f"⚠️ Database setup warning: {e}")

    # --- רישום הנתיבים (Blueprints) ---
    # זה החלק שחסר או שגוי אצלך שגורם לשגיאת 404
    from app.routes.auth_routes import auth_bp
    from app.routes.employee_routes import emp_bp
    from app.routes.attendance_routes import att_bp
    from app.routes.transfer_routes import transfer_bp
    from app.routes.notification_routes import notif_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(emp_bp, url_prefix="/api/employees", strict_slashes=False)
    app.register_blueprint(att_bp, url_prefix="/api/attendance", strict_slashes=False)
    app.register_blueprint(
        transfer_bp, url_prefix="/api/transfers", strict_slashes=False
    )
    app.register_blueprint(
        notif_bp, url_prefix="/api/notifications", strict_slashes=False
    )

    return app
