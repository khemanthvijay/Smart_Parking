from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta,timezone
import psycopg2
import random, string
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token,set_access_cookies
import bcrypt
import redis
import os, json

guest_bp = Blueprint("guest", __name__)

# PostgreSQL Database Connection
db_conn = psycopg2.connect(os.getenv("DATABASE_URL"))
db_cursor = db_conn.cursor()

redis_client = redis.StrictRedis(host="redis", port=6379, db=0, decode_responses=True)

# ---------------------- Helper Functions ----------------------
def validate_booking_times(start_time_str, end_time_str):
    try:
        start_time = datetime.fromisoformat(start_time_str)
        end_time = datetime.fromisoformat(end_time_str)
    except ValueError:
        return False, "Invalid date format."
    if start_time >= end_time:
        return False, "End Time must be after Start Time."
    duration = (end_time - start_time).total_seconds() / 60
    if duration not in (30, 60):
        return False, "Booking duration must be exactly 30 minutes or 1 hour."
    return True, ""

def is_code_valid(code):
    db_cursor.execute("SELECT code, valid_until, is_used FROM guest_codes WHERE code = %s", (code,))
    result = db_cursor.fetchone()
    if not result:
        return False, "Invalid code."
    _, valid_until, is_used = result
    if is_used:
        return False, "Code has already been used."
    if valid_until and datetime.now(timezone.utc) > valid_until:
        return False, "Code has expired."
    return True, None

def mark_code_as_used(code):
    db_cursor.execute("UPDATE guest_codes SET is_used = true WHERE code = %s", (code,))
    db_conn.commit()

def generate_guest_identifier(first_name):
    base = first_name.lower()
    suffix = 1
    identifier = f"{base}{suffix}"
    while True:
        db_cursor.execute("SELECT guest_identifier FROM guest_accounts WHERE guest_identifier = %s", (identifier,))
        if not db_cursor.fetchone():
            break
        suffix += 1
        identifier = f"{base}{suffix}"
    return identifier

# ---------------------- Guest Registration Endpoint ----------------------
@guest_bp.route("/api/guest/register", methods=["POST"])
def guest_register():
    data = request.json
    data = data.get('formData')
    print(data)
    first_name = data.get("firstName")
    last_name = data.get("lastName")
    apt_number = data.get("aptNumber")
    code = data.get("code")
    start_time = data.get("startTime")
    end_time = data.get("endTime")
    contact_info = data.get("contactInfo")

    errors = []
    if not first_name: errors.append("First Name is required")
    if not last_name: errors.append("Last Name is required")
    if not apt_number: errors.append("Apt Number is required")
    if not code: errors.append("Code is required")
    if not start_time: errors.append("Start Time is required")
    if not end_time: errors.append("End Time is required")
    if not contact_info: errors.append("Contact Info is required")
    if errors:
        return jsonify({"errors": errors}), 400

    valid, msg = validate_booking_times(start_time, end_time)
    if not valid:
        return jsonify({"error": msg}), 400

    valid_code, code_msg = is_code_valid(code)
    if not valid_code:
        return jsonify({"error": code_msg}), 400

    try:
        # Insert booking into guest_bookings
        db_cursor.execute(
            """INSERT INTO guest_bookings 
               (first_name, last_name, apt_number, code, start_time, end_time, contact_info, status)
               VALUES (%s, %s, %s, %s, %s, %s, %s, 'active')
               RETURNING id""",
            (first_name, last_name, apt_number, code, start_time, end_time, contact_info)
        )
        booking_id = db_cursor.fetchone()[0]
        db_conn.commit()

        mark_code_as_used(code)

        # Create guest account without auto-generated password.
        guest_identifier = generate_guest_identifier(first_name)
        # Insert with an empty password (guest will set it later)
        db_cursor.execute(
            "INSERT INTO guest_accounts (guest_identifier, password, booking_id) VALUES (%s, %s, %s)",
            (guest_identifier, '', booking_id)
        )
        db_conn.commit()

        return jsonify({
            "message": "Registration successful! Please set your password.",
            "bookingId": booking_id,
            "guestIdentifier": guest_identifier
        }), 200

    except Exception as e:
        db_conn.rollback()
        return jsonify({"error": str(e)}), 500

