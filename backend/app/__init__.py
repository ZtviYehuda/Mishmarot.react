from flask import Flask, request, jsonify, make_response

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

    # --- Manual CORS Handling (The "Iron" Solution) ---
    @app.before_request
    def handle_options_preflight():
        if request.method == 'OPTIONS':
            response = make_response()
            origin = request.headers.get('Origin')
            if origin:
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
                response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Access-Control-Allow-Private-Network, bypass-tunnel-reminder"
                response.headers["Access-Control-Allow-Credentials"] = "true"
                response.headers["Access-Control-Allow-Private-Network"] = "true"
            return response

    @app.after_request
    def add_cors_headers(response):
        origin = request.headers.get('Origin')
        if origin:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Access-Control-Allow-Private-Network, bypass-tunnel-reminder"
            response.headers["Access-Control-Allow-Credentials"] = "true"
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
            print(f"Database setup warning: {e}")

        # Automatic audit log rotation (archives logs older than 7 days)
        try:
            from app.utils.audit_rotation import rotate_audit_logs
            rotate_audit_logs()
        except Exception as e:
            print(f"Audit rotation warning: {e}")

    # --- רישום הנתיבים (Blueprints) ---
    # זה החלק שחסר או שגוי אצלך שגורם לשגיאת 404

    from app.routes.auth_routes import auth_bp
    from app.routes.employee_routes import emp_bp
    from app.routes.attendance_routes import att_bp
    from app.routes.transfer_routes import transfer_bp
    from app.routes.notification_routes import notif_bp
    from app.routes.admin_routes import admin_bp
    from app.routes.support_routes import support_bp
    from app.routes.audit_routes import audit_bp
    from app.routes.archive_routes import archive_bp
    from app.routes.feedback_routes import feedback_bp
    # from app.routes.webauthn_routes import webauthn_bp

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
    app.register_blueprint(audit_bp, url_prefix="/api/audit", strict_slashes=False)
    app.register_blueprint(archive_bp, url_prefix="/api/archive", strict_slashes=False)
    app.register_blueprint(feedback_bp, url_prefix="/api/feedback", strict_slashes=False)
    # app.register_blueprint(webauthn_bp)

    return app
