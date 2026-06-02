import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, CheckCircle, Car, Power, Wifi, MapPin, Gauge, User, CreditCard, Calendar, Shield, AlertTriangle, Activity, Phone, Mail } from 'lucide-react';

// ── Poll BOTH virtual_simulation AND all real-video streams ──────────────────
const API_ENDPOINT = 'http://10.10.87.86:5000';

// ─── Helper: normalize plate string (remove spaces) ───────────────────────────
const normPlate = (p) => (p || '').replace(/\s+/g, '').toUpperCase();

// ─── Helper: convert local_plates.json record → display format ────────────────
function normalizeApiRecord(raw) {
  if (!raw) return null;
  return {
    driver: {
      name:        raw.driver_name              || raw.owner_name   || '—',
      license:     raw.driver_license_number    || '—',
      dob:         raw.driver_date_of_birth
                     ? new Date(raw.driver_date_of_birth).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
                     : '—',
      address:     raw.owner_address            || '—',
      contact:     raw.driver_contact           || raw.owner_contact || '—',
      email:       raw.driver_email             || raw.owner_email   || '—',
      bloodGroup:  raw.blood_group              || '—',
    },
    vehicle: {
      make:         raw.make          || '—',
      model:        raw.model         || '—',
      year:         String(raw.year   || '—'),
      color:        raw.color         || '—',
      chassis:      raw.chassis_number|| '—',
      engine:       raw.engine_number || '—',
      fuelType:     raw.fuel_type     || '—',
      cc:           raw.displacement  ? `${raw.displacement} cc` : '—',
      rto:          raw.rto           || '—',
      registrationDate: raw.registration_date || '—',
      validUpto:    raw.rc_valid_upto || '—',
      insurance:    raw.insurance     || '—',
      puc:          raw.puc           || '—',
      ownerType:    raw.owner_type    || 'First Owner',
      fitnessValid: raw.fitness_valid || '—',
      vehicleType:  raw.vehicle_type  || '—',
      ownerName:    raw.owner_name    || '—',
      ownerEmail:   raw.owner_email   || '—',
    }
  };
}

