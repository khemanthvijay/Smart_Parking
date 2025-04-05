from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import psycopg2
import redis
from auth_utils import role_required  # Moved to separate module to avoid circular imports

dashboard_bp = Blueprint("dashboard", __name__)

# PostgreSQL Database Connection
db_conn = psycopg2.connect(
    dbname="Parking_Security",
    user="Admin",
    password="Hemanth@2001",
    host="postgres",
    port="5432"
)
db_cursor = db_conn.cursor()

# Redis Connection
redis_client = redis.StrictRedis(host="localhost", port=6379, db=0, decode_responses=True)

def get_available_spaces():
    # Fetch total spaces for general and guest from `parking_spaces`
    db_cursor.execute("SELECT section, COUNT(*) FROM parking_spaces GROUP BY section")
    total_spaces_data = db_cursor.fetchall()

    total_spaces = {"general": 0, "guest": 0}
    
    for row in total_spaces_data:
        total_spaces[row[0]] = row[1]
    print(total_spaces)
    # Count occupied spaces (successful entries) from `gate_logs_users`
    db_cursor.execute("SELECT apt_number, COUNT(*) FROM gate_logs_users WHERE status = 'successful' GROUP BY apt_number")
    occupied_spaces_data = db_cursor.fetchall()

    occupied_spaces = {"general": 0, "guest": 0}  # Default 0 occupied
    for row in occupied_spaces_data:
        occupied_spaces[row[0]] = row[1]

    # Calculate available spaces
    available_spaces = {
        "general": total_spaces["general"] - occupied_spaces["general"],
        "guest": total_spaces["guest"] - occupied_spaces["guest"],
        "total": total_spaces["general"] + total_spaces["guest"] - sum(occupied_spaces.values())
    }
    print(available_spaces)
    return available_spaces


@dashboard_bp.route("/dashboard-user-data", methods=["GET"])
@jwt_required(locations=["cookies"])
def dashboard_user_data():
    current_user = get_jwt_identity()
    user_id = current_user.get("id")

    db_cursor.execute("SELECT * FROM user_management WHERE id = %s", (user_id,))
    result = db_cursor.fetchone()

    if not result:
        return jsonify({"error": "User not found"}), 404

    # Fetch dynamic available spaces
    available_spaces = get_available_spaces()

    return jsonify({
        "user": {"id": user_id},
        "parking_data": {
            "available_slots": available_spaces["general"],
            "guest_parking": available_spaces["guest"],
            "total_slots": available_spaces["total"]
        }
    }), 200

@dashboard_bp.route("/open-gate", methods=["POST"])
@jwt_required(locations=["cookies"])
def open_gate():
    current_user = get_jwt_identity()
    role, user_id = current_user.get("role"), current_user.get("id")

    if role != "user":
        return jsonify({"error": "Unauthorized"}), 403

    data = request.json
    gate_number = data.get("gate")

    db_cursor.execute("SELECT status, apt_number FROM user_management WHERE id = %s", (user_id,))
    result = db_cursor.fetchone()

    if result and result[0] == "active":
        db_cursor.execute("INSERT INTO gate_logs_users (apt_number, status, additional_info) VALUES (%s, %s, %s)",
                          (result[1], "successful", gate_number))
        db_conn.commit()
        return jsonify({"message": f"Gate {gate_number} opened successfully!"}), 200
    else:
        return jsonify({"error": "Your account is not active or you don't have permission."}), 403

# ---------------------- FETCH AVAILABLE PARKING SPACES ----------------------
@dashboard_bp.route("/available-parking", methods=["GET"])
@role_required(["admin", "management"])
def fetch_available_parking():
    try:
        # Get all available parking spaces (lot_id = 1 and not occupied)
        db_cursor.execute(
            "SELECT space_number, section FROM parking_spaces WHERE lot_id = 1 AND is_occupied = false"
        )
        available_slots = [{"spaceNumber": row[0], "section": row[1]} for row in db_cursor.fetchall()]
        return jsonify({"slots": available_slots}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------------- FETCH ALL USERS ----------------------
@dashboard_bp.route("/dashboard-admin-all-users", methods=["GET"])
@role_required(["admin", "management"])
def fetch_users():
    try:
        db_cursor.execute("SELECT id, apt_number, status FROM user_management WHERE role = 'user'")
        users = db_cursor.fetchall()
        users_list = [{"id": u[0], "aptNumber": u[1], "status": u[2]} for u in users]
        return jsonify({"users": users_list}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------------- FETCH SINGLE USER ----------------------
@dashboard_bp.route("/user/<apt_number>", methods=["GET"])
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
        # Fetch primary parking assignments from resident_assignments
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

# ---------------------- UPDATE USER STATUS ----------------------
@dashboard_bp.route("/update-status/<int:user_id>", methods=["POST"])
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



# ---------------------- ASSIGN PARKING SPACE ----------------------
@dashboard_bp.route("/assign-parking/<int:user_id>", methods=["POST"])
@role_required(["admin", "management"])
def assign_parking(user_id):
    try:
        data = request.json
        space_number = data.get("slot")
        # Check if parking space exists and is available
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

# ---------------------- REMOVE PARKING SPACE ----------------------
@dashboard_bp.route("/remove-parking/<int:user_id>", methods=["POST"])
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

# ---------------------- DELETE USER ----------------------
@dashboard_bp.route("/delete-user/<int:user_id>", methods=["DELETE"])
@role_required(["admin", "management"])
def delete_user(user_id):
    try:
        db_cursor.execute("DELETE FROM user_management WHERE id = %s", (user_id,))
        db_conn.commit()
        return jsonify({"message": "User deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