# ---------------------- Guest Set Password Endpoint ----------------------
@guest_bp.route("/api/guest/set-password", methods=["POST"])
def set_guest_password():
    data = request.json
    guest_identifier = data.get("guestID")
    print(guest_identifier)
    password = data.get("password")
    confirm_password = data.get("confirmPassword")
    if not guest_identifier or not password or not confirm_password:
        return jsonify({"error": "Guest Identifier, password, and confirm password are required."}), 400
    if password != confirm_password:
        return jsonify({"error": "Passwords do not match."}), 400
    try:
        db_cursor.execute("SELECT id FROM guest_bookings WHERE code = %s", (guest_identifier,))
        result = db_cursor.fetchone()
        if not result:
            return jsonify({"error": "Guest identifier not found."}), 404
        db_cursor.execute("SELECT password FROM guest_accounts WHERE booking_id = %s", (result[0],))
        existing_password = db_cursor.fetchone()
        if existing_password[0]:
            return jsonify({"error": "Password has already been set."}), 400
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        db_cursor.execute("UPDATE guest_accounts SET password = %s WHERE booking_id = %s", (hashed_password, result[0]))
        db_conn.commit()
        return jsonify({"message": "Password set successfully."}), 200
    except Exception as e:
        db_conn.rollback()
        return jsonify({"error": str(e)}), 500

