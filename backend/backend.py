from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, get_jwt_identity, jwt_required,
    set_access_cookies, unset_jwt_cookies
)
from datetime import timedelta
import redis
import psycopg2
import bcrypt
from functools import wraps
from auth_utils import role_required
from temp_dash_route import dashboard_bp
from guest_routes import guest_bp
import os, json
# Initialize Flask App
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000", "methods": ["GET", "POST", "OPTIONS"]}}, supports_credentials=True)

# Configure JWT
app.config["JWT_SECRET_KEY"] = "flask_jwt_secret"  # Change this for production
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=30)
jwt = JWTManager(app)

# PostgreSQL Database Connection
db_conn = psycopg2.connect(os.getenv("DATABASE_URL"))
db_cursor = db_conn.cursor()

# Redis Connection
redis_client = redis.StrictRedis(host="redis", port=6379, db=0, decode_responses=True)

# Role-Based Access Control Decorator

@app.route("/")
def index():
    container_name = os.uname().nodename  # Works inside Docker
    return f"Hello from {container_name}"
def role_required(allowed_roles):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            current_user = get_jwt_identity()

            # Check Redis for active session
            session_token = redis_client.get(f"user:{current_user['id']}")
            if not session_token:
                return jsonify({"error": "Session expired, please log in again"}), 401
            
            # Refresh Redis Session Expiry
            redis_client.expire(f"user:{current_user['id']}", 1800)

            # Check if the role is allowed
            if current_user["role"] not in allowed_roles:
                return jsonify({"error": "Unauthorized access"}), 403
            
            return func(*args, **kwargs)
        return wrapper
    return decorator

# ---------------------- USER LOGIN & STORE JWT IN COOKIE ----------------------
@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    if "aptNumber" in data and isinstance(data["aptNumber"], int):
        login_field = "apt_number"
        identifier = data["aptNumber"]
    elif "username" in data:
        login_field = "username"
        identifier = data["username"]
       
    else:
        return jsonify({"error": "No valid identifier provided"}), 400
    password = data["password"]

    # Query user
    query = f"SELECT id, password, role, status FROM user_management WHERE {login_field} = %s"
    db_cursor.execute(query, (identifier,))
    user = db_cursor.fetchone()

    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    user_id, hashed_password, role, status = user

    if status != 'active':
        return jsonify({"error": "Your account is not active. Please contact support."}), 403
    
    if not bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8")):
        return jsonify({"error": "Invalid credentials"}), 401

    access_token = create_access_token(identity=json.dumps({"id": user_id, "role": role}))
    redis_client.setex(f"user:{user_id}", 1800, access_token)

    response = jsonify({"user": {"id": user_id, "identifier": identifier, "role": role, "status": status}})
    set_access_cookies(response, access_token)
    return response, 200

# ---------------------- PROTECTED ROUTES ----------------------

@app.route("/api/logout", methods=["POST"])
@jwt_required(locations=["cookies"])
def logout():
    response = jsonify({"message": "Logged out successfully!"})
    unset_jwt_cookies(response)
    return response, 200

@app.route("/api/auth/me", methods=["GET"])
@jwt_required(locations=["cookies"])
def auth_me():
    identity = json.loads(get_jwt_identity())
    user_id = identity["id"]
    role = identity["role"]

    stored_token = redis_client.get(f"user:{user_id}")
    if not stored_token:
        return jsonify({"error": "Session expired, please log in again"}), 401

    redis_client.expire(f"user:{user_id}", 1800)

    if role == "guest":
        query = "SELECT id, guest_identifier, booking_id, created_at FROM guest_accounts WHERE id = %s"
        db_cursor.execute(query, (user_id,))
        result = db_cursor.fetchone()
        if not result:
            return jsonify({"error": "Guest not found"}), 404

        guest_id, guest_identifier, booking_id, created_at = result
        return jsonify({
                "user": {
                    "id": guest_id,
                    "identifier": guest_identifier,
                    "booking_id": booking_id,
                    "role": "guest",
                    "created_at": str(created_at)
                }
            }), 200
    else:
        query = "SELECT id, apt_number, username, role, status FROM user_management WHERE id = %s"
        db_cursor.execute(query, (user_id,))
        user = db_cursor.fetchone()
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        user_id, apt_number, username, role, status = user
        identifier = apt_number if role == "user" else username
        
        return jsonify({"user": {"id": user_id, "identifier": identifier, "role": role, "status": status}}), 200

# ---------------------- REGISTRATION ROUTES ----------------------
@app.route('/api/register', methods=['POST'])
def register_user():
    data = request.json
    email, apt_number, phone_number, password = data.get('email'), data.get('aptNumber'), data.get('phone_number', None), data.get('password')

    if not email or not apt_number or not password:
        return jsonify({"error": "Email, apt_number, and password are required"}), 400

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode("utf-8")

    try:
        db_cursor.execute("INSERT INTO user_management (email, apt_number, phone_number, password, role, status) VALUES (%s, %s, %s, %s, 'user', 'active')", 
                          (email, apt_number, phone_number, hashed_password))
        db_conn.commit()
        return jsonify({"message": "User registered successfully!"}), 201
    except Exception as e:
        db_conn.rollback()
        return jsonify({"error": f"Failed to register user: {str(e)}"}), 500

@app.route('/api/register_admin', methods=['POST'])
@role_required(["admin"])
def register_admin():
    data = request.json
    username, email, phone_number, password, role, status = data.get('username'), data.get('email'), data.get('phone_number', None), data.get('password'), data.get('role'), data.get('status')

    if not email or not phone_number or not password or not role or not status:
        return jsonify({"error": "All fields are required"}), 400

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode("utf-8")

    try:
        db_cursor.execute("INSERT INTO user_management (username, email, phone_number, password, role, status) VALUES (%s, %s, %s, %s, %s, %s)", 
                          (username, email, phone_number, hashed_password, role, status))
        db_conn.commit()
        return jsonify({"message": "Admin registered successfully!"}), 201
    except Exception as e:
        db_conn.rollback()
        return jsonify({"error": f"Failed to register admin: {str(e)}"}), 500

app.register_blueprint(dashboard_bp)
app.register_blueprint(guest_bp)

# ---------------------- RUN THE SERVER ----------------------
if __name__ == "__main__":
    app.run(debug=True, port=5001)
