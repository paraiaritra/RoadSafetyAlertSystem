import os
import cv2
import math
import json
import re
from collections import defaultdict
from datetime import datetime
from ultralytics import YOLO

# ──────────────────────────────────────────────
# 1.  YOLO MODEL
# ──────────────────────────────────────────────
def load_yolo_model():
    try:
        import torch
        return YOLO("yolov8n.pt")
    except Exception as e:
        print(f"YOLO load fallback: {e}")
        import torch
        orig = torch.load
        def patched(*a, **kw):
            kw["weights_only"] = False
            return orig(*a, **kw)
        torch.load = patched
        m = YOLO("yolov8n.pt")
        torch.load = orig
        return m

model = load_yolo_model()

# ──────────────────────────────────────────────
# 2.  EASY-OCR  (lazy-loaded once)
# ──────────────────────────────────────────────
_ocr_reader = None

def get_ocr_reader():
    global _ocr_reader
    if _ocr_reader is None:
        try:
            import easyocr
            _ocr_reader = easyocr.Reader(['en'], gpu=False, verbose=False)
            print("[OCR] EasyOCR reader loaded.")
        except Exception as e:
            print(f"[OCR] EasyOCR load failed: {e}")
            _ocr_reader = None
    return _ocr_reader

# ──────────────────────────────────────────────
# 3.  LOCAL PLATES DATABASE
# ──────────────────────────────────────────────
_DB_PATH = os.path.join(os.path.dirname(__file__), "..", "local_plates.json")

def load_plate_db():
    try:
        with open(_DB_PATH, "r") as f:
            records = json.load(f)
        db = {}
        for r in records:
            key = re.sub(r'\s+', '', r.get("car_number", "")).upper()
            db[key] = r
        print(f"[DB] Loaded {len(db)} plate records.")
        return db
    except Exception as e:
        print(f"[DB] Warning: Could not load local_plates.json ({e})")
        return {}

PLATE_DB = load_plate_db()

def lookup_plate(raw_text: str):
    """Normalize OCR text and match against local DB."""
    if not raw_text:
        return None
    key = re.sub(r'[^A-Z0-9]', '', raw_text.upper())
    if key in PLATE_DB:
        return PLATE_DB[key]
    for db_key, record in PLATE_DB.items():
        if abs(len(key) - len(db_key)) <= 2:
            dist = _edit_distance(key, db_key)
            if dist <= 2:
                return record
    return None

def _edit_distance(a, b):
    """Simple Levenshtein distance."""
    m, n = len(a), len(b)
    dp = list(range(n + 1))
    for i in range(1, m + 1):
        prev = dp[:]
        dp[0] = i
        for j in range(1, n + 1):
            dp[j] = prev[j - 1] if a[i-1] == b[j-1] else 1 + min(prev[j], dp[j-1], prev[j-1])
    return dp[n]

# ──────────────────────────────────────────────
# 4.  OCR HELPERS
# ──────────────────────────────────────────────
_PLATE_RE = re.compile(
    r'[A-Z]{2}[\s\-]?\d{1,2}[\s\-]?[A-Z]{1,3}[\s\-]?\d{4}',
    re.IGNORECASE
)

