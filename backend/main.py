import os
import uuid
import json
from datetime import datetime
from flask import Flask, request, jsonify, send_file, Response, abort
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import bcrypt

from process_video import generate_frames
from simulation.engine import generate_virtual_simulation
from database import get_all_registered_cars, get_vehicle_details, get_user_by_username, seed_default_users, save_violation_log, get_all_violation_logs, get_violation_logs_by_plate

UPLOAD_DIR = "uploads"
HISTORY_DIR = "history"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(HISTORY_DIR, exist_ok=True)

app = Flask(__name__)
CORS(app)
app.config["JWT_SECRET_KEY"] = "final-year-project"
jwt = JWTManager(app)

HISTORY_FILE = os.path.join(HISTORY_DIR, "processing_history.json")
STREAM_STATS = {}   # key → stats dict (virtual_simulation, or uploaded filename)

seed_default_users()

def load_history():
    if not os.path.exists(HISTORY_FILE): return []
    try:
        with open(HISTORY_FILE, 'r') as f:
            content = f.read().strip()
            return json.loads(content) if content else []
    except: return []

def save_history(data):
    try:
        with open(HISTORY_FILE, 'w') as f: json.dump(data, f, indent=2)
    except: pass

# ── Login ────────────────────────────────────────────────────────────────────
@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username", "").strip()
    user = get_user_by_username(username)
    if user and bcrypt.checkpw(data.get("password", "").encode(), user["password"].encode()):
        token = create_access_token(identity=username, additional_claims={"role": user["role"]})
        return jsonify(access_token=token, username=username, role=user["role"])
    return jsonify({"error": "Invalid credentials"}), 401

# ── Stats (admin dashboard) ──────────────────────────────────────────────────
@app.route("/api/stats", methods=["GET"])
@jwt_required()
def stats():
    h = load_history()
    return jsonify({
        "total_videos":     len(h),
        "total_vehicles":   sum(len(x.get("all_logs", [])) for x in h),
        "total_violations": sum(len(x.get("overspeed_summary", [])) for x in h)
    }), 200

# ── Per-stream status (admin processing page polls this) ─────────────────────
@app.route("/api/stream-status/<fname>", methods=["GET"])
def status(fname):
    return jsonify(STREAM_STATS.get(fname, {}))

# ── NEW: All-violations endpoint — DriverAppPage polls this ─────────────────
# Merges violations + warnings from ALL active streams (virtual + real video).
# DriverAppPage filters by its own plate number on the frontend.
@app.route("/api/all-violations", methods=["GET"])
def all_violations():
    merged_violations = []
    merged_warnings   = []
    merged_all_logs   = []

    for key, s in STREAM_STATS.items():
        if not s:
            continue
        # violations (overspeed challan)
        for v in (s.get("violations") or s.get("overspeed_summary") or []):
            if v not in merged_violations:
                merged_violations.append(v)
        # warnings (virtual simulation 600m / 300m)
        for w in (s.get("warnings") or []):
            if w not in merged_warnings:
                merged_warnings.append(w)
        # all_logs
        for l in (s.get("all_logs") or []):
            if l not in merged_all_logs:
                merged_all_logs.append(l)

    return jsonify({
        "violations": merged_violations[-50:],
        "warnings":   merged_warnings[-50:],
        "all_logs":   merged_all_logs[-50:],
    })

# ── Video upload ─────────────────────────────────────────────────────────────
@app.route("/api/prepare-simulation", methods=["POST"])
def prepare_simulation():
    if 'video' not in request.files:
        return jsonify({"error": "No video file provided"}), 400
    video = request.files['video']
    if video.filename == '':
        return jsonify({"error": "Empty filename"}), 400
    ext = os.path.splitext(secure_filename(video.filename))[1]
    filename = f"{uuid.uuid4().hex}{ext}"
    save_path = os.path.join(UPLOAD_DIR, filename)
    video.save(save_path)
    return jsonify({"filename": filename}), 200

# ── Video feed (MJPEG stream) ────────────────────────────────────────────────
@app.route("/video_feed/<fname>")
def feed(fname):
    limit = float(request.args.get('limit', 60))
    dist  = float(request.args.get('dist', 20))
    save  = request.args.get('save', 'false') == 'true'
    user  = request.args.get('user', 'anonymous')
    zone  = request.args.get('zone', 'Processing Zone')

    # ── Virtual simulation ───────────────────────────────────────────────────
    if fname == "virtual_simulation":
        def on_sim(s): STREAM_STATS["virtual_simulation"] = s
        return Response(
            generate_virtual_simulation(
                zone_name=zone,
                speed_limit_kmh=limit,
                record_config={"live_callback": on_sim}
            ),
            mimetype='multipart/x-mixed-replace; boundary=frame'
        )

    # ── Real video processing ────────────────────────────────────────────────
    name = secure_filename(fname)
    path = os.path.join(UPLOAD_DIR, name)
    if not os.path.exists(path): abort(404)

    def on_live(s): STREAM_STATS[name] = s

    cfg = {
        "live_callback": on_live,
        "zone": zone,
    }

    return Response(
        generate_frames(path, overspeed_limit_kmh=limit, distance_meters=dist, record_config=cfg),
        mimetype='multipart/x-mixed-replace; boundary=frame'
    )

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True, threaded=True)