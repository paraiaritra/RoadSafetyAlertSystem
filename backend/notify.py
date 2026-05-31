import os
import time
import json
from typing import Optional
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

LOCAL_SMS_LOGS_PATH = os.path.join(os.path.dirname(__file__), "local_sms_logs.json")

def _normalize_phone(phone: Optional[str]) -> Optional[str]:
    if not phone:
        return phone
    p = str(phone).strip()
    for ch in [' ', '-', '(', ')']:
        p = p.replace(ch, '')
    if p.startswith('+'):
        return p
    if p.startswith('0') and len(p) == 11:
        p = p[1:]
    if p.isdigit() and len(p) == 10:
        prefix = os.getenv('TARGET_PHONE_PREFIX', '+91')
        return prefix + p
    if p.isdigit() and len(p) >= 11 and p.startswith('91'):
        return '+' + p
    return p


def send_twilio_sms(to_number: str, body: str) -> bool:
    """Send SMS via Twilio or Fallback gracefully to offline Mock logging."""
    TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
    TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
    TWILIO_FROM_NUMBER = os.getenv('TWILIO_FROM_NUMBER')
    
    to_norm = _normalize_phone(to_number) or to_number

    if not (TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_FROM_NUMBER):
        # MOCK Visual Box
        print("┌──────────────────────────────────────────────────────────┐")
        print(f"│ 📱 [MOCK SMS SENT TO: {to_norm:<20}]             │")
        print("├──────────────────────────────────────────────────────────┤")
        print(f"│ Msg: {body[:50]:<51} │")
        if len(body) > 50:
            print(f"│      {body[50:100]:<51} │")
        print("└──────────────────────────────────────────────────────────┘")

        try:
            logs = []
            if os.path.exists(LOCAL_SMS_LOGS_PATH):
                with open(LOCAL_SMS_LOGS_PATH, 'r') as f:
                    logs = json.load(f)
            
            logs.append({
                "to_number": to_norm,
                "body": body,
                "timestamp": datetime.now().isoformat(),
                "status": "MOCK_SENT"
            })
            
            with open(LOCAL_SMS_LOGS_PATH, 'w') as f:
                json.dump(logs, f, indent=2)
        except Exception as e:
            print(f"❌ [NOTIFY-MOCK] Failed to log offline SMS: {e}")

        return True

    try:
        from twilio.rest import Client
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        attempts = 2
        for i in range(attempts):
            try:
                # CRITICAL BULLETPROOF FIX:
                # If from number starts with 'MG', treat it as a Messaging Service SID instead of standard sender
                if TWILIO_FROM_NUMBER.startswith('MG'):
                    msg = client.messages.create(
                        messaging_service_sid=TWILIO_FROM_NUMBER, 
                        to=to_norm, 
                        body=body
                    )
                else:
                    msg = client.messages.create(
                        from_=TWILIO_FROM_NUMBER, 
                        to=to_norm, 
                        body=body
                    )
                print(f"[NOTIFY] Twilio SMS sent SID={msg.sid} to={to_norm}")
                return True
            except Exception as e:
                print(f"[NOTIFY] send_twilio_sms attempt {i+1} failed: {e}")
                time.sleep(1 + i)
        return False
    except Exception as e:
        print(f"[NOTIFY] send_twilio_sms failed: {e}")
        return False


def send_sms(to_number: Optional[str], body: str) -> bool:
    """Send SMS using Twilio or Mock Fallback."""
    if not to_number:
        print('[NOTIFY] No target phone provided for SMS')
        return False
    return send_twilio_sms(to_number, body)