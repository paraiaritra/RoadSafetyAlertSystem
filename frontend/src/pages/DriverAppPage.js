import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, CheckCircle, Car, Power, Wifi, MapPin, Gauge, User, CreditCard, Calendar, Shield, AlertTriangle, Activity, Phone, Mail } from 'lucide-react';

const API_ENDPOINT = 'http://192.168.1.100:5000';

// ─── Helper: convert raw API response → internal format ───────────────────────
function normalizeApiRecord(raw) {
  if (!raw) return null;
  return {
    driver: {
      name:        raw.driver_name        || raw.owner_name || '—',
      license:     raw.driver_license_number || '—',
      dob:         raw.driver_date_of_birth
                     ? new Date(raw.driver_date_of_birth).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
                     : '—',
      address:     raw.owner_address      || '—',
      contact:     raw.driver_contact     || raw.owner_contact || '—',
      email:       raw.driver_email       || raw.owner_email  || '—',
      issueDate:   '—',
      expiryDate:  '—',
      bloodGroup:  raw.blood_group        || '—',
    },
    vehicle: {
      make:             raw.make           || '—',
      model:            raw.model          || '—',
      year:             String(raw.year    || '—'),
      color:            raw.color          || '—',
      chassis:          raw.chassis_number || '—',
      engine:           raw.engine_number  || '—',
      fuelType:         raw.fuel_type      || '—',
      cc:               raw.displacement   ? `${raw.displacement} cc` : '—',
      rto:              raw.rto            || '—',
      registrationDate: raw.registration_date || '—',
      validUpto:        raw.rc_valid_upto  || '—',
      insurance:        raw.insurance      || '—',
      puc:              raw.puc            || '—',
      ownerType:        raw.owner_type     || 'First Owner',
      fitnessValid:     raw.fitness_valid  || '—',
      vehicleType:      raw.vehicle_type   || '—',
      ownerName:        raw.owner_name     || '—',
      ownerEmail:       raw.owner_email    || '—',
    }
  };
}

// Mock vehicle database
const VEHICLE_DB = {
  'PY01EF3456': normalizeApiRecord({
    car_number: 'PY 01 EF 3456',
    make: 'Hyundai', model: 'i20', year: 2022, color: 'White',
    vehicle_type: 'car', owner_id: 29, owner_name: 'Rajan Iyer',
    owner_contact: '+91-7567890123', owner_email: 'rajan.i@email.com',
    owner_address: 'White Town, Pondicherry, PY', driver_id: 29,
    driver_name: 'Rajan Iyer', driver_license_number: 'PY0120223456',
    driver_contact: '+91-7567890123', driver_email: 'rajan.i@email.com',
    driver_date_of_birth: '1989-08-30',
  }),
  'MH01AB1234': {
    driver: { name: 'Rajesh Kumar Sharma', license: 'MH-0120190012345', dob: '15 Mar 1985',
      address: '42, Shivaji Nagar, Pune, Maharashtra - 411005', contact: '+91 98765 43210',
      email: '—', issueDate: '10 Jan 2019', expiryDate: '09 Jan 2034', bloodGroup: 'B+' },
    vehicle: { make: 'Maruti Suzuki', model: 'Swift Dzire ZXi', year: '2021', color: 'Pearl Arctic White',
      chassis: 'MA3FJEB1S00123456', engine: 'K12N-1234567', fuelType: 'Petrol', cc: '1197 cc',
      rto: 'MH-01 (Mumbai Central)', registrationDate: '22 Apr 2021', validUpto: '21 Apr 2036',
      insurance: 'HDFC ERGO – Valid till 21 Apr 2025', puc: 'Valid till 10 Sep 2024',
      ownerType: 'First Owner', fitnessValid: '21 Apr 2036' }
  },
  'NL01GH7890': normalizeApiRecord({
    car_number: 'NL 01 GH 7890',
    make: 'Tata', model: 'Nexon EV', year: 2023, color: 'Pristine White',
    vehicle_type: 'car', owner_name: 'Unknown', owner_contact: 'N/A',
    owner_email: 'N/A', owner_address: 'Nagaland',
    driver_name: 'Unknown', driver_license_number: 'N/A',
    driver_contact: 'N/A', driver_email: 'N/A', driver_date_of_birth: '',
  }),
  'KA05MN9999': {
    driver: { name: 'Arun Venkatesh', license: 'KA-0520180045678', dob: '28 Nov 1980',
      address: '12, JP Nagar 3rd Phase, Bengaluru, Karnataka - 560078', contact: '+91 80012 34567',
      email: '—', issueDate: '20 Jun 2018', expiryDate: '19 Jun 2038', bloodGroup: 'A+' },
    vehicle: { make: 'Hyundai', model: 'Creta SX(O) Turbo', year: '2023', color: 'Typhoon Silver',
      chassis: 'MALA851CXPM012345', engine: 'G4FJ-KA34567', fuelType: 'Petrol Turbo', cc: '1353 cc',
      rto: 'KA-05 (Bengaluru East)', registrationDate: '12 Feb 2023', validUpto: '11 Feb 2038',
      insurance: 'New India Assurance – Valid till 11 Feb 2026', puc: 'Valid till 20 Mar 2025',
      ownerType: 'First Owner', fitnessValid: '11 Feb 2038' }
  }
};

