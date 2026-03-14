"""Auth routes: register, login, guest, logout, profile."""
from flask import Blueprint, request, jsonify, session
from flask_login import login_user, logout_user, login_required, current_user
from ..models.user import User

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    username = data.get("username", "").strip()
    password = data.get("password", "")
    display_name = data.get("display_name", "").strip() or username

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400
    if len(username) < 3:
        return jsonify({"error": "Username must be at least 3 characters"}), 400
    if len(password) < 4:
        return jsonify({"error": "Password must be at least 4 characters"}), 400
    if len(display_name) > 20:
        return jsonify({"error": "Display name max 20 characters"}), 400

    user = User.create(username, password, display_name)
    if not user:
        return jsonify({"error": "Username already taken"}), 409

    login_user(user)
    session["player_name"] = user.display_name
    return jsonify({
        "user": {"id": user.id, "username": user.username, "display_name": user.display_name, "is_guest": False}
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    username = data.get("username", "").strip()
    password = data.get("password", "")

    user = User.authenticate(username, password)
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    login_user(user)
    user.update_last_seen()
    session["player_name"] = user.display_name
    return jsonify({
        "user": {"id": user.id, "username": user.username, "display_name": user.display_name, "is_guest": False}
    })


@auth_bp.route("/guest", methods=["POST"])
def guest():
    data = request.get_json(silent=True) or {}
    display_name = data.get("display_name", "").strip()
    if not display_name:
        return jsonify({"error": "Display name required"}), 400
    if len(display_name) > 20:
        return jsonify({"error": "Display name max 20 characters"}), 400

    user = User.create_guest(display_name)
    if not user:
        return jsonify({"error": "Could not create guest"}), 500

    login_user(user)
    session["player_name"] = user.display_name
    return jsonify({
        "user": {"id": user.id, "username": None, "display_name": user.display_name, "is_guest": True}
    }), 201


@auth_bp.route("/logout", methods=["POST"])
def logout():
    logout_user()
    session.clear()
    return jsonify({"status": "logged out"})


@auth_bp.route("/me", methods=["GET"])
def me():
    if current_user.is_authenticated:
        return jsonify({
            "user": {
                "id": current_user.id,
                "username": current_user.username,
                "display_name": current_user.display_name,
                "is_guest": current_user.is_guest,
            }
        })
    return jsonify({"user": None})


@auth_bp.route("/stats", methods=["GET"])
@login_required
def stats():
    return jsonify(current_user.get_stats())


@auth_bp.route("/leaderboard", methods=["GET"])
def leaderboard():
    return jsonify(User.leaderboard())