def run_ocr_on_crop(crop_bgr):
    reader = get_ocr_reader()
    if reader is None or crop_bgr is None or crop_bgr.size == 0:
        return None
    try:
        h, w = crop_bgr.shape[:2]
        scale = max(1, 200 // max(h, 1))
        resized = cv2.resize(crop_bgr, (w * scale, h * scale), interpolation=cv2.INTER_CUBIC)
        gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        results = reader.readtext(thresh, detail=1, paragraph=False)
        candidates = []
        for (_, text, conf) in results:
            clean = re.sub(r'\s+', '', text).upper()
            if _PLATE_RE.match(clean):
                candidates.append((conf, clean))

        if candidates:
            candidates.sort(reverse=True)
            return candidates[0][1]

        if results:
            best = max(results, key=lambda x: x[2])
            token = re.sub(r'[^A-Z0-9]', '', best[1].upper())
            if len(token) >= 6:
                return token
    except Exception as e:
        print(f"[OCR] Error: {e}")
    return None

# ──────────────────────────────────────────────
# 5.  PLATE REGION DETECTOR
# ──────────────────────────────────────────────
_plate_model = None

def _try_load_plate_model():
    global _plate_model
    if _plate_model is not None:
        return _plate_model
    candidates = ["license_plate_detector.pt", "plate.pt", "lp.pt"]
    for c in candidates:
        if os.path.exists(c):
            try:
                _plate_model = YOLO(c)
                print(f"[PLATE] Loaded plate model: {c}")
                return _plate_model
            except Exception:
                pass
    return None

def extract_plate_crop(frame_bgr, x1, y1, x2, y2):
    pm = _try_load_plate_model()
    veh_crop = frame_bgr[max(0,y1):y2, max(0,x1):x2]

    if pm is not None:
        try:
            res = pm.predict(veh_crop, verbose=False, conf=0.25)
            if res and res[0].boxes and len(res[0].boxes.xyxy) > 0:
                px1, py1, px2, py2 = map(int, res[0].boxes.xyxy[0])
                plate_crop = veh_crop[py1:py2, px1:px2]
                if plate_crop.size > 0:
                    return plate_crop
        except Exception:
            pass

    bh = y2 - y1
    bw = x2 - x1
    ph1 = int(bh * 0.65)
    ph2 = int(bh * 0.95)
    pw1 = int(bw * 0.15)
    pw2 = int(bw * 0.85)
    crop = veh_crop[ph1:ph2, pw1:pw2]
    return crop if crop.size > 0 else None

# ──────────────────────────────────────────────
# 6.  SPEED TRACKER  (smoothed)
# ──────────────────────────────────────────────
class SpeedTracker:
    def __init__(self, fps, scale_factor=0.05):
        self.fps = fps
        self.scale_factor = scale_factor
        self.prev_pos  = {}
        self.prev_time = {}
        self.speed_history = defaultdict(list)

    def update(self, obj_id, x, y, frame_idx):
        current_time = frame_idx / self.fps
        speed_kmh = 0
        if obj_id in self.prev_pos:
            px, py = self.prev_pos[obj_id]
            dist_px = math.sqrt((x - px)**2 + (y - py)**2)
            dt = current_time - self.prev_time[obj_id]
            if dt > 0:
                speed_kmh = (dist_px * self.scale_factor / dt) * 3.6
        self.prev_pos[obj_id]  = (x, y)
        self.prev_time[obj_id] = current_time
        self.speed_history[obj_id].append(speed_kmh)
        if len(self.speed_history[obj_id]) > 5:
            self.speed_history[obj_id].pop(0)
        return sum(self.speed_history[obj_id]) / len(self.speed_history[obj_id])

# ──────────────────────────────────────────────
# 7.  MAIN FRAME GENERATOR
# ──────────────────────────────────────────────
TARGET_CLASSES = [2, 3, 5, 7]   # car, motorcycle, bus, truck

def generate_frames(video_path, overspeed_limit_kmh=60, distance_meters=20, record_config=None):
    if not video_path or not os.path.isfile(video_path):
        print(f"[TRACKER] Video not found: {video_path}")
        return

    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    cap.release()

    W, H = 1280, 720
    START_LINE_Y = int(H * 0.74)
    END_LINE_Y   = int(H * 0.26)

    tracker   = SpeedTracker(fps)
    obj_state = {}
    all_logs         = []
    overspeed_summary = []
    violations_log   = []

    out = None
    if record_config and record_config.get("output_path"):
        os.makedirs(os.path.dirname(record_config["output_path"]), exist_ok=True)
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        out = cv2.VideoWriter(record_config["output_path"], fourcc, fps, (W, H))

    def _push_stats():
        count = len(all_logs)
        avg   = sum(l["speed"] for l in all_logs) / count if count else 0
        mx    = max((l["speed"] for l in all_logs), default=0)
        if record_config and record_config.get("live_callback"):
            record_config["live_callback"]({
                "total_vehicles":    count,
                "total_violations":  len(violations_log),   # ← FIXED: was overspeed_summary
                "avg_speed":         round(avg, 1),
                "max_speed":         round(mx, 1),
                "all_logs":          all_logs[-50:],
                "overspeed_summary": overspeed_summary[-50:],
                "violations":        violations_log[-20:],
                "warnings":          [],
            })

    cap2 = cv2.VideoCapture(video_path)
    frame_idx = 0

    try:
        while True:
            ret, frame = cap2.read()
            if not ret:
                break

            frame_idx += 1
            frame = cv2.resize(frame, (W, H))
            annotated = frame.copy()

            # ── Draw trap lines ──────────────────────────────────────────────
            cv2.line(annotated, (0, START_LINE_Y), (W, START_LINE_Y), (0, 0, 255), 2)
            cv2.putText(annotated, "START LINE", (10, START_LINE_Y - 8),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 0, 255), 2)
            cv2.line(annotated, (0, END_LINE_Y), (W, END_LINE_Y), (255, 50, 50), 2)
            cv2.putText(annotated, "END LINE", (10, END_LINE_Y - 8),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 50, 50), 2)

            # ── YOLO tracking ───────────────────────────────────────────────
            results = model.track(
                frame, persist=True, verbose=False,
                tracker="bytetrack.yaml", conf=0.3, iou=0.5,
                classes=TARGET_CLASSES,
            )

            if results and results[0].boxes.id is not None:
                ids     = results[0].boxes.id.int().cpu().tolist()
                boxes   = results[0].boxes.xyxy.cpu().tolist()
                cls_ids = results[0].boxes.cls.int().cpu().tolist()

                for box, cls_id, obj_id in zip(boxes, cls_ids, ids):
                    label = results[0].names[int(cls_id)]
                    x1, y1, x2, y2 = map(int, box)
                    bx, by = (x1 + x2) // 2, y2

                    st = obj_state.setdefault(obj_id, {
                        "start_frame": None, "start_y": None,
                        "end_frame":   None, "end_y":   None,
                        "speed":       0.0,
                        "plate_text":  None,
                        "db_record":   None,
                        "logged":      False,
                        "ocr_attempts": 0,
                    })

                    # ── Crossing START line ──────────────────────────────────
                    if st["start_frame"] is None and by <= START_LINE_Y:
                        st["start_frame"] = frame_idx
                        st["start_y"]     = by

                    # ── Crossing END line → calculate speed ──────────────────
                    if (st["start_frame"] is not None
                            and st["end_frame"] is None
                            and by <= END_LINE_Y):
                        st["end_frame"] = frame_idx
                        st["end_y"]     = by
                        frames_taken = st["end_frame"] - st["start_frame"]
                        if frames_taken > 0:
                            pixel_span = abs(START_LINE_Y - END_LINE_Y) or 1
                            mpp = distance_meters / pixel_span
                            measured_m = abs((st["start_y"] or START_LINE_Y) - END_LINE_Y) * mpp
                            t_sec = frames_taken / fps
                            st["speed"] = round((measured_m / t_sec) * 3.6, 1) if t_sec > 0 else 0.0

                    # ── OCR: try up to 3 times ───────────────────────────────
                    if st["plate_text"] is None and st["ocr_attempts"] < 3:
                        if by <= START_LINE_Y:
                            plate_crop = extract_plate_crop(frame, x1, y1, x2, y2)
                            ocr_text = run_ocr_on_crop(plate_crop)
                            st["ocr_attempts"] += 1
                            if ocr_text:
                                st["plate_text"] = ocr_text
                                st["db_record"]  = lookup_plate(ocr_text)
                                print(f"[OCR] ID={obj_id}  plate={ocr_text}  "
                                      f"db={'FOUND' if st['db_record'] else 'NOT FOUND'}")

                    # ── Log once speed is known ──────────────────────────────
                    if st["end_frame"] is not None and not st["logged"]:
                        st["logged"] = True
                        speed      = st["speed"]
                        plate_text = st["plate_text"] or "UNKNOWN"
                        db_rec     = st["db_record"] or {}
                        is_over    = speed > overspeed_limit_kmh

                        # ── Zone + level strings ─────────────────────────────
                        _zone   = record_config.get("zone", "Processing Zone") if record_config else "Processing Zone"
                        _excess = round(speed - overspeed_limit_kmh, 1)
                        _level  = f"OVERSPEED +{_excess} km/h" if is_over else "Detected"

                        # ── Build log entry (all fields frontend needs) ───────
                        log_entry = {
                            # Core fields
                            "id":           obj_id,
                            "label":        label,
                            "speed":        speed,
                            "speed_limit":  overspeed_limit_kmh,
                            "plate":        plate_text,
                            "overspeed":    is_over,
                            "timestamp":    datetime.now().strftime("%H:%M:%S"),
                            "frame":        frame_idx,
                            # Driver fields
                            "driver_name":           db_rec.get("driver_name",           "Unknown"),
                            "driver":                db_rec.get("driver_name",           "Unknown"),  # LiveMonitorPage uses log.driver
                            "driver_contact":        db_rec.get("driver_contact",        "N/A"),
                            "driver_license_number": db_rec.get("driver_license_number", "N/A"),
                            # Owner / vehicle fields
                            "owner_name":    db_rec.get("owner_name", "Unknown"),
                            "vehicle_make":  db_rec.get("make",       "—"),
                            "vehicle_model": db_rec.get("model",      "—"),
                            "vehicle_color": db_rec.get("color",      "—"),
                            # Frontend table fields (were missing — root cause of blank logs)
                            "type":  label,
                            "zone":  _zone,
                            "level": _level,
                        }

                        if not any(l["id"] == obj_id for l in all_logs):
                            all_logs.append(log_entry)
                            if is_over:
                                overspeed_summary.append(log_entry)
                                # ── violations_log — mirrors virtual simulation format ──
                                violations_log.append({
                                    "plate":          plate_text,
                                    "speed":          speed,
                                    "speed_limit":    overspeed_limit_kmh,
                                    "zone":           _zone,
                                    # Both keys so both pages work
                                    "driver_name":    db_rec.get("driver_name", "Unknown"),  # ProcessingPage speech uses v.driver_name
                                    "driver":         db_rec.get("driver_name", "Unknown"),  # LiveMonitorPage uses log.driver
                                    "driver_contact": db_rec.get("driver_contact", "N/A"),
                                    "vehicle_make":   db_rec.get("make",  "—"),
                                    "vehicle_model":  db_rec.get("model", "—"),
                                    "vehicle_color":  db_rec.get("color", "—"),
                                    "timestamp":      datetime.now().strftime("%H:%M:%S"),
                                })

                    # ── Draw bounding box + overlay ──────────────────────────
                    speed_now   = st["speed"] if st["speed"] > 0 else 0
                    is_over_vis = speed_now > overspeed_limit_kmh
                    color       = (0, 0, 255) if is_over_vis else (0, 255, 80)
                    cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)

                    spd_label = f"{int(speed_now)} km/h" if speed_now > 0 else label
                    cv2.rectangle(annotated, (x1, y1 - 22), (x1 + 130, y1), color, -1)
                    cv2.putText(annotated, spd_label, (x1 + 4, y1 - 5),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 0), 2)

                    if st["plate_text"]:
                        plate_label = st["plate_text"]
                        (tw, th), _ = cv2.getTextSize(plate_label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
                        px1_box = x1
                        py1_box = y2
                        cv2.rectangle(annotated, (px1_box, py1_box), (px1_box + tw + 8, py1_box + 20), (30, 30, 30), -1)
                        cv2.putText(annotated, plate_label, (px1_box + 4, py1_box + 14),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)

                    if is_over_vis:
                        cv2.rectangle(annotated, (x1, y2 + 22), (x1 + 130, y2 + 42), (0, 0, 200), -1)
                        cv2.putText(annotated, "OVERSPEED!", (x1 + 4, y2 + 36),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

            # ── Push stats every frame ───────────────────────────────────────
            _push_stats()

            if out:
                out.write(annotated)

            flag, enc = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 82])
            if flag:
                yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n"
                       + bytearray(enc) + b"\r\n")

    except Exception as e:
        print(f"[TRACKER] Error: {e}")
    finally:
        cap2.release()
        if out:
            out.release()
        if record_config and record_config.get("data_callback"):
            record_config["data_callback"]({
                "all_logs":          all_logs,
                "overspeed_summary": overspeed_summary,
            })