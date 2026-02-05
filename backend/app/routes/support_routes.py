from flask import Blueprint, request, jsonify
from app.models.support_model import SupportModel

support_bp = Blueprint("support", __name__)


@support_bp.route("/tickets", methods=["POST"])
def create_ticket():
    data = request.get_json()

    # Basic validation
    required = ["full_name", "personal_number", "subject", "message"]
    if not all(k in data for k in required):
        return jsonify({"error": "Missing required fields"}), 400

    ticket_id = SupportModel.create_ticket(data)
    if ticket_id:
        return jsonify({"message": "Ticket created successfully", "id": ticket_id}), 201
    else:
        return jsonify({"error": "Failed to create ticket"}), 500


@support_bp.route("/tickets", methods=["GET"])
# Note: Ideally this should be protected by admin check
def get_tickets():
    tickets = SupportModel.get_all_tickets()
    return jsonify(tickets), 200
