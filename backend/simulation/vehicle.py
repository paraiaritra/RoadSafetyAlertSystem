import random
import cv2
import numpy as np

VEHICLE_COLORS = {
    "car": [(0, 255, 255), (200, 200, 200), (50, 50, 255)],
    "truck": [(255, 100, 0), (100, 100, 255)],
    "bus": [(0, 165, 255), (255, 255, 0)]
}

class VirtualVehicle:
    def __init__(self, vid, lane_idx, lane_x, plate_data, speed_kmh, driver_type):
        self.id        = vid
        self.lane      = lane_idx
        self.x         = float(lane_x)
        self.target_x  = float(lane_x)
        self.y         = float(720 + random.randint(20, 100)) # Spawn at bottom
        
        # --- EXTRACTING COMPLETE DATA FROM JSON ---
        self.plate         = plate_data.get("car_number", "UNKNOWN")
        self.type          = plate_data.get("vehicle_type", "car").lower()
        self.driver_name   = plate_data.get("driver_name", "Unknown")
        self.driver_contact = plate_data.get("driver_contact", "N/A")
        self.driver_license_number = plate_data.get("driver_license_number", "N/A")
        
        self.driver_type   = driver_type
        
        # Base Speed
        self.speed_kmh = float(speed_kmh)
        self.base_speed = self.speed_kmh * 0.15 
        self.current_speed = self.base_speed

        if self.type == "car":
            self.w, self.h  = 50, 100
            self.base_color = random.choice(VEHICLE_COLORS["car"])
        elif self.type == "truck":
            self.w, self.h  = 70, 160
            self.base_color = random.choice(VEHICLE_COLORS["truck"])
        else:
            self.type       = "bus"
            self.w, self.h  = 60, 150
            self.base_color = random.choice(VEHICLE_COLORS["bus"])

        # Physical Tracking States
        self.active         = True
        self.start_frame    = None
        self.end_frame      = None
        self.detected_speed = 0.0
        self.plate_captured = False

    def change_lane(self, new_lane_idx, new_lane_x):
        self.lane     = new_lane_idx
        self.target_x = float(new_lane_x)

    def apply_brakes(self, speed_limit):
        if self.driver_type == "cautious" and self.speed_kmh > speed_limit:
            self.speed_kmh = speed_limit - random.uniform(2, 5)
            self.current_speed = self.speed_kmh * 0.15
            self.base_color = (0, 255, 0)

    def update(self):
        self.y -= self.current_speed
        if abs(self.x - self.target_x) > 1:
            self.x += 3 if self.target_x > self.x else -3
        if self.y < -200:
            self.active = False

    def draw(self, frame, current_frame, is_overspeeding=False):
        cx, ty = int(self.x), int(self.y)
        hw, h  = self.w // 2, self.h
        bc = self.base_color
        dark  = tuple(max(0, c - 65) for c in bc)
        light = tuple(min(255, c + 80) for c in bc)
        mid   = tuple(max(0, c - 28) for c in bc)

        if self.type == "car": self._draw_car(frame, cx, ty, hw, h, bc, dark, light, mid)
        elif self.type == "truck": self._draw_truck(frame, cx, ty, hw, h, bc, dark, light, mid)
        else: self._draw_bus(frame, cx, ty, hw, h, bc, dark, light, mid)

        if is_overspeeding:
            flash = (current_frame // 8) % 2 == 0
            bdr = (0, 0, 255) if flash else (60, 60, 255)
            cv2.rectangle(frame, (cx - hw - 3, ty - 3), (cx + hw + 3, ty + h + 3), bdr, 3)

        self._draw_plate(frame, cx, ty + h - 35)

        # Draw Tracking Label or Calculated Speed
        if self.detected_speed > 0:
            lc = (0, 0, 255) if is_overspeeding else (0, 230, 0)
            lbl = f"{int(self.detected_speed)} km/h"
        elif self.start_frame is not None and self.end_frame is None:
            lc = (0, 255, 180) # Teal color for tracking
            lbl = "TRACKING..."
        else:
            lc = (200, 200, 200)
            lbl = "ENTER TRAP"

        cv2.putText(frame, lbl, (cx - hw, ty - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, lc, 2)

    def _draw_car(self, frame, cx, ty, hw, h, bc, dark, light, mid):
        rm, rt, rb = max(hw // 3, 8), ty + h // 5, ty + 4 * h // 5
        cv2.fillPoly(frame, [np.array([[cx-hw+6, ty+6], [cx+hw+6, ty+6], [cx+hw+6, ty+h+6], [cx-hw+6, ty+h+6]], np.int32)], (18, 18, 18))
        cv2.rectangle(frame, (cx-hw, ty), (cx+hw, ty+h), bc, -1)
        cv2.fillPoly(frame, [np.array([[cx-hw+5, ty], [cx+hw-5, ty], [cx+hw, ty+9], [cx-hw, ty+9]], np.int32)], light)
        cv2.fillPoly(frame, [np.array([[cx-hw, ty+h-9], [cx+hw, ty+h-9], [cx+hw-5, ty+h], [cx-hw+5, ty+h]], np.int32)], dark)
        cv2.rectangle(frame, (cx-hw+rm, rt), (cx+hw-rm, rb), dark, -1)

    def _draw_truck(self, frame, cx, ty, hw, h, bc, dark, light, mid):
        cargo_end = ty + h - (h // 3)
        cv2.fillPoly(frame, [np.array([[cx-hw+6,ty+6],[cx+hw+6,ty+6],[cx+hw+6,ty+h+6],[cx-hw+6,ty+h+6]], np.int32)], (18, 18, 18))
        cv2.rectangle(frame, (cx-hw+5, ty), (cx+hw-5, cargo_end), mid, -1)
        cv2.rectangle(frame, (cx-hw, cargo_end), (cx+hw, ty+h), bc, -1)

    def _draw_bus(self, frame, cx, ty, hw, h, bc, dark, light, mid):
        cv2.fillPoly(frame, [np.array([[cx-hw+6,ty+6],[cx+hw+6,ty+6],[cx+hw+6,ty+h+6],[cx-hw+6,ty+h+6]], np.int32)], (18, 18, 18))
        cv2.fillPoly(frame, [np.array([[cx-hw+5,ty],[cx+hw-5,ty],[cx+hw,ty+6],[cx+hw,ty+h-6],[cx+hw-5,ty+h],[cx-hw+5,ty+h],[cx-hw,ty+h-6],[cx-hw,ty+6]], np.int32)], bc)

    def _draw_plate(self, frame, cx, py):
        pw, ph = 80, 24
        cv2.rectangle(frame, (cx-pw//2, py), (cx+pw//2, py+ph), (255,255,255), -1)
        cv2.rectangle(frame, (cx-pw//2, py), (cx+pw//2, py+6), (170, 0, 0), -1)
        parts = self.plate.split()
        if len(parts) == 4:
            cv2.putText(frame, f"{parts[0]} {parts[1]}", (cx-pw//2+2, py+14), cv2.FONT_HERSHEY_SIMPLEX, 0.3, (0,0,0), 1)
            cv2.putText(frame, f"{parts[2]} {parts[3]}", (cx-pw//2+2, py+22), cv2.FONT_HERSHEY_SIMPLEX, 0.3, (0,0,0), 1)
        else:
            cv2.putText(frame, self.plate, (cx-pw//2+2, py+16), cv2.FONT_HERSHEY_SIMPLEX, 0.3, (0,0,0), 1)