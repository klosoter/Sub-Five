"""Flask app factory with SocketIO initialization."""
import os
from flask import Flask, send_from_directory
from flask_cors import CORS

from .config import get_config
from .extensions import socketio, login_manager, init_redis


def create_app(config=None):
    app = Flask(__name__, static_folder=None)
    app.config.from_object(config or get_config())

    # Extensions
    CORS(app, supports_credentials=True)
    init_redis(app)
    login_manager.init_app(app)
    login_manager.login_view = None  # API-based, no redirect
    socketio.init_app(app, cors_allowed_origins="*", async_mode="eventlet")

    # Database
    from .models.database import init_db, close_db
    init_db(app)
    app.teardown_appcontext(close_db)

    # User loader for Flask-Login
    from .models.user import User

    @login_manager.user_loader
    def load_user(user_id):
        return User.get_by_id(user_id)

    # Register blueprints
    from .api.lobby import lobby_bp
    from .auth.routes import auth_bp
    app.register_blueprint(lobby_bp)
    app.register_blueprint(auth_bp)

    # Import socket event handlers (registers them with socketio)
    from .api import game_events  # noqa: F401

    # Dev mode routes
    if app.config.get("DEV_MODE"):
        from .dev.routes import dev_bp
        app.register_blueprint(dev_bp)

    # Serve frontend (Vite build output)
    frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path):
        full_path = os.path.join(frontend_dist, path)
        if path and os.path.isfile(full_path):
            return send_from_directory(frontend_dist, path)
        return send_from_directory(frontend_dist, "index.html")

    @app.before_request
    def setup_session():
        from flask import session
        session.permanent = True

    return app