function lookupVehicle(rawPlate) {
  const key = rawPlate.replace(/\s+/g, '').toUpperCase();
  return VEHICLE_DB[key] || null;
}

// ─── Zone messages ─────────────────────────────────────────────────────────────
const ZONE_MESSAGES = {
  school: {
    warning_600: (speed, zone, limit) =>
      `Dhyan dein! Aage ${zone} hai, sirf 600 meter door. Speed limit ${limit} kilometer per hour hai. Aapki current speed ${Math.round(speed)} kilometer per hour hai. Abhi se speed kam karein.`,
    warning_300: (speed, zone, limit) =>
      `Final warning! ${zone} bilkul saamne hai, sirf 300 meter bacha hai. Speed limit ${limit} kilometer per hour hai. Turant gaadi dheemi karein, warna challan katega.`,
    challan: (speed, zone, limit) =>
      `Traffic violation recorded. Aapne ${zone} mein ${limit} kilometer per hour ki speed limit tod di hai. Aapki speed ${Math.round(speed)} kilometer per hour thi. Challan generate ho gaya hai.`,
  },
  hospital: {
    warning_600: (speed, zone, limit) =>
      `Sawdhan! 600 meter aage ${zone} hai. Speed limit ${limit} kilometer per hour hai. Marizon ke liye silence zone hai. Speed kam karein.`,
    warning_300: (speed, zone, limit) =>
      `Final warning! ${zone} 300 meter par hai. Speed limit ${limit} kilometer per hour hai. Abhi speed kam karein.`,
    challan: (speed, zone, limit) =>
      `Challan issued. ${zone} mein speed limit ${limit} kilometer per hour tod di. Current speed ${Math.round(speed)} kilometer per hour thi.`,
  },
  default: {
    warning_600: (speed, zone, limit) =>
      `Alert! Aage ${zone} zone hai, 600 meter door. Speed limit ${limit} kilometer per hour hai. Aapki speed ${Math.round(speed)} kilometer per hour hai. Please slow down.`,
    warning_300: (speed, zone, limit) =>
      `Final warning! ${zone} zone 300 meter par hai. Speed limit ${limit} kilometer per hour. Turant gaadi slow karein.`,
    challan: (speed, zone, limit) =>
      `Speed violation recorded at ${zone}. Limit ${limit} kilometer per hour. Your speed was ${Math.round(speed)} kilometer per hour. Challan generated.`,
  },
};

function getZoneType(zone = '') {
  const z = zone.toLowerCase();
  if (z.includes('school') || z.includes('vidyalay') || z.includes('college')) return 'school';
  if (z.includes('hospital') || z.includes('clinic') || z.includes('medical')) return 'hospital';
  return 'default';
}

function buildSpeechMessage(type, speed, zone, limit = 30, stage = 1) {
  const zType = getZoneType(zone);
  const msgs = ZONE_MESSAGES[zType] || ZONE_MESSAGES.default;
  const stageNum = Number(stage);
  if (type === 'CHALLAN') return msgs.challan(speed, zone, limit);
  if (stageNum === 2)     return msgs.warning_300(speed, zone, limit);
  return msgs.warning_600(speed, zone, limit);
}

