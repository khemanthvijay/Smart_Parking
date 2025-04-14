from flask import jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
import redis,json
from functools import wraps

# Redis Connection
redis_client = redis.StrictRedis(host="localhost", port=6379, db=0, decode_responses=True)

# Role-Based Access Control (RBAC) Decorator
def role_required(allowed_roles):
    def decorator(func):
        @wraps(func)
        @jwt_required(locations=["cookies"])
        def wrapper(*args, **kwargs):
            current_user = json.loads(get_jwt_identity())

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
