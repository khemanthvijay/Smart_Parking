from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import psycopg2
import redis
from auth_utils import role_required  # role_required defined in auth_utils.py to avoid circular imports
import os, json
dashboard_bp = Blueprint("dashboard", __name__)

# PostgreSQL Database Connection
db_conn = psycopg2.connect(os.getenv("DATABASE_URL"))
db_cursor = db_conn.cursor()

# Redis Connection
redis_client = redis.StrictRedis(redis_host = os.getenv("REDIS_HOST"), port=6379, db=0, decode_responses=True)

# ---------------------- Helper: Get Available Parking Spaces ----------------------
def get_available_spaces():
    # Fetch total spaces per section from parking_spaces (for lot_id = 1)
    db_cursor.execute("SELECT section, COUNT(*) FROM parking_spaces WHERE lot_id = 1 GROUP BY section")
    total_spaces_data = db_cursor.fetchall()
    total_spaces = {}
    for row in total_spaces_data:
        total_spaces[row[0]] = row[1]
    # Example: total_spaces might be { "general": 18, "guest": 10, "handicapped": 2, ... }

    # Compute net occupancy by summing entries and exits for each category.
    # We assume gate_logs_users has columns: parking_category, event_type, and status.
    # Only records with status 'successful' are considered.
    db_cursor.execute("""
        SELECT parking_category, event_type, COUNT(*) 
        FROM gate_logs_users 
        WHERE status = 'successful'
        GROUP BY parking_category, event_type
    """)
    logs = db_cursor.fetchall()
    occupancy = {"resident": 0, "guest": 0}
    for category, event_type, count in logs:
        # For residents, we assume the 'general' parking spaces are used.
        if category == "resident":
            if event_type == "entry":
                occupancy["resident"] += count
            elif event_type == "exit":
                occupancy["resident"] -= count
        elif category == "guest":
            if event_type == "entry":
                occupancy["guest"] += count
            elif event_type == "exit":
                occupancy["guest"] -= count

    available_spaces = {
        "total_general": total_spaces.get("general", 0),
        "total_guest": total_spaces.get("guest", 0),
        "available_resident": total_spaces.get("general", 0) - occupancy["resident"],
        "available_guest": total_spaces.get("guest", 0) - occupancy["guest"]
    }
    return available_spaces

# ---------------------- DASHBOARD USER DATA ----------------------
@dashboard_bp.route("/api/dashboard-user-data", methods=["GET"])
@jwt_required(locations=["cookies"])
def dashboard_user_data():
    current_user = json.loads(get_jwt_identity())
    user_id = current_user.get("id")
    db_cursor.execute("SELECT * FROM user_management WHERE id = %s", (user_id,))
    result = db_cursor.fetchone()
    if not result:
        return jsonify({"error": "User not found"}), 404

    available_spaces = get_available_spaces()

    return jsonify({
        "user": {"id": user_id},
        "parking_data": {
            "total_general": available_spaces["total_general"],
            "total_guest": available_spaces["total_guest"],
            "available_resident": available_spaces["available_resident"],
            "available_guest": available_spaces["available_guest"]
        }
    }), 200
# ---------------------- OPEN GATE ----------------------
@dashboard_bp.route("/api/open-gate", methods=["POST"])
@jwt_required(locations=["cookies"])
def open_gate():
    current_user = get_jwt_identity()
    role, user_id = current_user.get("role"), current_user.get("id")
    
    # Only users (residents) can use this endpoint.
    if role != "user":
        return jsonify({"error": "Unauthorized"}), 403

    data = request.json
    gate_number = data.get("gate")
    # Optionally, you may accept a request_source from the client (defaulting to "app")
    request_source = data.get("request_source", "app")
    # Automatically determine parking_category based on the user's role.
    parking_category = "resident"  # since role is "user"

    # Determine event type automatically based on the last event for this user.
    # Here we assume the user's apt_number is unique and exists in user_management.
    db_cursor.execute(
        "SELECT event_type FROM gate_logs_users WHERE apt_number = (SELECT apt_number FROM user_management WHERE id = %s) ORDER BY event_time DESC LIMIT 1",
        (user_id,)
    )
    last_event = db_cursor.fetchone()
    if last_event and last_event[0] == "entry":
        event_type = "exit"
    else:
        event_type = "entry"

    # Check that the user is active.
    db_cursor.execute("SELECT status, apt_number FROM user_management WHERE id = %s", (user_id,))
    result = db_cursor.fetchone()

    if result and result[0] == "active":
        db_cursor.execute(
            """INSERT INTO gate_logs_users 
               (apt_number, status, additional_info, request_source, event_type, parking_category)
               VALUES (%s, %s, %s, %s, %s, %s)""",
            (result[1], "successful", gate_number, request_source, event_type, parking_category)
        )
        db_conn.commit()
        return jsonify({"message": f"Gate {gate_number} opened successfully! Event type: {event_type}"}), 200
    else:
        return jsonify({"error": "Your account is not active or you don't have permission."}), 403