// ─── UI Components ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = {
    SAFE:    { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  label: 'ALL CLEAR',    icon: CheckCircle },
    WARNING: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'WARNING',       icon: AlertTriangle },
    CHALLAN: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  label: 'CHALLAN ISSUED',icon: ShieldAlert },
  };
  const c = cfg[status] || cfg.SAFE;
  const Icon = c.icon;
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.color}30`, borderRadius: 16, padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <Icon size={13} style={{ color: c.color }} />
      <span style={{ color: c.color, fontSize: 11, fontWeight: 700, letterSpacing: 1.2 }}>{c.label}</span>
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value, accent }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
    <div style={{ width: 32, height: 32, borderRadius: 8, background: accent ? `${accent}18` : 'rgba(96,165,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={15} style={{ color: accent || '#60a5fa' }} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500, lineHeight: 1.4 }}>{value}</div>
    </div>
  </div>
);

const SectionCard = ({ title, icon: Icon, children, accentColor = '#60a5fa' }) => (
  <div style={{ background: 'linear-gradient(135deg, rgba(30,41,59,0.95) 0%, rgba(15,23,42,0.95) 100%)', border: `1px solid rgba(255,255,255,0.07)`, borderRadius: 20, padding: '20px 20px 8px', marginBottom: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: `${accentColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={15} style={{ color: accentColor }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: accentColor, letterSpacing: 1.5, textTransform: 'uppercase' }}>{title}</span>
    </div>
    {children}
  </div>
);

