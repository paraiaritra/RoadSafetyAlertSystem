"""
database.py  —  100% Local SQLite backend (no Supabase dependency)
All data is stored in  backend/local_db.sqlite3
"""
import os
import json
import sqlite3
import bcrypt
from datetime import datetime

DB_PATH             = os.path.join(os.path.dirname(__file__), "local_db.sqlite3")
LOCAL_PLATES_PATH   = os.path.join(os.path.dirname(__file__), "local_plates.json")
LOCAL_VIOLATIONS_PATH = os.path.join(os.path.dirname(__file__), "local_violations.json")


# ── helpers ────────────────────────────────────────────────────────────────────

def _conn():
    con = sqlite3.connect(DB_PATH, check_same_thread=False)
    con.row_factory = sqlite3.Row
    return con


def _init_db():
    """Create tables if they don't exist yet."""
    with _conn() as con:
        con.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                username  TEXT PRIMARY KEY,
                password  TEXT NOT NULL,
                role      TEXT NOT NULL DEFAULT 'user'
            );

            CREATE TABLE IF NOT EXISTS violation_logs (
                id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                plate               TEXT,
                vehicle_type        TEXT,
                speed               REAL,
                driver_name         TEXT,
                driver_contact      TEXT,
                owner_name          TEXT,
                owner_contact       TEXT,
                violation_timestamp TEXT
            );
        """)
    print("✅ [DB] SQLite database initialised at", DB_PATH)


_init_db()


# ── users ──────────────────────────────────────────────────────────────────────

def get_user_by_username(username: str):
    with _conn() as con:
        row = con.execute(
            "SELECT * FROM users WHERE username = ?", (username,)
        ).fetchone()
    return dict(row) if row else None


def create_user(username: str, password_hash: str, role: str = "user") -> bool:
    try:
        with _conn() as con:
            con.execute(
                "INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)",
                (username, password_hash, role),
            )
        print(f"✅ [DB] User created: {username} (role={role})")
        return True
    except Exception as e:
        print(f"❌ [DB] create_user failed: {e}")
        return False


def seed_default_users():
    defaults = [("admin", "admin123", "admin"), ("user", "user123", "user")]
    for username, password, role in defaults:
        if get_user_by_username(username) is None:
            pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
            if create_user(username, pw_hash, role):
                print(f"✅ [DB] Seeded default user: {username} / {password}")


# ── cars (local JSON fallback) ─────────────────────────────────────────────────

def get_all_registered_cars():
    try:
        if os.path.exists(LOCAL_PLATES_PATH):
            with open(LOCAL_PLATES_PATH) as f:
                data = json.load(f)
            if isinstance(data, list):
                print(f"✅ [DB] Loaded {len(data)} cars from local_plates.json")
                return data
    except Exception as e:
        print(f"❌ [DB] get_all_registered_cars failed: {e}")
    return []


def get_vehicle_details(plate: str):
    plate = (plate or "").strip().upper()
    try:
        if os.path.exists(LOCAL_PLATES_PATH):
            with open(LOCAL_PLATES_PATH) as f:
                data = json.load(f)
            for car in data:
                if car.get("car_number", "").strip().upper() == plate:
                    return car
    except Exception as e:
        print(f"❌ [DB] get_vehicle_details failed: {e}")
    return None


def get_all_car_numbers():
    cars = get_all_registered_cars()
    return [c["car_number"] for c in cars if "car_number" in c]


# ── violations ─────────────────────────────────────────────────────────────────

def save_violation_log(plate, vehicle_type, speed,
                       driver_name=None, driver_contact=None,
                       owner_name=None, owner_contact=None) -> bool:
    try:
        ts = datetime.utcnow().isoformat()
        with _conn() as con:
            con.execute("""
                INSERT INTO violation_logs
                    (plate, vehicle_type, speed, driver_name, driver_contact,
                     owner_name, owner_contact, violation_timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (plate, vehicle_type, float(speed),
                  driver_name, driver_contact,
                  owner_name, owner_contact, ts))
        print(f"✅ [DB] Violation saved: {plate} @ {speed} km/h")
        return True
    except Exception as e:
        print(f"❌ [DB] save_violation_log failed: {e}")
        return False


def get_all_violation_logs():
    try:
        with _conn() as con:
            rows = con.execute(
                "SELECT * FROM violation_logs ORDER BY violation_timestamp DESC"
            ).fetchall()
        return [dict(r) for r in rows]
    except Exception as e:
        print(f"❌ [DB] get_all_violation_logs failed: {e}")
        return []


def get_violation_logs_by_plate(plate: str):
    try:
        with _conn() as con:
            rows = con.execute(
                "SELECT * FROM violation_logs WHERE plate = ? ORDER BY violation_timestamp DESC",
                (plate,),
            ).fetchall()
        return [dict(r) for r in rows]
    except Exception as e:
        print(f"❌ [DB] get_violation_logs_by_plate failed: {e}")
        return []