// ─── LOCAL plates DB (same as local_plates.json) ─────────────────────────────
// Key = plate without spaces, UPPERCASE
const LOCAL_PLATES_DB = {
  'MH01AB1234': normalizeApiRecord({ car_number:'MH 01 AB 1234', make:'Maruti', model:'Swift', year:2020, color:'Red', vehicle_type:'car', owner_name:'Rajesh Kumar', owner_contact:'+91-9876543210', owner_email:'rajesh.kumar@email.com', owner_address:'12 MG Road, Mumbai, MH', driver_name:'Ramesh Yadav', driver_license_number:'MH0120001234', driver_contact:'+91-8926994446', driver_email:'ramesh.y@email.com', driver_date_of_birth:'1985-03-15' }),
  'DL02CD5678': normalizeApiRecord({ car_number:'DL 02 CD 5678', make:'Hyundai', model:'Creta', year:2021, color:'White', vehicle_type:'car', owner_name:'Priya Sharma', owner_contact:'+91-8765432109', owner_email:'priya.sharma@email.com', owner_address:'45 Park Street, New Delhi, DL', driver_name:'Sunita Jain', driver_license_number:'DL0220005678', driver_contact:'+91-9988776655', driver_email:'sunita.j@email.com', driver_date_of_birth:'1990-07-22' }),
  'KA03EF9012': normalizeApiRecord({ car_number:'KA 03 EF 9012', make:'Tata', model:'Nexon', year:2022, color:'Blue', vehicle_type:'car', owner_name:'Suresh Patel', owner_contact:'+91-7654321098', owner_email:'suresh.patel@email.com', owner_address:'78 Residency Rd, Bengaluru, KA', driver_name:'Mahesh Gowda', driver_license_number:'KA0320009012', driver_contact:'+91-7653456789', driver_email:'mahesh.g@email.com', driver_date_of_birth:'1988-11-08' }),
  'TN04GH3456': normalizeApiRecord({ car_number:'TN 04 GH 3456', make:'Honda', model:'City', year:2019, color:'Silver', vehicle_type:'car', owner_name:'Anita Desai', owner_contact:'+91-6543210987', owner_email:'anita.desai@email.com', owner_address:'23 Anna Salai, Chennai, TN', driver_name:'Lakshmi Pillai', driver_license_number:'TN0420003456', driver_contact:'+91-6544567890', driver_email:'lakshmi.p@email.com', driver_date_of_birth:'1992-05-30' }),
  'WB05IJ7890': normalizeApiRecord({ car_number:'WB 05 IJ 7890', make:'Toyota', model:'Innova', year:2021, color:'White', vehicle_type:'car', owner_name:'Vikram Singh', owner_contact:'+91-5432109876', owner_email:'vikram.singh@email.com', owner_address:'56 Lake Town, Kolkata, WB', driver_name:'Biswajit Das', driver_license_number:'WB0520007890', driver_contact:'+91-8989898989', driver_email:'biswajit.d@email.com', driver_date_of_birth:'1987-09-12' }),
  'GJ06KL1234': normalizeApiRecord({ car_number:'GJ 06 KL 1234', make:'Mahindra', model:'Scorpio', year:2020, color:'Black', vehicle_type:'car', owner_name:'Meera Nagar', owner_contact:'+91-4321098765', owner_email:'meera.nair@email.com', owner_address:'89 Nehru Nagar, Ahmedabad, GJ', driver_name:'Hardik Shah', driver_license_number:'GJ0620001234', driver_contact:'+91-4326789012', driver_email:'hardik.s@email.com', driver_date_of_birth:'1993-01-25' }),
  'UP14MN5678': normalizeApiRecord({ car_number:'UP 14 MN 5678', make:'Tata', model:'Signa', year:2018, color:'Yellow', vehicle_type:'truck', owner_name:'Ravi Transport Co.', owner_contact:'+91-9811122233', owner_email:'info@ravitransport.com', owner_address:'Phase 2, Noida, UP', driver_name:'Sanjay Singh', driver_license_number:'UP1420185678', driver_contact:'+91-9871112233', driver_email:'sanjay.trucker@email.com', driver_date_of_birth:'1980-04-10' }),
  'RJ14OP9012': normalizeApiRecord({ car_number:'RJ 14 OP 9012', make:'Ashok Leyland', model:'Viking', year:2019, color:'Green', vehicle_type:'bus', owner_name:'Rajasthan Travels', owner_contact:'+91-9988776655', owner_email:'contact@rajtravels.com', owner_address:'Sindhi Camp, Jaipur, RJ', driver_name:'Kailash Choudhary', driver_license_number:'RJ1420199012', driver_contact:'+91-8899776655', driver_email:'kailash.bus@email.com', driver_date_of_birth:'1978-08-14' }),
  'MH12QR3456': normalizeApiRecord({ car_number:'MH 12 QR 3456', make:'Kia', model:'Seltos', year:2023, color:'White', vehicle_type:'car', owner_name:'Sneha Kulkarni', owner_contact:'+91-9822334455', owner_email:'sneha.k@email.com', owner_address:'Kothrud, Pune, MH', driver_name:'Sneha Kulkarni', driver_license_number:'MH1220233456', driver_contact:'+91-9822334455', driver_email:'sneha.k@email.com', driver_date_of_birth:'1995-12-05' }),
  'TS09ST7890': normalizeApiRecord({ car_number:'TS 09 ST 7890', make:'BharatBenz', model:'3128C', year:2021, color:'Orange', vehicle_type:'truck', owner_name:'Deccan Logistics', owner_contact:'+91-9000111222', owner_email:'ops@deccanlogistics.com', owner_address:'Secunderabad, Hyderabad, TS', driver_name:'Murali Reddy', driver_license_number:'TS0920217890', driver_contact:'+91-9011223344', driver_email:'murali.r@email.com', driver_date_of_birth:'1983-02-18' }),
  'HR26UV1234': normalizeApiRecord({ car_number:'HR 26 UV 1234', make:'Volvo', model:'B11R', year:2022, color:'White', vehicle_type:'bus', owner_name:'Haryana Roadways', owner_contact:'+91-9998887776', owner_email:'support@hrroadways.gov', owner_address:'Sector 29, Gurugram, HR', driver_name:'Sukhwinder Singh', driver_license_number:'HR2620221234', driver_contact:'+91-9988112233', driver_email:'sukhwinder.s@email.com', driver_date_of_birth:'1975-06-25' }),
  'MP04WX5678': normalizeApiRecord({ car_number:'MP 04 WX 5678', make:'Mahindra', model:'Thar', year:2021, color:'Black', vehicle_type:'car', owner_name:'Anil Verma', owner_contact:'+91-7776665554', owner_email:'anil.v@email.com', owner_address:'MP Nagar, Bhopal, MP', driver_name:'Anil Verma', driver_license_number:'MP0420215678', driver_contact:'+91-7776665554', driver_email:'anil.v@email.com', driver_date_of_birth:'1989-10-10' }),
};

function lookupVehicle(rawPlate) {
  return LOCAL_PLATES_DB[normPlate(rawPlate)] || null;
}

