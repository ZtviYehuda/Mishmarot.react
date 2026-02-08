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
    # הגדרת מקורות מורשים ספציפיים במקום כוכבית כדי לאפשר Credentials
    origins_list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://moments-accomplish-soon-guestbook.trycloudflare.com",
    ]

    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": origins_list,
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                "allow_headers": [
                    "Content-Type",
                    "Authorization",
                    "Access-Control-Allow-Private-Network",
                ],
                "expose_headers": ["Content-Type"],
                "max_age": 3600,
            }
        },
        supports_credentials=True,
    )

    @app.after_request
    def add_cors_headers(response):
        # PNA Header must be present to allow HTTPS public site to talk to HTTP localhost
        response.headers["Access-Control-Allow-Private-Network"] = "true"
        return response

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

    # Start Background Scheduler
    try:
        from app.utils.scheduler import start_scheduler
        start_scheduler()
    except Exception as e:
        print(f"⚠️ Scheduler start warning: {e}")

    # --- רישום הנתיבים (Blueprints) ---
    # זה החלק שחסר או שגוי אצלך שגורם לשגיאת 404
    from app.routes.auth_routes import auth_bp
    from app.routes.employee_routes import emp_bp
    from app.routes.attendance_routes import att_bp
    from app.routes.transfer_routes import transfer_bp
    from app.routes.notification_routes import notif_bp
    from app.routes.admin_routes import admin_bp
    from app.routes.support_routes import support_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(emp_bp, url_prefix="/api/employees", strict_slashes=False)
    app.register_blueprint(att_bp, url_prefix="/api/attendance", strict_slashes=False)
    app.register_blueprint(
        transfer_bp, url_prefix="/api/transfers", strict_slashes=False
    )
    app.register_blueprint(
        notif_bp, url_prefix="/api/notifications", strict_slashes=False
    )
    app.register_blueprint(admin_bp, url_prefix="/api/admin", strict_slashes=False)
    app.register_blueprint(support_bp, url_prefix="/api/support", strict_slashes=False)

    return app