# ---------------------- Get Active Guest Bookings ----------------------
@guest_bp.route("/api/guest/bookings", methods=["GET"])
def get_guest_bookings():
    try:
        db_cursor.execute("SELECT id, first_name, last_name, apt_number, start_time, end_time, contact_info, status FROM guest_bookings WHERE status = 'active'")
        bookings = db_cursor.fetchall()
        bookings_list = []
        for b in bookings:
            bookings_list.append({
                "id": b[0],
                "firstName": b[1],
                "lastName": b[2],
                "aptNumber": b[3],
                "startTime": b[4].isoformat(),
                "endTime": b[5].isoformat(),
                "contactInfo": b[6],
                "status": b[7]
            })
        return jsonify({"bookings": bookings_list}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Additional endpoints for updating and deleting guest bookings would follow a similar pattern...
@guest_bp.route("/api/guest/generate-code", methods=["POST"])
@jwt_required(locations=["cookies"])
def generate_guest_code():
    current_user = get_jwt_identity()
    # Ensure the current user is a resident (role "user")
    if current_user.get("role") != "user":
        return jsonify({"error": "Unauthorized access"}), 403

    # Generate a random 6-character alphanumeric code
    def get_random_code():
        return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    
    code = get_random_code()
    # Ensure the code is unique in guest_codes table
    while True:
        db_cursor.execute("SELECT code FROM guest_codes WHERE code = %s", (code,))
        if not db_cursor.fetchone():
            break
        code = get_random_code()
    
    # Set the code to be valid for 2 hours from now
    valid_until = datetime.utcnow() + timedelta(hours=2)
    
    try:
        # Insert the generated code into guest_codes table
        db_cursor.execute(
            "INSERT INTO guest_codes (code, generated_by, valid_until, is_used) VALUES (%s, %s, %s, false)",
            (code, current_user.get("id"), valid_until)
        )
        db_conn.commit()
        return jsonify({
            "message": "Guest code generated successfully",
            "code": code,
            "validUntil": valid_until.isoformat()
        }), 200
    except Exception as e:
        db_conn.rollback()
        return jsonify({"error": str(e)}), 500

@guest_bp.route("/api/guest/login", methods=["POST"])
def guest_login():
    data = request.json
    guest_identifier = data.get("guestIdentifier")
    password = data.get("password")
    
    if not guest_identifier or not password:
        return jsonify({"error": "Guest Identifier and Password are required"}), 400

    try:
        db_cursor.execute("SELECT id, password FROM guest_accounts WHERE guest_identifier = %s", (guest_identifier,))
        result = db_cursor.fetchone()
        if not result:
            return jsonify({"error": "Invalid credentials"}), 401

        account_id, stored_hashed_password = result
        if not bcrypt.checkpw(password.encode('utf-8'), stored_hashed_password.encode('utf-8')):
            return jsonify({"error": "Invalid credentials"}), 401

        # Create a JWT token for the guest
        access_token = create_access_token(identity=json.dumps({"id": account_id, "role": "guest", "guestIdentifier": guest_identifier}))
        redis_client.setex(f"user:{account_id}", 1800, access_token)
        response = jsonify({"access_token": access_token})
        set_access_cookies(response, access_token)
        return response, 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@guest_bp.route("/api/guest/dashboard", methods=["GET"])
@jwt_required(locations=["cookies"])
def guest_dashboard():
    current_guest = get_jwt_identity()
    guest_id = current_guest.get("id")
    # Fetch guest account info along with a booking reference.
    db_cursor.execute("""
        SELECT ga.guest_identifier, ga.created_at, gb.first_name, gb.last_name, gb.apt_number, 
               gb.start_time, gb.end_time, gb.contact_info
        FROM guest_accounts ga
        LEFT JOIN guest_bookings gb ON ga.booking_id = gb.id
        WHERE ga.id = %s
    """, (guest_id,))
    result = db_cursor.fetchone()
    if not result:
        return jsonify({"error": "Guest account not found"}), 404
    guest_info = {
         "guestIdentifier": result[0],
         "createdAt": result[1].isoformat() if result[1] else None,
         "firstName": result[2],
         "lastName": result[3],
         "aptNumber": result[4],
         "bookingStart": result[5].isoformat() if result[5] else None,
         "bookingEnd": result[6].isoformat() if result[6] else None,
         "contactInfo": result[7]
    }
    # Fetch active bookings for this guest (assuming multiple bookings can exist)
    db_cursor.execute("""
        SELECT id, start_time, end_time, contact_info, status, created_at
        FROM guest_bookings 
        WHERE apt_number = %s AND status = 'active'
        ORDER BY start_time
    """, (guest_info["aptNumber"],))
    bookings = db_cursor.fetchall()
    booking_list = []
    for b in bookings:
        booking_list.append({
            "id": b[0],
            "startTime": b[1].isoformat(),
            "endTime": b[2].isoformat(),
            "contactInfo": b[3],
            "status": b[4],
            "createdAt": b[5].isoformat()
        })
    # Stub values for next availability and hourly prediction (replace with real logic)
    dashboard_data = {
         "guestInfo": guest_info,
         "bookings": booking_list,
         "nextAvailability": "In 30 minutes",
         "hourlyPrediction": "Estimated 5 slots available in next hour"
    }
    return jsonify(dashboard_data), 200

# ---------------------- GUEST CHANGE PASSWORD ----------------------
@guest_bp.route("/api/guest/change-password", methods=["PUT"])
@jwt_required(locations=["cookies"])
def guest_change_password():
    current_guest = get_jwt_identity()
    guest_id = current_guest.get("id")
    data = request.json
    password = data.get("password")
    confirm_password = data.get("confirmPassword")
    if not password or not confirm_password:
        return jsonify({"error": "Password and confirmation are required"}), 400
    if password != confirm_password:
        return jsonify({"error": "Passwords do not match"}), 400
    try:
        import bcrypt
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        db_cursor.execute("UPDATE guest_accounts SET password = %s WHERE id = %s", (hashed_password, guest_id))
        db_conn.commit()
        return jsonify({"message": "Password updated successfully"}), 200
    except Exception as e:
        db_conn.rollback()
        return jsonify({"error": str(e)}), 500

# ---------------------- GUEST DELETE ACCOUNT ----------------------
@guest_bp.route("/api/guest/delete-account", methods=["DELETE"])
@jwt_required(locations=["cookies"])
def guest_delete_account():
    current_guest = get_jwt_identity()
    guest_id = current_guest.get("id")
    try:
        db_cursor.execute("DELETE FROM guest_accounts WHERE id = %s", (guest_id,))
        db_conn.commit()
        return jsonify({"message": "Guest account deleted successfully"}), 200
    except Exception as e:
        db_conn.rollback()
        return jsonify({"error": str(e)}), 500


@guest_bp.route("/api/guest/bookings/<int:booking_id>", methods=["PUT"])
def update_guest_booking(booking_id):
    data = request.json
    start_time = data.get("startTime")
    end_time = data.get("endTime")
    contact_info = data.get("contactInfo")
    status = data.get("status")
    try:
        update_fields = []
        update_values = []
        if start_time:
            update_fields.append("start_time = %s")
            update_values.append(start_time)
        if end_time:
            update_fields.append("end_time = %s")
            update_values.append(end_time)
        if contact_info:
            update_fields.append("contact_info = %s")
            update_values.append(contact_info)
        if status:
            update_fields.append("status = %s")
            update_values.append(status)
        if not update_fields:
            return jsonify({"error": "No valid fields to update"}), 400
        update_values.append(booking_id)
        query = f"UPDATE guest_bookings SET {', '.join(update_fields)} WHERE id = %s"
        db_cursor.execute(query, tuple(update_values))
        db_conn.commit()
        return jsonify({"message": "Booking updated successfully"}), 200
    except Exception as e:
        db_conn.rollback()
        return jsonify({"error": str(e)}), 500

@guest_bp.route("/api/guest/bookings/<int:booking_id>", methods=["DELETE"])
def delete_guest_booking(booking_id):
    try:
        db_cursor.execute("DELETE FROM guest_bookings WHERE id = %s", (booking_id,))
        db_conn.commit()
        return jsonify({"message": "Booking deleted successfully"}), 200
    except Exception as e:
        db_conn.rollback()
        return jsonify({"error": str(e)}), 500