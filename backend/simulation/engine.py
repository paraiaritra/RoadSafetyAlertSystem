import time
import random
import json
import os
import cv2
import numpy as np
from datetime import datetime
from .vehicle import VirtualVehicle

# Dimensions for the global feed
W, H = 1280, 720
PANE_W = W // 3  # 426 pixels per camera feed
SIM_FPS = 30.0

# Physical Speed Calculation Constants
START_LINE_Y = int(H * 0.75)
END_LINE_Y = int(H * 0.25)
DISTANCE_METERS = 17.8  # Calibrated so that calculated speed matches simulated physics perfectly

# Load dataset
_DATASET_PATH = os.path.join(os.path.dirname(__file__), "..", "local_plates.json")

def load_dataset():
    try:
        with open(_DATASET_PATH, "r") as f:
            return json.load(f)
    except Exception as e:
        print(f"[SIM] Warning: Could not load local_plates.json ({e}).")
        return []

def draw_pane_background(frame, pane_idx):
    x_offset = pane_idx * PANE_W
    # Road & Grass
    cv2.rectangle(frame, (x_offset, 0), (x_offset + PANE_W, H), (50, 50, 50), -1)
    cv2.rectangle(frame, (x_offset, 0), (x_offset + 30, H), (34, 139, 34), -1)
    cv2.rectangle(frame, (x_offset + PANE_W - 30, 0), (x_offset + PANE_W, H), (34, 139, 34), -1)

    # Dashed Lines
    for lx in [x_offset + PANE_W // 3, x_offset + 2 * PANE_W // 3]:
        for i in range(0, H, 40):
            cv2.line(frame, (lx, i), (lx, i + 20), (255, 255, 255), 2)

    # Vertical Border between cameras
    cv2.line(frame, (x_offset + PANE_W, 0), (x_offset + PANE_W, H), (0, 0, 0), 4)

    # Physics START Line
    cv2.line(frame, (x_offset, START_LINE_Y), (x_offset + PANE_W, START_LINE_Y), (0, 0, 255), 2)
    cv2.putText(frame, "START", (x_offset + 35, START_LINE_Y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

    # Physics END Line
    cv2.line(frame, (x_offset, END_LINE_Y), (x_offset + PANE_W, END_LINE_Y), (255, 0, 0), 2)
    cv2.putText(frame, "END", (x_offset + 35, END_LINE_Y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)


def generate_virtual_simulation(zone_name="School", speed_limit_kmh=30.0, record_config=None):
    dataset = load_dataset()
    random.shuffle(dataset)

    cam1_vehicles, cam2_vehicles, cam3_vehicles = [], [], []
    transit_1_to_2, transit_2_to_3 = [], []

    pane_lanes_x = [PANE_W * 0.2, PANE_W * 0.5, PANE_W * 0.8]

    all_logs, warnings_log, violations_log = [], [], []
    frame_idx, vehicle_counter, dataset_index = 0, 0, 0

    # ─── FIXED create_log: now includes warning_stage, distance_m, speed_limit ──
    def create_log(v, level, warning_stage=None, distance_m=None):
        log = {
            "id": v.id,
            "plate": v.plate,
            "driver": getattr(v, "driver_name", "Unknown"),
            "driver_contact": getattr(v, "driver_contact", "N/A"),
            "driver_license_number": getattr(v, "driver_license_number", "N/A"),
            "type": v.type.upper(),
            "speed": round(v.detected_speed, 1),
            "speed_limit": speed_limit_kmh,        # ✅ frontend ko limit pata chalegi
            "zone": zone_name,
            "level": level,
            "timestamp": datetime.now().strftime("%H:%M:%S"),
        }
        # Only add these fields for warnings (not for "Detected" or challan)
        if warning_stage is not None:
            log["warning_stage"] = warning_stage   # ✅ 1 = 600m, 2 = 300m, 3 = challan
        if distance_m is not None:
            log["distance_m"] = distance_m         # ✅ exact meters
        return log

    # ─── FIXED process_camera: passes correct stage per camera pane ─────────────
    def process_camera(vehicles, pane_idx, log_list, warning_text, transit_list, now):
        offset = pane_idx * PANE_W
        for v in vehicles[:]:
            v.update()

            # --- REALISTIC PHYSICS SPEED CALCULATION ---
            if v.start_frame is None and v.y <= START_LINE_Y:
                v.start_frame = frame_idx

            if v.start_frame is not None and v.end_frame is None and v.y <= END_LINE_Y:
                v.end_frame = frame_idx
                frames_taken = abs(v.end_frame - v.start_frame)

                if frames_taken > 0:
                    time_sec = frames_taken / SIM_FPS
                    calculated_speed = (DISTANCE_METERS / time_sec) * 3.6
                    v.detected_speed = calculated_speed
                    v.plate_captured = True

                    # LOG EVERY VEHICLE IN ALL LOGS (When it passes Cam 1)
                    if pane_idx == 0:
                        all_logs.insert(0, create_log(v, "Detected"))

                    # HANDLE OVERSPEED WARNINGS & CHALLANS
                    is_overspeeding = v.detected_speed > speed_limit_kmh
                    if is_overspeeding:
                        # ✅ Cam 1 → 1st Warning @ 600m
                        if pane_idx == 0:
                            log_list.insert(0, create_log(
                                v, warning_text,
                                warning_stage=1,
                                distance_m=600
                            ))
                        # ✅ Cam 2 → Final Warning @ 300m
                        elif pane_idx == 1:
                            log_list.insert(0, create_log(
                                v, warning_text,
                                warning_stage=2,
                                distance_m=300
                            ))
                        # ✅ Cam 3 → Challan @ 0m
                        elif pane_idx == 2:
                            log_list.insert(0, create_log(
                                v, warning_text,
                                warning_stage=3,
                                distance_m=0
                            ))

                        v.apply_brakes(speed_limit_kmh)

            is_overspeeding_visual = v.detected_speed > speed_limit_kmh if v.plate_captured else False

            # Draw Vehicle
            v.x += offset
            v.draw(frame, frame_idx, is_overspeeding_visual)
            v.x -= offset

            # Move to next camera buffer when off screen
            if not v.active:
                vehicles.remove(v)
                v.active, v.plate_captured, v.y = True, False, H + 100
                v.start_frame, v.end_frame, v.detected_speed = None, None, 0.0
                if transit_list is not None:
                    transit_list.append({"v": v, "arrive_time": now + random.uniform(1.5, 3.0)})

    try:
        while True:
            frame_idx += 1
            now = time.time()
            frame = np.zeros((H, W, 3), dtype=np.uint8)

            draw_pane_background(frame, 0)
            draw_pane_background(frame, 1)
            draw_pane_background(frame, 2)

            # Spawn from Dataset into CAM 1
            if frame_idx % 90 == 0 and dataset_index < len(dataset):
                plate_data = dataset[dataset_index]
                dataset_index += 1
                lane_idx = random.randint(0, 2)

                if random.random() < 0.6:
                    speed = speed_limit_kmh + random.uniform(10, 40)
                else:
                    speed = speed_limit_kmh - random.uniform(5, 10)

                driver_type = "cautious" if random.random() < 0.5 else "ignorant"

                if not any(v.lane == lane_idx and v.y > H - 150 for v in cam1_vehicles):
                    vehicle_counter += 1
                    v = VirtualVehicle(
                        vid=vehicle_counter, lane_idx=lane_idx, lane_x=pane_lanes_x[lane_idx],
                        plate_data=plate_data, speed_kmh=speed, driver_type=driver_type
                    )
                    cam1_vehicles.append(v)

            # ── Update All 3 Cameras ──────────────────────────────────────────────
            # Cam 1: 1st Warning @ 600m
            process_camera(cam1_vehicles, 0, warnings_log, "1st Warning (600m)", transit_1_to_2, now)

            for t in transit_1_to_2[:]:
                if now >= t["arrive_time"]:
                    cam2_vehicles.append(t["v"])
                    transit_1_to_2.remove(t)

            # Cam 2: Final Warning @ 300m
            process_camera(cam2_vehicles, 1, warnings_log, "FINAL Warning (300m)", transit_2_to_3, now)

            for t in transit_2_to_3[:]:
                if now >= t["arrive_time"]:
                    cam3_vehicles.append(t["v"])
                    transit_2_to_3.remove(t)

            # Cam 3: Challan @ 0m
            process_camera(cam3_vehicles, 2, violations_log, "CHALLAN ISSUED (0m)", None, now)

            # Keep lists from getting too long in memory
            all_logs[:] = all_logs[:50]
            warnings_log[:] = warnings_log[:50]
            violations_log[:] = violations_log[:50]

            # SEND ALL 3 LOGS TO FRONTEND
            if record_config and record_config.get("live_callback"):
                record_config["live_callback"]({
                    "all_logs": all_logs,
                    "warnings": warnings_log,
                    "violations": violations_log
                })

            (flag, encodedImage) = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
            if not flag:
                continue
            yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + bytearray(encodedImage) + b'\r\n')
            time.sleep(1.0 / SIM_FPS)

            # Loop dataset
            if dataset_index >= len(dataset) and not (
                cam1_vehicles or cam2_vehicles or cam3_vehicles or transit_1_to_2 or transit_2_to_3
            ):
                dataset_index = 0
                random.shuffle(dataset)

    except Exception as e:
        print(f"Sim Error: {e}")