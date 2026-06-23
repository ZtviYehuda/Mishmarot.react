from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.feedback_model import FeedbackModel

feedback_bp = Blueprint('feedback', __name__)

@feedback_bp.route('/', methods=['POST'])
@feedback_bp.route('/create', methods=['POST'])
@jwt_required()
def submit_feedback():
    import json
    identity_raw = get_jwt_identity()
    try:
        user_identity = json.loads(identity_raw) if isinstance(identity_raw, str) else identity_raw
    except (json.JSONDecodeError, TypeError):
        user_identity = identity_raw

    # Robust user_id extraction
    user_id = None
    if isinstance(user_identity, dict):
        user_id = user_identity.get('id')
    else:
        try:
            user_id = int(user_identity)
        except (ValueError, TypeError):
            user_id = user_identity

    # Final check: if user_id is still a dict for some reason, try to get 'id' from it
    if isinstance(user_id, dict):
        user_id = user_id.get('id')
    
    data = request.get_json()
    
    with open('debug.log', 'a', encoding='utf-8') as f:
        f.write(f"\n--- Feedback Request ---\n")
        f.write(f"User ID Data: {identity_raw}\n")
        f.write(f"Extracted User ID: {user_id}\n")
        f.write(f"Data: {data}\n")
    
    if not data or not data.get('description'):
        print("DEBUG: Feedback rejected: Missing description", flush=True)
        return jsonify({"error": "Description is required"}), 400
        
    feedback_data = {
        "user_id": user_id,
        "category": data.get('category', 'improvement'),
        "description": data.get('description'),
        "screenshot_url": data.get('screenshot_url'),
        "context_page": data.get('context_page'),
        "user_agent": request.headers.get('User-Agent')
    }
    
    try:
        new_id = FeedbackModel.create_feedback(feedback_data)
        if new_id:
            with open('debug.log', 'a', encoding='utf-8') as f:
                f.write(f"SUCCESS: ID {new_id}\n")
            return jsonify({"message": "Feedback submitted successfully", "id": new_id}), 201
        else:
            with open('debug.log', 'a', encoding='utf-8') as f:
                f.write(f"FAILED: Model returned None\n")
            return jsonify({"error": "Failed to submit feedback"}), 500
    except Exception as e:
        with open('debug.log', 'a', encoding='utf-8') as f:
            f.write(f"EXCEPTION: {str(e)}\n")
            import traceback
            f.write(traceback.format_exc())
        return jsonify({"error": "Internal server error during submission"}), 500

@feedback_bp.route('/my', methods=['GET'])
@jwt_required()
def get_my_feedback():
    import json
    identity_raw = get_jwt_identity()
    try:
        user_identity = json.loads(identity_raw) if isinstance(identity_raw, str) else identity_raw
    except (json.JSONDecodeError, TypeError):
        user_identity = identity_raw

    user_id = user_identity.get('id') if isinstance(user_identity, dict) else user_identity
    feedbacks = FeedbackModel.get_user_feedbacks(user_id)
    return jsonify(feedbacks), 200

@feedback_bp.route('/admin/all', methods=['GET'])
@jwt_required()
def get_all_feedback():
    identity_raw = get_jwt_identity()
    try:
        identity = json.loads(identity_raw) if isinstance(identity_raw, str) else identity_raw
    except:
        identity = identity_raw
    
    # Check if user is admin
    if not (isinstance(identity, dict) and identity.get('is_admin')):
        return jsonify({"error": "Unauthorized"}), 403
        
    feedbacks = FeedbackModel.get_all_feedbacks()
    return jsonify(feedbacks), 200

@feedback_bp.route('/admin/update/<int:feedback_id>', methods=['PUT'])
@jwt_required()
def update_feedback(feedback_id):
    data = request.get_json()
    status = data.get('status')
    admin_reply = data.get('admin_reply')
    
    if not status:
        return jsonify({"error": "Status is required"}), 400
        
    success = FeedbackModel.update_feedback_status(feedback_id, status, admin_reply)
    if success:
        return jsonify({"message": "Feedback updated successfully"}), 200
    return jsonify({"error": "Failed to update feedback"}), 500

@feedback_bp.route('/updates', methods=['GET'])
@jwt_required()
def get_system_updates():
    from app.utils.db import get_db_connection
    from psycopg2.extras import RealDictCursor
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "DB connection failed"}), 500
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT id, version, release_date, features, created_at, created_by
            FROM system_updates
            ORDER BY release_date DESC, id DESC
        """)
        rows = cur.fetchall()
        
        result = []
        for r in rows:
            r_dict = dict(r)
            if r_dict['release_date']:
                r_dict['release_date'] = r_dict['release_date'].isoformat()
            if r_dict['created_at']:
                r_dict['created_at'] = r_dict['created_at'].isoformat()
            result.append(r_dict)
        return jsonify(result), 200
    except Exception as e:
        print(f"Error fetching system updates: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@feedback_bp.route('/updates', methods=['POST'])
@jwt_required()
def add_system_update():
    import json
    from datetime import datetime
    identity_raw = get_jwt_identity()
    try:
        identity = json.loads(identity_raw) if isinstance(identity_raw, str) else identity_raw
    except:
        identity = identity_raw
        
    # Check admin privileges
    if not (isinstance(identity, dict) and identity.get('is_admin')):
        return jsonify({"error": "Unauthorized"}), 403
        
    user_id = identity.get('id')
    data = request.get_json() or {}
    version = data.get('version')
    release_date = data.get('release_date')
    features = data.get('features') # list of strings
    
    if not version or not features:
        return jsonify({"error": "Version and features are required"}), 400
        
    if not isinstance(features, list):
        return jsonify({"error": "Features must be a list of strings"}), 400
        
    # Default release_date to today if not provided
    if not release_date:
        release_date = datetime.now().date().isoformat()
        
    from app.utils.db import get_db_connection
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "DB connection failed"}), 500
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO system_updates (version, release_date, features, created_by)
            VALUES (%s, %s, %s, %s)
            RETURNING id
        """, (version, release_date, json.dumps(features), user_id))
        new_id = cur.fetchone()[0]
        conn.commit()
        return jsonify({"message": "System update created", "id": new_id}), 201
    except Exception as e:
        conn.rollback()
        print(f"Error creating system update: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@feedback_bp.route('/updates/<int:update_id>', methods=['DELETE'])
@jwt_required()
def delete_system_update(update_id):
    import json
    identity_raw = get_jwt_identity()
    try:
        identity = json.loads(identity_raw) if isinstance(identity_raw, str) else identity_raw
    except:
        identity = identity_raw
        
    # Check admin privileges
    if not (isinstance(identity, dict) and identity.get('is_admin')):
        return jsonify({"error": "Unauthorized"}), 403
        
    from app.utils.db import get_db_connection
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "DB connection failed"}), 500
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM system_updates WHERE id = %s", (update_id,))
        conn.commit()
        return jsonify({"message": "System update deleted"}), 200
    except Exception as e:
        conn.rollback()
        print(f"Error deleting system update: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()