// ─── Zone speech messages ──────────────────────────────────────────────────────
const ZONE_MESSAGES = {
  school: {
    warning_600: (speed, zone, limit) => `Dhyan dein! Aage ${zone} hai, sirf 600 meter door. Speed limit ${limit} kilometer per hour hai. Aapki current speed ${Math.round(speed)} kilometer per hour hai. Abhi se speed kam karein.`,
    warning_300: (speed, zone, limit) => `Final warning! ${zone} bilkul saamne hai, sirf 300 meter bacha hai. Speed limit ${limit} kilometer per hour hai. Turant gaadi dheemi karein, warna challan katega.`,
    challan:     (speed, zone, limit) => `Traffic violation recorded. Aapne ${zone} mein ${limit} kilometer per hour ki speed limit tod di hai. Aapki speed ${Math.round(speed)} kilometer per hour thi. Challan generate ho gaya hai.`,
  },
  hospital: {
    warning_600: (speed, zone, limit) => `Sawdhan! 600 meter aage ${zone} hai. Speed limit ${limit} kilometer per hour hai. Marizon ke liye silence zone hai. Speed kam karein.`,
    warning_300: (speed, zone, limit) => `Final warning! ${zone} 300 meter par hai. Speed limit ${limit} kilometer per hour hai. Abhi speed kam karein.`,
    challan:     (speed, zone, limit) => `Challan issued. ${zone} mein speed limit ${limit} kilometer per hour tod di. Current speed ${Math.round(speed)} kilometer per hour thi.`,
  },
  default: {
    warning_600: (speed, zone, limit) => `Alert! Aage ${zone} zone hai, 600 meter door. Speed limit ${limit} kilometer per hour hai. Aapki speed ${Math.round(speed)} kilometer per hour hai. Please slow down.`,
    warning_300: (speed, zone, limit) => `Final warning! ${zone} zone 300 meter par hai. Speed limit ${limit} kilometer per hour. Turant gaadi slow karein.`,
    challan:     (speed, zone, limit) => `Speed violation recorded at ${zone}. Limit ${limit} kilometer per hour. Your speed was ${Math.round(speed)} kilometer per hour. Challan generated.`,
  },
};

// ── Real video me zone name generic hota hai — uske liye ek special message ──
function buildRealVideoSpeech(speed, plate, driverName, limit, zone) {
  const name = driverName && driverName !== 'Unknown' ? driverName : 'Driver';
  return `Traffic alert! Vehicle number ${plate.split('').join(' ')}, ` +
    `${name}, aapki speed ${Math.round(speed)} kilometer per hour thi. ` +
    `Speed limit ${limit} kilometer per hour hai. ` +
    `${zone} mein overspeed violation detected. Challan generate ho gaya hai.`;
}

function getZoneType(zone = '') {
  const z = zone.toLowerCase();
  if (z.includes('school') || z.includes('vidyalay') || z.includes('college')) return 'school';
  if (z.includes('hospital') || z.includes('clinic') || z.includes('medical')) return 'hospital';
  return 'default';
}

function buildSpeechMessage(type, speed, zone, limit = 30, stage = 1) {
  const zType = getZoneType(zone);
  const msgs  = ZONE_MESSAGES[zType] || ZONE_MESSAGES.default;
  if (type === 'CHALLAN') return msgs.challan(speed, zone, limit);
  if (Number(stage) === 2) return msgs.warning_300(speed, zone, limit);
  return msgs.warning_600(speed, zone, limit);
}

// ─── Audio helpers ─────────────────────────────────────────────────────────────
function speakMessage(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'hi-IN'; u.rate = 0.92; u.pitch = 1.0;
  const voices  = window.speechSynthesis.getVoices();
  const hiVoice = voices.find(v => v.lang === 'hi-IN') || voices.find(v => v.lang.startsWith('hi')) || null;
  if (hiVoice) u.voice = hiVoice;
  window.speechSynthesis.speak(u);
}

function playBeep(type, stageNum) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  const sequences =
    type === 'CHALLAN' ? [{ freq:380, start:0, dur:1.0 }] :
    stageNum === 2     ? [{ freq:950, start:0, dur:0.25 }, { freq:950, start:0.35, dur:0.25 }] :
                         [{ freq:750, start:0, dur:0.5 }];
  sequences.forEach(({ freq, start, dur }) => {
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
    gain.gain.setValueAtTime(0.25, ctx.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
    osc.start(ctx.currentTime + start); osc.stop(ctx.currentTime + start + dur);
  });
}

