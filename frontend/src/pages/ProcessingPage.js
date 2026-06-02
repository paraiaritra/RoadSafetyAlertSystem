import React, { useState, useEffect, useRef } from 'react';
import {
  Settings, FileVideo, Loader, Play, Car, AlertTriangle, Activity, Zap,
  ShieldAlert, CheckCircle, Upload, StopCircle, User, Phone, Mail,
  CreditCard, MapPin, Calendar, Shield, ChevronRight, Gauge, X
} from 'lucide-react';
import { API_ENDPOINT } from '../constants';

// ─── Zone / speech (same as DriverAppPage) ────────────────────────────────────
function buildSpeechMessage(speed, plate, driverName, limit) {
  const name = driverName && driverName !== 'Unknown' ? driverName : 'Driver';
  return (
    `Traffic alert! Vehicle number ${plate.split('').join(' ')}, ` +
    `${name}, aapki speed ${Math.round(speed)} kilometer per hour hai. ` +
    `Speed limit ${limit} kilometer per hour hai. ` +
    `Yeh ek overspeed violation hai. Challan generate ho gaya hai.`
  );
}

function speakAlert(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang  = 'hi-IN';
  u.rate  = 0.92;
  u.pitch = 1.0;
  const voices  = window.speechSynthesis.getVoices();
  const hiVoice = voices.find(v => v.lang === 'hi-IN')
                || voices.find(v => v.lang.startsWith('hi'))
                || null;
  if (hiVoice) u.voice = hiVoice;
  window.speechSynthesis.speak(u);
}

function playBeep() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  [
    { freq: 880, start: 0,    dur: 0.18 },
    { freq: 880, start: 0.22, dur: 0.18 },
    { freq: 660, start: 0.44, dur: 0.45 },
  ].forEach(({ freq, start, dur }) => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
    gain.gain.setValueAtTime(0.28, ctx.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
    osc.start(ctx.currentTime + start);
    osc.stop(ctx.currentTime + start + dur);
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, from, to }) => (
  <div style={{
    background: `linear-gradient(135deg, ${from}, ${to})`,
    borderRadius: 16, padding: '18px 20px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
    display: 'flex', flexDirection: 'column', gap: 6,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.75, fontSize: 12 }}>
      <Icon size={14} /> {label}
    </div>
    <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', fontFamily: "'JetBrains Mono', monospace" }}>
      {value}
    </div>
  </div>
);

const InfoRow = ({ icon: Icon, label, value, accent = '#60a5fa' }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
    <div style={{ width: 28, height: 28, borderRadius: 7, background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={13} style={{ color: accent }} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 9, color: '#475569', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 500, lineHeight: 1.4, wordBreak: 'break-word' }}>{value || '—'}</div>
    </div>
  </div>
);

// Violation toast card (slide-in)
const ViolationToast = ({ violation, onDismiss }) => {
  if (!violation) return null;
  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 9999, width: 340,
      background: 'linear-gradient(135deg, rgba(20,10,10,0.98), rgba(40,10,10,0.98))',
      border: '1px solid rgba(239,68,68,0.5)', borderRadius: 18,
      padding: '16px 18px', boxShadow: '0 20px 60px rgba(239,68,68,0.25)',
      animation: 'slideIn 0.35s ease',
    }}>
      <style>{`@keyframes slideIn { from { transform: translateX(110%); opacity: 0; } to { transform: none; opacity: 1; } }`}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldAlert size={18} style={{ color: '#ef4444' }} />
          <span style={{ color: '#ef4444', fontWeight: 800, fontSize: 13, letterSpacing: 0.5 }}>OVERSPEED VIOLATION</span>
        </div>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 2 }}>
          <X size={15} />
        </button>
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: '#fca5a5', marginBottom: 8, letterSpacing: 2 }}>
        {violation.plate}
      </div>
      <div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.7 }}>
        <span style={{ color: '#f87171', fontWeight: 700 }}>{violation.speed} km/h</span>
        {' '}detected · Limit: {violation.speed_limit} km/h<br />
        Driver: <span style={{ color: '#e2e8f0' }}>{violation.driver_name || 'Unknown'}</span><br />
        {violation.vehicle_make && <>{violation.vehicle_make} {violation.vehicle_model} · {violation.vehicle_color}<br /></>}
      </div>
    </div>
  );
};