# ---------------------- FETCH ALL USERS (Admin/api/Management Only) ----------------------
@dashboard_bp.route("/api/dashboard-admin-all-users", methods=["GET"])
@role_required(["admin", "management"])
def fetch_users():
    try:
        db_cursor.execute("SELECT id, apt_number, status FROM user_management WHERE role = 'user'")
        users = db_cursor.fetchall()
        users_list = [{"id": u[0], "aptNumber": u[1], "status": u[2]} for u in users]
        return jsonify({"users": users_list}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------------- FETCH SINGLE USER (Admin/api/Management Only) ----------------------
@dashboard_bp.route("/api/user/<apt_number>", methods=["GET"])
@role_required(["admin", "management"])
def fetch_user(apt_number):
    try:
        db_cursor.execute(
            "SELECT id, apt_number, status FROM user_management WHERE role = 'user' AND apt_number = %s",
            (apt_number,)
        )
        user = db_cursor.fetchone()
        if not user:
            return jsonify({"error": "User not found"}), 404

        user_id = user[0]
        db_cursor.execute(
            "SELECT parking_space_one_id, parking_space_two_id FROM resident_assignments WHERE user_id = %s",
            (user_id,)
        )
        resident_assignment = db_cursor.fetchone()
        assigned_spaces = []
        if resident_assignment:
            if resident_assignment[0]:
                assigned_spaces.append(resident_assignment[0])
            if resident_assignment[1]:
                assigned_spaces.append(resident_assignment[1])
        parking_list = []
        if assigned_spaces:
            db_cursor.execute(
                "SELECT space_number, section, is_occupied FROM parking_spaces WHERE lot_id = 1 AND space_number IN %s",
                (tuple(assigned_spaces),)
            )
            parking_spaces = db_cursor.fetchall()
            parking_list = [{"spaceNumber": p[0], "section": p[1], "isOccupied": p[2]} for p in parking_spaces]

        return jsonify({
            "user": {
                "id": user_id,
                "aptNumber": user[1],
                "status": user[2],
                "parking": parking_list
            }
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------------- UPDATE USER STATUS (Admin/Management Only) ----------------------
@dashboard_bp.route("/api/update-status/<int:user_id>", methods=["POST"])
@role_required(["admin", "management"])
def update_status(user_id):
    try:
        data = request.json
        new_status = data.get("status")
        db_cursor.execute("UPDATE user_management SET status = %s WHERE id = %s", (new_status, user_id))
        db_conn.commit()
        return jsonify({"message": "User status updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------------- UPDATE PARKING TYPE (Admin/Management Only) ----------------------
@dashboard_bp.route("/api/update-parking-type/<int:user_id>", methods=["POST"])
@role_required(["admin", "management"])
def update_parking_type(user_id):
    try:
        data = request.json
        new_type = data.get("type")
        db_cursor.execute("UPDATE resident_assignments SET status = %s WHERE user_id = %s", (new_type, user_id))
        db_conn.commit()
        return jsonify({"message": "Parking type updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------------- ASSIGN PARKING SPACE (Admin/Management Only) ----------------------
@dashboard_bp.route("/api/assign-parking/<int:user_id>", methods=["POST"])
@role_required(["admin", "management"])
def assign_parking(user_id):
    try:
        data = request.json
        space_number = data.get("slot")
        db_cursor.execute("SELECT * FROM parking_spaces WHERE space_number = %s AND lot_id = 1", (space_number,))
        parking_exists = db_cursor.fetchone()
        if not parking_exists:
            return jsonify({"error": "Parking space does not exist"}), 400

        db_cursor.execute("UPDATE parking_spaces SET is_occupied = true WHERE space_number = %s", (space_number,))
        db_cursor.execute("INSERT INTO additional_resident_assignments (user_id, parking_space_id) VALUES (%s, %s)", (user_id, space_number))
        db_conn.commit()
        return jsonify({"message": "Parking space assigned successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------------- REMOVE PARKING SPACE (Admin/Management Only) ----------------------
@dashboard_bp.route("/api/remove-parking/<int:user_id>", methods=["POST"])
@role_required(["admin", "management"])
def remove_parking(user_id):
    try:
        data = request.json
        space_number = data.get("slot")
        db_cursor.execute("DELETE FROM additional_resident_assignments WHERE user_id = %s AND parking_space_id = %s", (user_id, space_number))
        db_cursor.execute("UPDATE parking_spaces SET is_occupied = false WHERE space_number = %s", (space_number,))
        db_conn.commit()
        return jsonify({"message": "Parking space removed successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------------- DELETE USER (Admin/Management Only) ----------------------
@dashboard_bp.route("/api/delete-user/<int:user_id>", methods=["DELETE"])
@role_required(["admin", "management"])
def delete_user(user_id):
    try:
        db_cursor.execute("DELETE FROM user_management WHERE id = %s", (user_id,))
        db_conn.commit()
        return jsonify({"message": "User deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