// ─── UI Components ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = {
    SAFE:    { color:'#10b981', bg:'rgba(16,185,129,0.12)',  label:'ALL CLEAR',     icon:CheckCircle },
    WARNING: { color:'#f59e0b', bg:'rgba(245,158,11,0.12)', label:'WARNING',        icon:AlertTriangle },
    CHALLAN: { color:'#ef4444', bg:'rgba(239,68,68,0.12)',  label:'CHALLAN ISSUED', icon:ShieldAlert },
  };
  const c = cfg[status] || cfg.SAFE;
  const Icon = c.icon;
  return (
    <div style={{ background:c.bg, border:`1px solid ${c.color}30`, borderRadius:16, padding:'6px 14px', display:'inline-flex', alignItems:'center', gap:6 }}>
      <Icon size={13} style={{ color:c.color }}/>
      <span style={{ color:c.color, fontSize:11, fontWeight:700, letterSpacing:1.2 }}>{c.label}</span>
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value, accent }) => (
  <div style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
    <div style={{ width:32, height:32, borderRadius:8, background:accent?`${accent}18`:'rgba(96,165,250,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      <Icon size={15} style={{ color:accent||'#60a5fa' }}/>
    </div>
    <div style={{ flex:1, minWidth:0 }}>
      <div style={{ fontSize:10, color:'#64748b', fontWeight:600, letterSpacing:0.8, textTransform:'uppercase', marginBottom:2 }}>{label}</div>
      <div style={{ fontSize:13, color:'#e2e8f0', fontWeight:500, lineHeight:1.4 }}>{value || '—'}</div>
    </div>
  </div>
);

const SectionCard = ({ title, icon: Icon, children, accentColor = '#60a5fa' }) => (
  <div style={{ background:'linear-gradient(135deg, rgba(30,41,59,0.95), rgba(15,23,42,0.95))', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, padding:'20px 20px 8px', marginBottom:16, boxShadow:'0 4px 24px rgba(0,0,0,0.3)' }}>
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
      <div style={{ width:30, height:30, borderRadius:8, background:`${accentColor}20`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Icon size={15} style={{ color:accentColor }}/>
      </div>
      <span style={{ fontSize:12, fontWeight:700, color:accentColor, letterSpacing:1.5, textTransform:'uppercase' }}>{title}</span>
    </div>
    {children}
  </div>
);

const AvatarCircle = ({ name }) => {
  const initials = name.split(' ').slice(0,2).map(n=>n[0]).join('');
  return (
    <div style={{ width:64, height:64, borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:700, color:'#fff', boxShadow:'0 0 0 3px rgba(96,165,250,0.25)', flexShrink:0 }}>
      {initials}
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
export default function DriverAppPage() {
  const [plate, setPlate]               = useState('');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('SAFE');
  const [alertDetails, setAlertDetails] = useState(null);
  const [vehicleInfo, setVehicleInfo]   = useState(null);
  const [lookupDone, setLookupDone]     = useState(false);
  const [activeTab, setActiveTab]       = useState('status');
  const [source, setSource]             = useState('—');   // which stream fired the alert

  const lastAlertKey = useRef(null);

  const triggerAlert = (type, speed, zone, limit, stageNum, driverName, plateTxt) => {
    playBeep(type, stageNum);
    setTimeout(() => {
      let msg;
      // Real video → use real-video speech (has driver name)
      if (type === 'CHALLAN' && driverName && driverName !== 'Unknown') {
        msg = buildRealVideoSpeech(speed, plateTxt, driverName, limit, zone);
      } else {
        msg = buildSpeechMessage(type, speed, zone, limit, stageNum);
      }
      speakMessage(msg);
    }, 400);
  };

  const handleStart = (e) => {
    e.preventDefault();
    if (!plate.trim()) return;
    setVehicleInfo(lookupVehicle(plate));
    setLookupDone(true);
    setIsMonitoring(true);
  };

  // ── Polling: hits /api/all-violations — gets data from ALL streams ───────────
  useEffect(() => {
    if (!isMonitoring || !plate) return;
    const cleanPlate = normPlate(plate);

    const interval = setInterval(async () => {
      try {
        const res  = await fetch(`${API_ENDPOINT}/api/all-violations`);
        const data = await res.json();
        if (!data) return;

        const myViolations = (data.violations || []).filter(v => normPlate(v.plate) === cleanPlate);
        const myWarnings   = (data.warnings   || []).filter(w => normPlate(w.plate) === cleanPlate);

        console.log('[DriverAlert] plate:', cleanPlate,
          '| violations:', myViolations.length,
          '| warnings:', myWarnings.length);

        // ── CHALLAN (highest priority) ──────────────────────────────────────
        if (myViolations.length > 0) {
          const latest   = myViolations[myViolations.length - 1]; // most recent
          const alertKey = `${cleanPlate}_CHALLAN_${latest.timestamp}`;

          if (lastAlertKey.current !== alertKey) {
            lastAlertKey.current = alertKey;
            const limit = Number(latest.speed_limit) || 60;
            setCurrentStatus('CHALLAN');
            setAlertDetails({ ...latest, stage:'CHALLAN', speed_limit:limit });
            setSource(latest.zone || 'Processing Zone');
            triggerAlert('CHALLAN', latest.speed, latest.zone, limit, 3,
              latest.driver_name || latest.driver, latest.plate);
          }
          return;
        }

        // ── WARNINGS (virtual simulation only) ─────────────────────────────
        if (myWarnings.length > 0) {
          const stage2 = myWarnings.filter(w => Number(w.warning_stage)===2 || (w.distance_m && Number(w.distance_m)<=300));
          const stage1 = myWarnings.filter(w => Number(w.warning_stage)===1 || (w.distance_m && Number(w.distance_m)>300));
          const raw    = stage2.length > 0 ? stage2[0] : stage1.length > 0 ? stage1[0] : null;
          if (!raw) return;

          const stageNum = stage2.length > 0 ? 2 : 1;
          const limit    = Number(raw.speed_limit) || 30;
          const alertKey = `${cleanPlate}_WARNING_stage${stageNum}_${raw.timestamp}`;

          if (lastAlertKey.current !== alertKey) {
            lastAlertKey.current = alertKey;
            setCurrentStatus('WARNING');
            setAlertDetails({ ...raw, stage:stageNum, speed_limit:limit });
            setSource(raw.zone || 'Live Simulation');
            triggerAlert('WARNING', raw.speed, raw.zone, limit, stageNum, null, raw.plate);
          }
          return;
        }

        // ── SAFE ──────────────────────────────────────────────────────────
        setCurrentStatus('SAFE');
        setAlertDetails(null);
        setSource('—');

      } catch (err) {
        console.error('[DriverApp] Poll error:', err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [isMonitoring, plate]);

  // ── Styles ──────────────────────────────────────────────────────────────────
  const styles = {
    root: { minHeight:'100vh', background:'#080f1a', fontFamily:"'DM Sans','Segoe UI',sans-serif", color:'#e2e8f0' },
    header: { background:'linear-gradient(180deg,#0d1b2e,#080f1a)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' },
    logoBox: { width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#1d4ed8,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center' },
  };

  return (
    <div style={styles.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        input::placeholder{color:#334155;}input:focus{outline:none;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:#1e293b;border-radius:4px;}
        @keyframes pulse-ring{0%{box-shadow:0 0 0 0 rgba(239,68,68,0.4);}70%{box-shadow:0 0 0 16px rgba(239,68,68,0);}100%{box-shadow:0 0 0 0 rgba(239,68,68,0);}}
        @keyframes warn-ring {0%{box-shadow:0 0 0 0 rgba(245,158,11,0.5);}70%{box-shadow:0 0 0 16px rgba(245,158,11,0);}100%{box-shadow:0 0 0 0 rgba(245,158,11,0);}}
        @keyframes safe-glow {0%,100%{filter:drop-shadow(0 0 8px rgba(16,185,129,0.4));}50%{filter:drop-shadow(0 0 20px rgba(16,185,129,0.8));}}
        @keyframes blink{0%,100%{opacity:1;}50%{opacity:0.3;}}
        .status-safe   {animation:safe-glow 2.5s ease-in-out infinite;}
        .status-warning{animation:warn-ring 1.4s ease-in-out infinite;border-radius:50%;}
        .status-challan{animation:pulse-ring 1.0s ease-in-out infinite;border-radius:50%;}
        .live-blink{animation:blink 1.2s ease-in-out infinite;}
        .tab-btn{flex:1;padding:10px 6px;border:none;cursor:pointer;font-family:inherit;font-size:11px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;border-radius:10px;transition:all 0.2s;}
        .tab-active  {background:rgba(96,165,250,0.15);color:#60a5fa;}
        .tab-inactive{background:transparent;color:#475569;}
        .tab-inactive:hover{color:#94a3b8;}
        .plate-input{width:100%;background:rgba(30,41,59,0.6);border:1.5px solid rgba(255,255,255,0.08);padding:14px 16px;border-radius:12px;color:#f1f5f9;font-size:18px;font-weight:700;font-family:'JetBrains Mono',monospace;letter-spacing:3px;text-align:center;transition:border-color 0.2s;}
        .plate-input:focus{border-color:#3b82f6;}
        .start-btn{width:100%;padding:15px;background:linear-gradient(135deg,#1d4ed8,#7c3aed);border:none;border-radius:12px;color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;letter-spacing:0.5px;transition:opacity 0.2s,transform 0.1s;display:flex;align-items:center;justify-content:center;gap:8px;}
        .start-btn:hover{opacity:0.9;transform:translateY(-1px);}
      `}</style>

      {/* Header */}
      <header style={styles.header}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={styles.logoBox}><Car size={18} color="#fff"/></div>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:'#f1f5f9' }}>m-Parivahan</div>
            <div style={{ fontSize:10, color:'#475569', letterSpacing:1 }}>TRAFFIC ENFORCEMENT PORTAL</div>
          </div>
        </div>
        {isMonitoring && (
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:10, color:'#10b981', fontWeight:600, letterSpacing:1 }}>
            <span className="live-blink" style={{ width:7, height:7, borderRadius:'50%', background:'#10b981', display:'inline-block' }}/>
            LIVE
          </div>
        )}
      </header>

      {!isMonitoring ? (
        /* ── PLATE ENTRY ── */
        <div style={{ padding:'40px 20px', maxWidth:420, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:36 }}>
            <div style={{ width:80, height:80, borderRadius:24, margin:'0 auto 20px', background:'linear-gradient(135deg,rgba(29,78,216,0.3),rgba(124,58,237,0.3))', border:'1px solid rgba(96,165,250,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Shield size={36} style={{ color:'#60a5fa' }}/>
            </div>
            <h2 style={{ fontSize:22, fontWeight:700, color:'#f1f5f9', marginBottom:8 }}>Vehicle Authentication</h2>
            <p style={{ fontSize:13, color:'#475569', lineHeight:1.6 }}>Enter your registered vehicle number to receive real-time traffic alerts</p>
          </div>

          <div style={{ background:'linear-gradient(135deg,rgba(30,41,59,0.9),rgba(15,23,42,0.9))', border:'1px solid rgba(255,255,255,0.07)', borderRadius:24, padding:28, boxShadow:'0 20px 60px rgba(0,0,0,0.5)' }}>
            <form onSubmit={handleStart}>
              <label style={{ fontSize:10, color:'#64748b', fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', display:'block', marginBottom:10 }}>
                Vehicle Registration Number
              </label>
              <input className="plate-input" placeholder="MH 01 AB 1234"
                value={plate} onChange={e=>setPlate(e.target.value.toUpperCase())}/>

              {/* Hint: all available plates */}
              <div style={{ fontSize:10, color:'#334155', textAlign:'center', margin:'12px 0 20px', lineHeight:1.8 }}>
                Available plates:<br/>
                MH01AB1234 · DL02CD5678 · KA03EF9012 · TN04GH3456<br/>
                WB05IJ7890 · GJ06KL1234 · UP14MN5678 · RJ14OP9012<br/>
                MH12QR3456 · TS09ST7890 · HR26UV1234 · MP04WX5678
              </div>

              <button className="start-btn" type="submit">
                <Activity size={16}/> Begin Monitoring
              </button>
            </form>
          </div>
        </div>

      ) : (
        /* ── MONITORING DASHBOARD ── */
        <div style={{ padding:'16px 16px 40px', maxWidth:460, margin:'0 auto' }}>

          {/* Plate + Power off */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:16, fontWeight:700, color:'#f1f5f9', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'7px 14px', letterSpacing:2 }}>
              {plate}
            </div>
            <button onClick={()=>{ setIsMonitoring(false); setPlate(''); setVehicleInfo(null); setLookupDone(false); setCurrentStatus('SAFE'); setAlertDetails(null); lastAlertKey.current=null; window.speechSynthesis?.cancel(); }}
              style={{ background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:10, padding:8, cursor:'pointer', color:'#ef4444', display:'flex' }}>
              <Power size={18}/>
            </button>
          </div>

          {/* Source badge */}
          {source !== '—' && (
            <div style={{ fontSize:10, color:'#60a5fa', background:'rgba(96,165,250,0.08)', border:'1px solid rgba(96,165,250,0.15)', borderRadius:8, padding:'4px 12px', marginBottom:12, display:'inline-block', letterSpacing:0.8 }}>
              📡 Alert from: <strong>{source}</strong>
            </div>
          )}

          {/* Status Hero */}
          <div style={{
            background: currentStatus==='SAFE'    ? 'linear-gradient(135deg,rgba(16,185,129,0.08),rgba(5,150,105,0.04))'
                       : currentStatus==='WARNING' ? 'linear-gradient(135deg,rgba(245,158,11,0.12),rgba(180,83,9,0.04))'
                       : 'linear-gradient(135deg,rgba(239,68,68,0.12),rgba(185,28,28,0.04))',
            border:`1px solid ${currentStatus==='SAFE'?'rgba(16,185,129,0.2)':currentStatus==='WARNING'?'rgba(245,158,11,0.2)':'rgba(239,68,68,0.25)'}`,
            borderRadius:20, padding:'28px 20px', textAlign:'center', marginBottom:16,
          }}>
            <div className={currentStatus==='SAFE'?'status-safe':currentStatus==='WARNING'?'status-warning':'status-challan'} style={{ display:'inline-block', marginBottom:14 }}>
              {currentStatus==='SAFE'    ? <CheckCircle size={64} style={{ color:'#10b981' }}/> :
               currentStatus==='WARNING' ? <AlertTriangle size={64} style={{ color:'#f59e0b' }}/> :
               <ShieldAlert size={64} style={{ color:'#ef4444' }}/>}
            </div>
            <div style={{ marginBottom:10 }}><StatusBadge status={currentStatus}/></div>
            <p style={{ fontSize:12, color:'#475569', marginTop:8 }}>
              {currentStatus==='SAFE' ? 'Driving within permitted speed limits' : 'Immediate attention required'}
            </p>
          </div>

          {/* Alert Details */}
          {alertDetails && (() => {
            const isChln  = alertDetails.stage === 'CHALLAN';
            const isFinal = alertDetails.stage === 2;
            const txtColor = isChln||isFinal ? '#ef4444' : '#f59e0b';
            return (
              <div style={{ background:isChln?'rgba(239,68,68,0.07)':isFinal?'rgba(239,68,68,0.06)':'rgba(245,158,11,0.07)', border:`1px solid ${isChln?'rgba(239,68,68,0.25)':isFinal?'rgba(239,68,68,0.2)':'rgba(245,158,11,0.25)'}`, borderRadius:16, padding:'14px 16px', marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <span style={{ fontSize:10, fontWeight:700, letterSpacing:1.1, textTransform:'uppercase', color:txtColor }}>
                    {isChln ? '🚨 Challan Issued' : isFinal ? '⚠️ Final Warning' : '⚠️ First Warning'}
                  </span>
                  {!isChln && (
                    <span style={{ fontSize:11, fontWeight:700, color:'#fff', background:isFinal?'rgba(239,68,68,0.3)':'rgba(245,158,11,0.3)', border:`1px solid ${isFinal?'rgba(239,68,68,0.5)':'rgba(245,158,11,0.5)'}`, borderRadius:8, padding:'3px 10px' }}>
                      {isFinal?'300 m':'600 m'} aage
                    </span>
                  )}
                </div>
                <div style={{ fontSize:12, color:'#cbd5e1', lineHeight:1.6, background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'10px 12px', marginBottom:10 }}>
                  {isChln
                    ? `${alertDetails.zone} mein speed limit tod di gayi. Challan register ho gaya hai.`
                    : isFinal
                    ? `🏫 ${alertDetails.zone} bilkul saamne hai — sirf 300 meter. Speed limit ${alertDetails.speed_limit||30} km/h. Turant gaadi dheemi karein!`
                    : `🏫 Aage ${alertDetails.zone} hai — 600 meter door. Speed limit ${alertDetails.speed_limit||30} km/h. Abhi se speed kam karein.`}
                </div>
                <InfoRow icon={Gauge} label="Recorded Speed" value={`${alertDetails.speed} km/h`} accent={txtColor}/>
                <InfoRow icon={MapPin} label="Zone / Location" value={alertDetails.zone} accent={txtColor}/>
                {/* Show driver name if available (real video) */}
                {(alertDetails.driver_name || alertDetails.driver) && (alertDetails.driver_name || alertDetails.driver) !== 'Unknown' && (
                  <InfoRow icon={User} label="Driver" value={alertDetails.driver_name || alertDetails.driver} accent={txtColor}/>
                )}
              </div>
            );
          })()}

          {/* Tabs */}
          <div style={{ display:'flex', gap:6, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:14, padding:4, marginBottom:16 }}>
            {[['status','Status'],['driver','Driver'],['vehicle','Vehicle']].map(([k,label])=>(
              <button key={k} className={`tab-btn ${activeTab===k?'tab-active':'tab-inactive'}`} onClick={()=>setActiveTab(k)}>{label}</button>
            ))}
          </div>

          {/* Tab: Status */}
          {activeTab==='status' && (
            <SectionCard title="Monitoring Status" icon={Activity} accentColor="#10b981">
              <InfoRow icon={Wifi}     label="Connection"   value="Real-time Stream Active"          accent="#10b981"/>
              <InfoRow icon={Shield}   label="System"       value="m-Parivahan Traffic Enforcement"  accent="#10b981"/>
              <InfoRow icon={Activity} label="Poll Rate"    value="Every 1.5 seconds"                accent="#10b981"/>
              <InfoRow icon={MapPin}   label="Alert Source" value={source}                           accent="#60a5fa"/>
              <div style={{ height:8 }}/>
            </SectionCard>
          )}

          {/* Tab: Driver */}
          {activeTab==='driver' && (
            lookupDone && vehicleInfo ? (
              <SectionCard title="Driver Information" icon={User} accentColor="#818cf8">
                <div style={{ display:'flex', alignItems:'center', gap:14, padding:'8px 0 16px', borderBottom:'1px solid rgba(255,255,255,0.05)', marginBottom:4 }}>
                  <AvatarCircle name={vehicleInfo.driver.name}/>
                  <div>
                    <div style={{ fontSize:16, fontWeight:700, color:'#f1f5f9' }}>{vehicleInfo.driver.name}</div>
                    <div style={{ fontSize:11, color:'#60a5fa', fontFamily:"'JetBrains Mono',monospace", marginTop:3 }}>{vehicleInfo.driver.license}</div>
                  </div>
                </div>
                <InfoRow icon={Calendar}   label="Date of Birth" value={vehicleInfo.driver.dob}     accent="#818cf8"/>
                <InfoRow icon={Phone}      label="Contact"        value={vehicleInfo.driver.contact} accent="#818cf8"/>
                <InfoRow icon={Mail}       label="Email"          value={vehicleInfo.driver.email}   accent="#818cf8"/>
                <InfoRow icon={MapPin}     label="Address"        value={vehicleInfo.driver.address} accent="#818cf8"/>
                <div style={{ height:8 }}/>
              </SectionCard>
            ) : (
              <div style={{ background:'rgba(30,41,59,0.6)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:16, padding:32, textAlign:'center' }}>
                <User size={40} style={{ color:'#334155', marginBottom:12 }}/>
                <p style={{ color:'#475569', fontSize:13 }}>Vehicle not found in database</p>
                <p style={{ color:'#334155', fontSize:11, marginTop:6 }}>Plate: {plate}</p>
              </div>
            )
          )}

          {/* Tab: Vehicle */}
          {activeTab==='vehicle' && (
            lookupDone && vehicleInfo ? (
              <SectionCard title="Vehicle Information" icon={Car} accentColor="#38bdf8">
                <div style={{ background:'linear-gradient(135deg,rgba(56,189,248,0.08),rgba(14,165,233,0.04))', border:'1px solid rgba(56,189,248,0.12)', borderRadius:14, padding:'14px 16px', marginBottom:12, display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:52, height:52, borderRadius:12, background:'rgba(56,189,248,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Car size={26} style={{ color:'#38bdf8' }}/>
                  </div>
                  <div>
                    <div style={{ fontSize:15, fontWeight:700, color:'#f1f5f9' }}>{vehicleInfo.vehicle.make} {vehicleInfo.vehicle.model}</div>
                    <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{vehicleInfo.vehicle.year} · {vehicleInfo.vehicle.color}</div>
                  </div>
                </div>
                <InfoRow icon={Car}         label="Vehicle Type"  value={vehicleInfo.vehicle.vehicleType}   accent="#38bdf8"/>
                <InfoRow icon={MapPin}      label="Owner"         value={vehicleInfo.vehicle.ownerName}     accent="#38bdf8"/>
                <InfoRow icon={Calendar}    label="Registered On" value={vehicleInfo.vehicle.registrationDate} accent="#38bdf8"/>
                <InfoRow icon={Shield}      label="RC Valid Upto" value={vehicleInfo.vehicle.validUpto}     accent="#22d3ee"/>
                <InfoRow icon={Shield}      label="Insurance"     value={vehicleInfo.vehicle.insurance}     accent="#a78bfa"/>
                <InfoRow icon={CheckCircle} label="PUC"           value={vehicleInfo.vehicle.puc}           accent="#34d399"/>
                <InfoRow icon={User}        label="Owner Type"    value={vehicleInfo.vehicle.ownerType}     accent="#38bdf8"/>
                <div style={{ height:8 }}/>
              </SectionCard>
            ) : (
              <div style={{ background:'rgba(30,41,59,0.6)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:16, padding:32, textAlign:'center' }}>
                <Car size={40} style={{ color:'#334155', marginBottom:12 }}/>
                <p style={{ color:'#475569', fontSize:13 }}>Vehicle not found in database</p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}