const AvatarCircle = ({ name }) => {
  const initials = name.split(' ').slice(0, 2).map(n => n[0]).join('');
  return (
    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff', boxShadow: '0 0 0 3px rgba(96,165,250,0.25)', flexShrink: 0 }}>
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

  // ── Track last fired alert uniquely: plate + stage + timestamp ──────────────
  const lastAlertKey = useRef(null);

  // ── Speech ──────────────────────────────────────────────────────────────────
  const speakMessage = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang  = 'hi-IN';
    u.rate  = 0.92;
    u.pitch = 1.0;
    const voices  = window.speechSynthesis.getVoices();
    const hiVoice = voices.find(v => v.lang === 'hi-IN') || voices.find(v => v.lang.startsWith('hi')) || null;
    if (hiVoice) u.voice = hiVoice;
    window.speechSynthesis.speak(u);
  };

  // ── Beep tones ──────────────────────────────────────────────────────────────
  const playBeep = (type, stageNum) => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    // CHALLAN  → 1 low long beep
    // stage 2  → 2 fast high beeps (urgent)
    // stage 1  → 1 medium beep
    const sequences =
      type === 'CHALLAN' ? [{ freq: 380, start: 0,   dur: 1.0 }] :
      stageNum === 2     ? [{ freq: 950, start: 0,   dur: 0.25 }, { freq: 950, start: 0.35, dur: 0.25 }] :
                           [{ freq: 750, start: 0,   dur: 0.5  }];
    sequences.forEach(({ freq, start, dur }) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0.25, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    });
  };

  const triggerAlert = (type, speed, zone, limit, stageNum) => {
    playBeep(type, stageNum);
    setTimeout(() => {
      const msg = buildSpeechMessage(type, speed, zone, limit, stageNum);
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

  // ── Polling useEffect ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isMonitoring || !plate) return;

    const interval = setInterval(async () => {
      try {
        const res  = await fetch(`${API_ENDPOINT}/api/stream-status/virtual_simulation`);
        const data = await res.json();
        if (!data) return;

        // ✅ Strip ALL spaces — "PY 01 EF 3456" matches "PY01EF3456"
        const normPlate = (p) => (p || '').replace(/\s+/g, '').toUpperCase();
        const cleanPlate = normPlate(plate);

        const myViolations = (data.violations || []).filter(v => normPlate(v.plate) === cleanPlate);
        const myWarnings   = (data.warnings   || []).filter(w => normPlate(w.plate) === cleanPlate);

        // 🔍 Debug log — remove after confirming alerts work
        console.log('[DriverAlert] myPlate:', cleanPlate,
          '| warnings:', myWarnings.length,
          '| violations:', myViolations.length,
          '| allWarningPlates:', (data.warnings||[]).slice(0,3).map(w => normPlate(w.plate))
        );

        // ── CHALLAN (highest priority) ────────────────────────────────────────
        if (myViolations.length > 0) {
          const latest   = myViolations[0];
          const alertKey = `${cleanPlate}_CHALLAN_${latest.timestamp}`;

          if (lastAlertKey.current !== alertKey) {
            lastAlertKey.current = alertKey;
            const limit = Number(latest.speed_limit) || 30;
            setCurrentStatus('CHALLAN');
            setAlertDetails({ ...latest, stage: 'CHALLAN', speed_limit: limit });
            triggerAlert('CHALLAN', latest.speed, latest.zone, limit, 3);
          }
          return; // Don't process warnings if challan exists
        }

        // ── WARNINGS ─────────────────────────────────────────────────────────
        if (myWarnings.length > 0) {
          // Separate stage-1 and stage-2 warnings
          const stage1Warnings = myWarnings.filter(w => Number(w.warning_stage) === 1 ||
            (w.warning_stage === undefined && Number(w.distance_m) > 300));
          const stage2Warnings = myWarnings.filter(w => Number(w.warning_stage) === 2 ||
            (w.warning_stage === undefined && Number(w.distance_m) <= 300 && Number(w.distance_m) > 0));

          // ✅ Stage 2 (300m Final Warning) takes priority over stage 1
          const rawWarning = stage2Warnings.length > 0
            ? stage2Warnings[0]
            : stage1Warnings.length > 0
            ? stage1Warnings[0]
            : null;

          if (!rawWarning) return; // no matching stage warning found

          const resolvedStage = stage2Warnings.length > 0 ? 2 : 1;
          const activeWarning = { ...rawWarning, resolvedStage };

          const stageNum = activeWarning.resolvedStage;
          const limit    = Number(activeWarning.speed_limit) || 30;

          // ✅ Unique key uses plate + stage + timestamp — no same-second clash
          const alertKey = `${cleanPlate}_WARNING_stage${stageNum}_${activeWarning.timestamp}`;

          if (lastAlertKey.current !== alertKey) {
            lastAlertKey.current = alertKey;
            setCurrentStatus('WARNING');
            setAlertDetails({ ...activeWarning, stage: stageNum, speed_limit: limit });
            triggerAlert('WARNING', activeWarning.speed, activeWarning.zone, limit, stageNum);
          }
          return;
        }

        // ── SAFE ──────────────────────────────────────────────────────────────
        setCurrentStatus('SAFE');
        setAlertDetails(null);

      } catch (err) {
        console.error('Poll error:', err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [isMonitoring, plate]);

  // ── Styles ──────────────────────────────────────────────────────────────────
  const styles = {
    root: { minHeight: '100vh', background: '#080f1a', fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: '#e2e8f0' },
    header: { background: 'linear-gradient(180deg, #0d1b2e 0%, #080f1a 100%)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    headerLeft: { display: 'flex', alignItems: 'center', gap: 10 },
    logoBox: { width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 15, fontWeight: 700, color: '#f1f5f9', letterSpacing: 0.3 },
    headerSub: { fontSize: 10, color: '#475569', fontWeight: 500, letterSpacing: 1 },
    liveDot: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#10b981', fontWeight: 600, letterSpacing: 1 },
  };

  return (
    <div style={styles.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: #334155; }
        input:focus { outline: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
        @keyframes pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); } 70% { box-shadow: 0 0 0 16px rgba(239,68,68,0); } 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); } }
        @keyframes warn-ring  { 0% { box-shadow: 0 0 0 0 rgba(245,158,11,0.5); } 70% { box-shadow: 0 0 0 16px rgba(245,158,11,0); } 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); } }
        @keyframes safe-glow  { 0%, 100% { filter: drop-shadow(0 0 8px rgba(16,185,129,0.4)); } 50% { filter: drop-shadow(0 0 20px rgba(16,185,129,0.8)); } }
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        .status-safe    { animation: safe-glow 2.5s ease-in-out infinite; }
        .status-warning { animation: warn-ring 1.4s ease-in-out infinite; border-radius: 50%; }
        .status-challan { animation: pulse-ring 1.0s ease-in-out infinite; border-radius: 50%; }
        .live-blink { animation: blink 1.2s ease-in-out infinite; }
        .tab-btn { flex: 1; padding: 10px 6px; border: none; cursor: pointer; font-family: inherit; font-size: 11px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; border-radius: 10px; transition: all 0.2s; }
        .tab-active   { background: rgba(96,165,250,0.15); color: #60a5fa; }
        .tab-inactive { background: transparent; color: #475569; }
        .tab-inactive:hover { color: #94a3b8; }
        .plate-input { width: 100%; background: rgba(30,41,59,0.6); border: 1.5px solid rgba(255,255,255,0.08); padding: 14px 16px; border-radius: 12px; color: #f1f5f9; font-size: 18px; font-weight: 700; font-family: 'JetBrains Mono', monospace; letter-spacing: 3px; text-align: center; transition: border-color 0.2s; }
        .plate-input:focus { border-color: #3b82f6; }
        .start-btn { width: 100%; padding: 15px; background: linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%); border: none; border-radius: 12px; color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; letter-spacing: 0.5px; transition: opacity 0.2s, transform 0.1s; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .start-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        .start-btn:active { transform: translateY(0); }
      `}</style>

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logoBox}><Car size={18} color="#fff" /></div>
          <div>
            <div style={styles.headerTitle}>m-Parivahan</div>
            <div style={styles.headerSub}>TRAFFIC ENFORCEMENT PORTAL</div>
          </div>
        </div>
        {isMonitoring && (
          <div style={styles.liveDot}>
            <span className="live-blink" style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            LIVE
          </div>
        )}
      </header>

      {!isMonitoring ? (
        /* ─── PLATE ENTRY ─── */
        <div style={{ padding: '40px 20px', maxWidth: 420, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ width: 80, height: 80, borderRadius: 24, margin: '0 auto 20px', background: 'linear-gradient(135deg, rgba(29,78,216,0.3), rgba(124,58,237,0.3))', border: '1px solid rgba(96,165,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={36} style={{ color: '#60a5fa' }} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>Vehicle Authentication</h2>
            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>Enter your registered vehicle number to begin real-time traffic monitoring</p>
          </div>
          <div style={{ background: 'linear-gradient(135deg, rgba(30,41,59,0.9), rgba(15,23,42,0.9))', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <form onSubmit={handleStart}>
              <label style={{ fontSize: 10, color: '#64748b', fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Vehicle Registration Number</label>
              <input className="plate-input" placeholder="PY 01 EF 3456" value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} />
              <div style={{ fontSize: 11, color: '#334155', textAlign: 'center', margin: '12px 0 20px' }}>
                Try: PY01EF3456 · MH01AB1234 · KA05MN9999
              </div>
              <button className="start-btn" type="submit">
                <Activity size={16} /> Begin Monitoring
              </button>
            </form>
          </div>
        </div>

      ) : (
        /* ─── MONITORING DASHBOARD ─── */
        <div style={{ padding: '16px 16px 40px', maxWidth: 460, margin: '0 auto' }}>

          {/* Plate + Power */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: '#f1f5f9', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '7px 14px', letterSpacing: 2 }}>{plate}</div>
            <button onClick={() => { setIsMonitoring(false); setPlate(''); setVehicleInfo(null); setLookupDone(false); setCurrentStatus('SAFE'); setAlertDetails(null); lastAlertKey.current = null; }}
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: 8, cursor: 'pointer', color: '#ef4444', display: 'flex' }}>
              <Power size={18} />
            </button>
          </div>

          {/* Status Hero */}
          <div style={{
            background: currentStatus === 'SAFE'    ? 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.04))'
                       : currentStatus === 'WARNING' ? 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(180,83,9,0.04))'
                       : 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(185,28,28,0.04))',
            border: `1px solid ${currentStatus === 'SAFE' ? 'rgba(16,185,129,0.2)' : currentStatus === 'WARNING' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.25)'}`,
            borderRadius: 20, padding: '28px 20px', textAlign: 'center', marginBottom: 16,
          }}>
            <div className={currentStatus === 'SAFE' ? 'status-safe' : currentStatus === 'WARNING' ? 'status-warning' : 'status-challan'} style={{ display: 'inline-block', marginBottom: 14 }}>
              {currentStatus === 'SAFE'    ? <CheckCircle size={64} style={{ color: '#10b981' }} />
              : currentStatus === 'WARNING' ? <AlertTriangle size={64} style={{ color: '#f59e0b' }} />
              : <ShieldAlert size={64} style={{ color: '#ef4444' }} />}
            </div>
            <div style={{ marginBottom: 10 }}><StatusBadge status={currentStatus} /></div>
            <p style={{ fontSize: 12, color: '#475569', marginTop: 8 }}>
              {currentStatus === 'SAFE' ? 'Driving within permitted speed limits' : 'Immediate attention required'}
            </p>
          </div>

          {/* Alert Details Card */}
          {alertDetails && (() => {
            const isChln   = alertDetails.stage === 'CHALLAN';
            const isFinal  = alertDetails.stage === 2;
            const cardBg   = isChln ? 'rgba(239,68,68,0.07)' : isFinal ? 'rgba(239,68,68,0.06)' : 'rgba(245,158,11,0.07)';
            const cardBdr  = isChln ? 'rgba(239,68,68,0.25)' : isFinal ? 'rgba(239,68,68,0.2)'  : 'rgba(245,158,11,0.25)';
            const txtColor = isChln || isFinal ? '#ef4444' : '#f59e0b';
            const accentC  = isChln || isFinal ? '#ef4444' : '#f59e0b';
            const distBg   = isFinal ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)';
            const distBdr  = isFinal ? 'rgba(239,68,68,0.5)' : 'rgba(245,158,11,0.5)';
            return (
              <div style={{ background: cardBg, border: `1px solid ${cardBdr}`, borderRadius: 16, padding: '14px 16px', marginBottom: 16 }}>
                {/* Badge row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.1, textTransform: 'uppercase', color: txtColor }}>
                    {isChln ? '🚨 Challan Issued' : isFinal ? '⚠️ Final Warning' : '⚠️ First Warning'}
                  </span>
                  {!isChln && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: distBg, border: `1px solid ${distBdr}`, borderRadius: 8, padding: '3px 10px' }}>
                      {isFinal ? '300 m' : '600 m'} aage
                    </span>
                  )}
                </div>
                {/* Message */}
                <div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.6, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
                  {isChln
                    ? `${alertDetails.zone} mein speed limit tod di gayi. Challan register ho gaya hai.`
                    : isFinal
                    ? `🏫 ${alertDetails.zone} bilkul saamne hai — sirf 300 meter. Speed limit ${alertDetails.speed_limit || 30} km/h. Turant gaadi dheemi karein!`
                    : `🏫 Aage ${alertDetails.zone} hai — 600 meter door. Speed limit ${alertDetails.speed_limit || 30} km/h. Abhi se speed kam karein.`}
                </div>
                <InfoRow icon={Gauge} label="Recorded Speed" value={`${alertDetails.speed} km/h`} accent={accentC} />
                <InfoRow icon={MapPin} label="Zone / Location" value={alertDetails.zone}             accent={accentC} />
              </div>
            );
          })()}

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: 4, marginBottom: 16 }}>
            {[['status','Status'],['driver','Driver'],['vehicle','Vehicle']].map(([k, label]) => (
              <button key={k} className={`tab-btn ${activeTab === k ? 'tab-active' : 'tab-inactive'}`} onClick={() => setActiveTab(k)}>{label}</button>
            ))}
          </div>

          {/* Tab: Status */}
          {activeTab === 'status' && (
            <SectionCard title="Monitoring Status" icon={Activity} accentColor="#10b981">
              <InfoRow icon={Wifi}     label="Connection" value="Real-time Stream Active"           accent="#10b981" />
              <InfoRow icon={Shield}   label="System"     value="m-Parivahan Traffic Enforcement"  accent="#10b981" />
              <InfoRow icon={Activity} label="Poll Rate"  value="Every 1.5 seconds"                accent="#10b981" />
              <div style={{ height: 8 }} />
            </SectionCard>
          )}

          {/* Tab: Driver */}
          {activeTab === 'driver' && (
            lookupDone && vehicleInfo ? (
              <SectionCard title="Driver Information" icon={User} accentColor="#818cf8">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 0 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: 4 }}>
                  <AvatarCircle name={vehicleInfo.driver.name} />
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>{vehicleInfo.driver.name}</div>
                    <div style={{ fontSize: 11, color: '#60a5fa', fontFamily: "'JetBrains Mono', monospace", marginTop: 3 }}>{vehicleInfo.driver.license}</div>
                  </div>
                </div>
                <InfoRow icon={Calendar} label="Date of Birth" value={vehicleInfo.driver.dob}     accent="#818cf8" />
                <InfoRow icon={Phone}    label="Contact"        value={vehicleInfo.driver.contact} accent="#818cf8" />
                <InfoRow icon={Mail}     label="Email"          value={vehicleInfo.driver.email}   accent="#818cf8" />
                <InfoRow icon={MapPin}   label="Address"        value={vehicleInfo.driver.address} accent="#818cf8" />
                {vehicleInfo.driver.issueDate  !== '—' && <InfoRow icon={CreditCard} label="License Issued" value={vehicleInfo.driver.issueDate}  accent="#818cf8" />}
                {vehicleInfo.driver.expiryDate !== '—' && <InfoRow icon={Shield}     label="License Expiry" value={vehicleInfo.driver.expiryDate} accent="#818cf8" />}
                {vehicleInfo.driver.bloodGroup !== '—' && <InfoRow icon={User}       label="Blood Group"    value={vehicleInfo.driver.bloodGroup} accent="#f87171" />}
                <div style={{ height: 8 }} />
              </SectionCard>
            ) : (
              <div style={{ background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 32, textAlign: 'center' }}>
                <User size={40} style={{ color: '#334155', marginBottom: 12 }} />
                <p style={{ color: '#475569', fontSize: 13 }}>Vehicle not found in database</p>
                <p style={{ color: '#334155', fontSize: 11, marginTop: 6 }}>Plate: {plate}</p>
              </div>
            )
          )}

          {/* Tab: Vehicle */}
          {activeTab === 'vehicle' && (
            lookupDone && vehicleInfo ? (
              <SectionCard title="Vehicle Information" icon={Car} accentColor="#38bdf8">
                <div style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.08), rgba(14,165,233,0.04))', border: '1px solid rgba(56,189,248,0.12)', borderRadius: 14, padding: '14px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 12, background: 'rgba(56,189,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Car size={26} style={{ color: '#38bdf8' }} /></div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>{vehicleInfo.vehicle.make} {vehicleInfo.vehicle.model}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{vehicleInfo.vehicle.year} · {vehicleInfo.vehicle.color}</div>
                  </div>
                </div>
                <InfoRow icon={CreditCard}   label="Chassis No."         value={vehicleInfo.vehicle.chassis}                                   accent="#38bdf8" />
                <InfoRow icon={Gauge}        label="Engine No."          value={vehicleInfo.vehicle.engine}                                    accent="#38bdf8" />
                <InfoRow icon={Activity}     label="Fuel / Displacement" value={`${vehicleInfo.vehicle.fuelType} · ${vehicleInfo.vehicle.cc}`} accent="#38bdf8" />
                <InfoRow icon={MapPin}       label="RTO Office"          value={vehicleInfo.vehicle.rto}                                       accent="#38bdf8" />
                <InfoRow icon={Calendar}     label="Registered On"       value={vehicleInfo.vehicle.registrationDate}                          accent="#38bdf8" />
                <InfoRow icon={Shield}       label="RC Valid Upto"       value={vehicleInfo.vehicle.validUpto}                                 accent="#22d3ee" />
                <InfoRow icon={Shield}       label="Insurance"           value={vehicleInfo.vehicle.insurance}                                 accent="#a78bfa" />
                <InfoRow icon={CheckCircle}  label="PUC Certificate"     value={vehicleInfo.vehicle.puc}                                       accent="#34d399" />
                <InfoRow icon={Car}          label="Fitness Valid"       value={vehicleInfo.vehicle.fitnessValid}                              accent="#34d399" />
                <InfoRow icon={User}         label="Owner Type"          value={vehicleInfo.vehicle.ownerType}                                 accent="#38bdf8" />
                <div style={{ height: 8 }} />
              </SectionCard>
            ) : (
              <div style={{ background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 32, textAlign: 'center' }}>
                <Car size={40} style={{ color: '#334155', marginBottom: 12 }} />
                <p style={{ color: '#475569', fontSize: 13 }}>Vehicle not found in database</p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}