// Log table rows
const LogRow = ({ entry, limit }) => {
  const over = entry.speed > limit;
  return (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: over ? 'rgba(239,68,68,0.06)' : 'transparent' }}>
      <td style={{ padding: '8px 12px', fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#94a3b8' }}>#{entry.id}</td>
      <td style={{ padding: '8px 12px', fontSize: 11, color: '#e2e8f0', fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>
        {entry.plate || '—'}
      </td>
      <td style={{ padding: '8px 12px', fontSize: 12, color: over ? '#f87171' : '#34d399', fontWeight: 700 }}>
        {entry.speed} <span style={{ fontSize: 10, fontWeight: 400 }}>km/h</span>
      </td>
      <td style={{ padding: '8px 12px', fontSize: 11, color: '#94a3b8' }}>{entry.driver_name || '—'}</td>
      <td style={{ padding: '8px 12px' }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: 0.8, padding: '3px 8px', borderRadius: 6,
          background: over ? 'rgba(239,68,68,0.2)' : 'rgba(52,211,153,0.15)',
          color: over ? '#f87171' : '#34d399',
        }}>
          {over ? 'VIOLATION' : 'OK'}
        </span>
      </td>
      <td style={{ padding: '8px 12px', fontSize: 10, color: '#475569' }}>{entry.timestamp}</td>
    </tr>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ProcessingPage({ token }) {
  const [file, setFile]             = useState(null);
  const [streamUrl, setStreamUrl]   = useState(null);
  const [loading, setLoading]       = useState(false);
  const [isPlaying, setIsPlaying]   = useState(false);
  const [config, setConfig]         = useState({ limit: 60, dist: 20, zone: 'Processing Zone' });
  const [activeTab, setActiveTab]   = useState('all');

  const [liveStats, setLiveStats] = useState({
    total_vehicles: 0, total_violations: 0,
    avg_speed: 0, max_speed: 0,
    all_logs: [], overspeed_summary: [],
    violations: [], warnings: [],
  });

  // Toast state
  const [toast, setToast]           = useState(null);
  const firedViolations             = useRef(new Set());
  const dragRef                     = useRef(null);

  // Selected driver panel
  const [selectedEntry, setSelectedEntry] = useState(null);

  // ── Polling ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!streamUrl) return;
    const match = streamUrl.match(/\/video_feed\/([^?]+)/);
    if (!match) return;
    const filename = match[1];

    const interval = setInterval(async () => {
      try {
        const res  = await fetch(`${API_ENDPOINT}/api/stream-status/${filename}`);
        const data = await res.json();
        if (!data) return;
        setLiveStats(data);

        // ── Fire sound alert for each new violation ───────────────────────
        const violations = data.violations || data.overspeed_summary || [];
        violations.forEach(v => {
          const key = `${v.plate}_${v.timestamp}`;
          if (!firedViolations.current.has(key)) {
            firedViolations.current.add(key);
            playBeep();
            setTimeout(() => {
              speakAlert(buildSpeechMessage(v.speed, v.plate, v.driver_name, v.speed_limit || config.limit));
            }, 500);
            setToast(v);
            setTimeout(() => setToast(null), 7000);
          }
        });
      } catch (err) {
        console.error('[Processing] Poll error:', err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [streamUrl]);

  // ── Upload & start ────────────────────────────────────────────────────────────
  const handleStart = async () => {
    if (!file) return alert('Please select a video file first.');
    setLoading(true);
    firedViolations.current.clear();
    setLiveStats({ total_vehicles: 0, total_violations: 0, avg_speed: 0, max_speed: 0, all_logs: [], overspeed_summary: [], violations: [], warnings: [] });

    const formData = new FormData();
    formData.append('video', file);

    try {
      const res  = await fetch(`${API_ENDPOINT}/api/prepare-simulation`, { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        const url = `${API_ENDPOINT}/video_feed/${data.filename}?save=true&user=${localStorage.getItem('username') || 'admin'}&limit=${config.limit}&dist=${config.dist}&zone=${encodeURIComponent(config.zone)}`;
        setStreamUrl(url);
        setIsPlaying(true);
      } else {
        alert('Upload error: ' + (data.error || 'Unknown'));
      }
    } catch (e) {
      alert('Network error: ' + e.message);
    }
    setLoading(false);
  };

  const handleStop = () => {
    setStreamUrl(null);
    setIsPlaying(false);
    window.speechSynthesis?.cancel();
  };

  // ── Drag & Drop ───────────────────────────────────────────────────────────────
  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('video/')) setFile(f);
  };

  // ─── Styles ──────────────────────────────────────────────────────────────────
  const S = {
    root: {
      minHeight: '100vh', background: '#060d18',
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      color: '#e2e8f0',
    },
    card: {
      background: 'linear-gradient(135deg, rgba(15,25,45,0.97), rgba(8,15,28,0.97))',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 20, padding: 24,
      boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
    },
  };

  const logs   = liveStats.all_logs        || [];
  const viols  = liveStats.overspeed_summary || [];
  const shown  = activeTab === 'all' ? logs : viols;

  return (
    <div style={S.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
        input[type=number] { -moz-appearance: textfield; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        .pp-tab { flex: 1; padding: 9px 6px; border: none; cursor: pointer; font-family: inherit; font-size: 11px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; border-radius: 10px; transition: all 0.2s; }
        .pp-tab-active   { background: rgba(96,165,250,0.15); color: #60a5fa; }
        .pp-tab-inactive { background: transparent; color: #475569; }
        .pp-tab-inactive:hover { color: #94a3b8; }
        .log-row-hover:hover { background: rgba(255,255,255,0.03) !important; cursor: pointer; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        .fade-up { animation: fadeUp 0.4s ease; }
        @keyframes blinkDot { 0%,100% { opacity:1; } 50% { opacity:0.2; } }
        .blink { animation: blinkDot 1.1s ease-in-out infinite; }
      `}</style>

      {/* Violation Toast */}
      {toast && <ViolationToast violation={toast} onDismiss={() => setToast(null)} />}

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div style={{ padding: '28px 32px 0', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', letterSpacing: -0.3 }}>Real-time Video Processing</h1>
            <p style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>YOLOv8 · Speed Trap · OCR Plate Recognition · Auto Alert</p>
          </div>
          {isPlaying && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: '#10b981', fontWeight: 700, letterSpacing: 1 }}>
              <span className="blink" style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              LIVE PROCESSING
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '0 32px 40px' }}>

        {/* ── Stat Cards ───────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          <StatCard icon={Car}           label="Total Vehicles" value={liveStats.total_vehicles} from="#1e3a5f" to="#0f2040" />
          <StatCard icon={AlertTriangle} label="Violations"     value={liveStats.total_violations} from="#5f1e1e" to="#400f0f" />
          <StatCard icon={Activity}      label="Avg Speed"      value={`${liveStats.avg_speed}`}   from="#1e4f2a" to="#0f2815" />
          <StatCard icon={Zap}           label="Max Speed"      value={`${liveStats.max_speed}`}   from="#3b1e5f" to="#1e0f40" />
        </div>

        {/* ── Main Grid ────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, marginBottom: 20 }}>

          {/* ── LEFT: Config + Upload ──────────────────────────────────── */}
          <div style={S.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Settings size={15} style={{ color: '#60a5fa' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa', letterSpacing: 1.2, textTransform: 'uppercase' }}>Configuration</span>
            </div>

            {/* Inputs */}
            {[
              { label: 'Speed Limit (km/h)', key: 'limit', type: 'number' },
              { label: 'Trap Distance (meters)', key: 'dist', type: 'number' },
              { label: 'Zone Name', key: 'zone', type: 'text' },
            ].map(({ label, key, type }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 10, color: '#64748b', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>{label}</label>
                <input
                  type={type}
                  value={config[key]}
                  onChange={e => setConfig({ ...config, [key]: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px', color: '#f1f5f9', fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: 'none', transition: 'border-color 0.2s' }}
                  onFocus={e => e.target.style.borderColor = '#3b82f6'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  disabled={isPlaying}
                />
              </div>
            ))}

            {/* Drag & drop zone */}
            <div
              ref={dragRef}
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#3b82f6'; }}
              onDragLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
              onDrop={handleDrop}
              style={{ border: '2px dashed rgba(255,255,255,0.12)', borderRadius: 14, padding: '28px 16px', textAlign: 'center', marginBottom: 16, cursor: isPlaying ? 'default' : 'pointer', position: 'relative', transition: 'border-color 0.2s', background: file ? 'rgba(96,165,250,0.04)' : 'transparent' }}>
              <input
                type="file"
                accept="video/*"
                onChange={e => setFile(e.target.files[0])}
                disabled={isPlaying}
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
              />
              <FileVideo size={28} style={{ color: file ? '#60a5fa' : '#334155', marginBottom: 8 }} />
              <div style={{ fontSize: 12, fontWeight: 600, color: file ? '#93c5fd' : '#475569', wordBreak: 'break-all' }}>
                {file ? file.name : 'Drop video here or click to select'}
              </div>
              {file && <div style={{ fontSize: 10, color: '#334155', marginTop: 4 }}>{(file.size / 1024 / 1024).toFixed(1)} MB</div>}
            </div>

            {/* Action button */}
            {!isPlaying ? (
              <button
                onClick={handleStart}
                disabled={loading || !file}
                style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 13, fontWeight: 700, cursor: (loading || !file) ? 'not-allowed' : 'pointer', opacity: (loading || !file) ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', transition: 'opacity 0.2s' }}>
                {loading ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Uploading...</> : <><Play size={15} /> Start Processing</>}
              </button>
            ) : (
              <button
                onClick={handleStop}
                style={{ width: '100%', padding: '13px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, color: '#f87171', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}>
                <StopCircle size={15} /> Stop
              </button>
            )}
          </div>

          {/* ── RIGHT: Video Feed ─────────────────────────────────────── */}
          <div style={{ background: '#000', borderRadius: 20, overflow: 'hidden', minHeight: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}>
            {streamUrl ? (
              <>
                <img src={streamUrl} alt="Live stream" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={() => setIsPlaying(false)} />
                {isPlaying && (
                  <div style={{ position: 'absolute', top: 14, left: 14, background: '#dc2626', padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 12px rgba(220,38,38,0.4)' }}>
                    <span className="blink" style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
                    REC
                  </div>
                )}
                <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '5px 16px', fontSize: 11, color: '#94a3b8' }}>
                  {isPlaying ? 'Processing in progress — results auto-saving to History' : 'Processing complete.'}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', color: '#1e293b' }}>
                <Play size={56} style={{ opacity: 0.3, marginBottom: 12 }} />
                <div style={{ fontSize: 14, color: '#334155' }}>Upload a video and press Start</div>
                <div style={{ fontSize: 11, color: '#1e293b', marginTop: 6 }}>YOLOv8 · OCR · Speed Trap</div>
              </div>
            )}
          </div>
        </div>

        {/* ── Lower Grid: Logs + Driver Panel ────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: selectedEntry ? '1fr 340px' : '1fr', gap: 20, transition: 'all 0.3s' }}>

          {/* Log Table */}
          <div style={S.card}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 4, marginBottom: 16, width: 'fit-content' }}>
              {[['all', `All Vehicles (${logs.length})`], ['violations', `Violations (${viols.length})`]].map(([k, label]) => (
                <button key={k} className={`pp-tab ${activeTab === k ? 'pp-tab-active' : 'pp-tab-inactive'}`} onClick={() => setActiveTab(k)}>{label}</button>
              ))}
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['ID', 'Plate', 'Speed', 'Driver', 'Status', 'Time'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, color: '#475569', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shown.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center', color: '#334155', fontSize: 13 }}>
                        {isPlaying ? 'Waiting for vehicles to cross detection lines…' : 'No data yet. Start processing to see results.'}
                      </td>
                    </tr>
                  ) : (
                    shown.map((entry, i) => (
                      <tr
                        key={`${entry.id}-${i}`}
                        className="log-row-hover"
                        onClick={() => setSelectedEntry(selectedEntry?.id === entry.id ? null : entry)}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: entry.overspeed ? 'rgba(239,68,68,0.05)' : 'transparent', transition: 'background 0.15s' }}
                      >
                        <td style={{ padding: '9px 12px', fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#64748b' }}>#{entry.id}</td>
                        <td style={{ padding: '9px 12px', fontSize: 12, color: '#e2e8f0', fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1, fontWeight: 600 }}>{entry.plate || '—'}</td>
                        <td style={{ padding: '9px 12px', fontSize: 13, color: entry.overspeed ? '#f87171' : '#34d399', fontWeight: 700 }}>
                          {entry.speed} <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.7 }}>km/h</span>
                        </td>
                        <td style={{ padding: '9px 12px', fontSize: 11, color: '#94a3b8' }}>{entry.driver_name || '—'}</td>
                        <td style={{ padding: '9px 12px' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, padding: '3px 8px', borderRadius: 6, background: entry.overspeed ? 'rgba(239,68,68,0.18)' : 'rgba(52,211,153,0.12)', color: entry.overspeed ? '#f87171' : '#34d399' }}>
                            {entry.overspeed ? '🚨 VIOLATION' : '✓ OK'}
                          </span>
                        </td>
                        <td style={{ padding: '9px 12px', fontSize: 10, color: '#334155' }}>{entry.timestamp}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {shown.length > 0 && (
              <div style={{ padding: '10px 12px 0', fontSize: 11, color: '#334155' }}>
                Click any row to view driver & vehicle details →
              </div>
            )}
          </div>

          {/* Driver Details Panel */}
          {selectedEntry && (
            <div style={{ ...S.card, animation: 'fadeUp 0.3s ease' }} className="fade-up">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <User size={14} style={{ color: '#818cf8' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', letterSpacing: 1.2, textTransform: 'uppercase' }}>Driver & Vehicle</span>
                </div>
                <button onClick={() => setSelectedEntry(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 7, padding: '4px 8px', cursor: 'pointer', color: '#64748b' }}>
                  <X size={13} />
                </button>
              </div>

              {/* Plate badge */}
              <div style={{ background: selectedEntry.overspeed ? 'rgba(239,68,68,0.1)' : 'rgba(52,211,153,0.08)', border: `1px solid ${selectedEntry.overspeed ? 'rgba(239,68,68,0.3)' : 'rgba(52,211,153,0.2)'}`, borderRadius: 12, padding: '12px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: selectedEntry.overspeed ? 'rgba(239,68,68,0.15)' : 'rgba(52,211,153,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {selectedEntry.overspeed ? <ShieldAlert size={20} style={{ color: '#ef4444' }} /> : <CheckCircle size={20} style={{ color: '#34d399' }} />}
                </div>
                <div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 700, color: '#f1f5f9', letterSpacing: 2 }}>{selectedEntry.plate || 'UNKNOWN'}</div>
                  <div style={{ fontSize: 11, color: selectedEntry.overspeed ? '#f87171' : '#34d399', marginTop: 2 }}>
                    {selectedEntry.speed} km/h · {selectedEntry.overspeed ? `${selectedEntry.speed - (selectedEntry.speed_limit || config.limit)} km/h over limit` : 'Within limit'}
                  </div>
                </div>
              </div>

              {/* Driver info */}
              <div style={{ marginBottom: 4, fontSize: 10, color: '#3b82f6', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginTop: 4 }}>Driver</div>
              <InfoRow icon={User}       label="Name"    value={selectedEntry.driver_name}    accent="#818cf8" />
              <InfoRow icon={Phone}      label="Contact" value={selectedEntry.driver_contact} accent="#818cf8" />
              <InfoRow icon={CreditCard} label="Owner"   value={selectedEntry.owner_name}     accent="#818cf8" />

              {/* Vehicle info */}
              <div style={{ marginTop: 12, marginBottom: 4, fontSize: 10, color: '#38bdf8', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Vehicle</div>
              <InfoRow icon={Car}      label="Make / Model" value={`${selectedEntry.vehicle_make || '—'} ${selectedEntry.vehicle_model || ''}`} accent="#38bdf8" />
              <InfoRow icon={Gauge}    label="Color"        value={selectedEntry.vehicle_color}  accent="#38bdf8" />
              <InfoRow icon={Activity} label="Detected"     value={selectedEntry.label}          accent="#38bdf8" />
              <InfoRow icon={Calendar} label="Timestamp"    value={selectedEntry.timestamp}      accent="#64748b" />

              {selectedEntry.overspeed && (
                <div style={{ marginTop: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 12px', fontSize: 11, color: '#fca5a5', lineHeight: 1.6 }}>
                  🚨 <strong>Challan Generated</strong><br />
                  Speed: {selectedEntry.speed} km/h · Limit: {selectedEntry.speed_limit || config.limit} km/h<br />
                  Excess: <strong>{Math.round(selectedEntry.speed - (selectedEntry.speed_limit || config.limit))} km/h over</strong>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}