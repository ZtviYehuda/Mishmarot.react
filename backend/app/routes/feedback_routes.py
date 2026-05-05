from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.feedback_model import FeedbackModel

feedback_bp = Blueprint('feedback', __name__)

@feedback_bp.route('/create', methods=['POST'])
@jwt_required()
def submit_feedback():
    import json
    identity_raw = get_jwt_identity()
    try:
        user_identity = json.loads(identity_raw) if isinstance(identity_raw, str) else identity_raw
    except (json.JSONDecodeError, TypeError):
        user_identity = identity_raw

    user_id = user_identity.get('id') if isinstance(user_identity, dict) else user_identity
    
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
    # In a real app, check if user is admin
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
