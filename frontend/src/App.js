import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Upload, Play, Loader, AlertTriangle, Download, Car, Activity, Zap, 
  FileVideo, TrendingUp, LogOut, User, Home, History as HistoryIcon, 
  Info, Menu, X, Shield, Eye, Trash2, Clock, Settings, Video, RefreshCw, 
  FileText, Square, Lock, MapPin, Bell, ShieldCheck, Database, Search, 
  Filter, Calendar, MessageSquare, Phone, CheckCircle, Smartphone,
  StopCircle, ShieldAlert
} from 'lucide-react';

const API_ENDPOINT = 'http://10.10.87.86:5000';

// --- UTILS ---
const convertToCSVAndDownload = (data, filename) => {
  if (!data || data.length === 0) return alert("No data to download");
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  for (const row of data) {
    const values = headers.map(header => `"${String(row[header]).replace(/"/g, '""')}"`);
    csvRows.push(values.join(','));
  }
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- LOGIN PAGE ---
const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`${API_ENDPOINT}/api/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username, password})
      });
      const data = await res.json();
      if(res.ok) {
         localStorage.setItem('token', data.access_token);
         localStorage.setItem('username', data.username);
         localStorage.setItem('role', data.role);
         onLogin(data);
      } else { alert("Login Failed: " + (data.error || "Unknown error")); }
    } catch(err) { alert("Connection Error. Is the backend running?"); }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-slate-900 overflow-hidden">
       <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/90 to-slate-900/80"></div>
       </div>
       <div className="relative z-10 w-full max-w-md p-8 m-4 bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl">
          <div className="text-center mb-8">
             <div className="mx-auto w-20 h-20 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-6">
               <Shield className="text-white w-10 h-10" />
             </div>
             <h2 className="text-3xl font-bold text-white tracking-tight">Welcome Back</h2>
             <p className="text-slate-400 mt-2 text-sm">Sign in to SpeedGuard AI Monitor</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
             <div className="space-y-4">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                    </div>
                    <input className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} required />
                </div>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                    </div>
                    <input className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
                </div>
             </div>
             <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all duration-200 disabled:opacity-70 flex justify-center items-center gap-2">
                {isLoading ? <Loader className="animate-spin w-5 h-5"/> : "Access Portal"}
             </button>
          </form>
          <div className="mt-8 pt-6 border-t border-slate-700/50 text-center">
             <p className="text-xs text-slate-500">Demo Credentials</p>
             <div className="flex flex-col gap-2 mt-3 text-xs font-mono text-slate-400">
                <div className="flex items-center justify-between bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-700">
                  <span>Admin Authority:</span><span className="text-blue-400">admin / admin123</span>
                </div>
                <div className="flex items-center justify-between bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-700">
                  <span>Citizen/Driver:</span><span className="text-green-400">user / user123</span>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

// --- NAVIGATION ---
const Navigation = ({ currentPage, setCurrentPage, user, onLogout }) => (
  <nav className="bg-slate-800 p-4 text-white flex justify-between items-center sticky top-0 z-50 border-b border-slate-700 shadow-lg">
     <div className="flex items-center gap-2 font-bold text-xl"><Activity className="text-blue-400"/> Traffic AI</div>
     <div className="hidden md:flex gap-2">
        {user?.role === 'admin' && (
          <>
            <NavBtn active={currentPage==='home'} onClick={()=>setCurrentPage('home')} icon={<Home size={18}/>} label="Processing" />
            <NavBtn active={currentPage==='monitor'} onClick={()=>setCurrentPage('monitor')} icon={<Eye size={18}/>} label="Live Simulation" />
            <NavBtn active={currentPage==='history'} onClick={()=>setCurrentPage('history')} icon={<HistoryIcon size={18}/>} label="History" />
            <NavBtn active={currentPage==='admin'} onClick={()=>setCurrentPage('admin')} icon={<Shield size={18}/>} label="Admin Dashboard" />
          </>
        )}
        {user?.role === 'user' && (
          <NavBtn active={currentPage==='driver_app'} onClick={()=>setCurrentPage('driver_app')} icon={<Smartphone size={18}/>} label="Mobile App Demo" />
        )}
        <NavBtn active={currentPage==='about'} onClick={()=>setCurrentPage('about')} icon={<Info size={18}/>} label="About" />
     </div>
     <button onClick={onLogout} className="bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded text-sm font-medium transition flex items-center gap-2">
       <LogOut size={16}/> Logout
     </button>
  </nav>
);

const NavBtn = ({active, onClick, icon, label}) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
    {icon} {label}
  </button>
);

// =========================================================
//  PROCESSING PAGE — no sound/speech (admin side)
//  Sound/speech only happens in DriverAppPage for the driver
// =========================================================

// Violation Toast — visual only, no sound
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
      <style>{`@keyframes slideIn { from { transform: translateX(110%); opacity:0; } to { transform:none; opacity:1; } }`}</style>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <ShieldAlert size={18} style={{ color:'#ef4444' }} />
          <span style={{ color:'#ef4444', fontWeight:800, fontSize:13 }}>OVERSPEED VIOLATION</span>
        </div>
        <button onClick={onDismiss} style={{ background:'none', border:'none', cursor:'pointer', color:'#64748b' }}>
          <X size={15} />
        </button>
      </div>
      <div style={{ fontFamily:'monospace', fontSize:18, fontWeight:700, color:'#fca5a5', marginBottom:8, letterSpacing:2 }}>
        {violation.plate}
      </div>
      <div style={{ fontSize:12, color:'#cbd5e1', lineHeight:1.7 }}>
        <span style={{ color:'#f87171', fontWeight:700 }}>{violation.speed} km/h</span> detected · Limit: {violation.speed_limit} km/h<br/>
        Driver: <span style={{ color:'#e2e8f0' }}>{violation.driver_name || 'Unknown'}</span><br/>
        {violation.vehicle_make && violation.vehicle_make !== '—' && (
          <>{violation.vehicle_make} {violation.vehicle_model} · {violation.vehicle_color}<br/></>
        )}
      </div>
    </div>
  );
};

const ProcessingPage = ({ token }) => {
  const [file, setFile]           = useState(null);
  const [streamUrl, setStreamUrl] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [config, setConfig]       = useState({ limit: 60, dist: 20, zone: 'Processing Zone' });
  const [activeTab, setActiveTab] = useState('all');
  const [toast, setToast]         = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);

  const [liveStats, setLiveStats] = useState({
    total_vehicles: 0, total_violations: 0, avg_speed: 0, max_speed: 0,
    all_logs: [], overspeed_summary: [], violations: [], warnings: [],
  });

  // ── Polling — visual only, NO sound ─────────────────────────────────────────
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

        // Show toast for latest violation — NO beep, NO speech
        const violations = data.violations || data.overspeed_summary || [];
        const latest = violations[violations.length - 1];
        if (latest) {
          setToast(latest);
          setTimeout(() => setToast(null), 7000);
        }
      } catch (err) { console.error('[Processing] Poll error:', err); }
    }, 1000);

    return () => clearInterval(interval);
  }, [streamUrl]);

  // ── Upload & start ───────────────────────────────────────────────────────────
  const handleStart = async () => {
    if (!file) return alert('Please select a video file first.');
    setLoading(true);
    setToast(null);
    setLiveStats({ total_vehicles:0, total_violations:0, avg_speed:0, max_speed:0, all_logs:[], overspeed_summary:[], violations:[], warnings:[] });

    const formData = new FormData();
    formData.append('video', file);
    try {
      const res  = await fetch(`${API_ENDPOINT}/api/prepare-simulation`, { method:'POST', body:formData });
      const data = await res.json();
      if (res.ok) {
        const url = `${API_ENDPOINT}/video_feed/${data.filename}?save=true&user=${localStorage.getItem('username')||'admin'}&limit=${config.limit}&dist=${config.dist}&zone=${encodeURIComponent(config.zone)}`;
        setStreamUrl(url);
        setIsPlaying(true);
      } else { alert('Upload error: ' + (data.error || 'Unknown')); }
    } catch (e) { alert('Network error: ' + e.message); }
    setLoading(false);
  };

  const handleStop = () => {
    setStreamUrl(null);
    setIsPlaying(false);
    setToast(null);
  };

  const logs  = liveStats.all_logs         || [];
  const viols = liveStats.overspeed_summary || [];
  const shown = activeTab === 'all' ? logs : viols;

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes blink { 0%,100%{opacity:1}50%{opacity:0.3} }
        .blink { animation: blink 1.1s ease-in-out infinite; }
      `}</style>

      {/* Violation Toast — visual only */}
      {toast && <ViolationToast violation={toast} onDismiss={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20"><Activity className="text-blue-400 w-6 h-6"/></div>
            Real-time Video Processing
          </h1>
          <p className="text-slate-400 text-sm mt-1 ml-12">YOLOv8 · Speed Trap · OCR Plate Recognition · Auto Alert</p>
        </div>
        {isPlaying && (
          <div className="flex items-center gap-2 text-xs text-green-400 font-bold">
            <span className="blink w-2 h-2 rounded-full bg-green-400 inline-block"/>
            LIVE PROCESSING
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-4 rounded-xl text-white shadow-xl">
          <div className="flex items-center gap-2 text-blue-200 mb-1 text-sm"><Car size={16}/> Total Vehicles</div>
          <div className="text-3xl font-bold">{liveStats.total_vehicles}</div>
        </div>
        <div className="bg-gradient-to-br from-red-600 to-red-800 p-4 rounded-xl text-white shadow-xl">
          <div className="flex items-center gap-2 text-red-200 mb-1 text-sm"><AlertTriangle size={16}/> Violations</div>
          <div className="text-3xl font-bold">{liveStats.total_violations}</div>
        </div>
        <div className="bg-gradient-to-br from-green-600 to-green-800 p-4 rounded-xl text-white shadow-xl">
          <div className="flex items-center gap-2 text-green-200 mb-1 text-sm"><Activity size={16}/> Avg Speed</div>
          <div className="text-3xl font-bold">{liveStats.avg_speed} <span className="text-sm font-normal">km/h</span></div>
        </div>
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-4 rounded-xl text-white shadow-xl">
          <div className="flex items-center gap-2 text-purple-200 mb-1 text-sm"><Zap size={16}/> Max Speed</div>
          <div className="text-3xl font-bold">{liveStats.max_speed} <span className="text-sm font-normal">km/h</span></div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Config Panel */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl h-fit">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Settings size={16}/> Configuration</h3>
          <div className="space-y-3 mb-4">
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Speed Limit (km/h)</label>
              <input type="number" value={config.limit} onChange={e=>setConfig({...config, limit:e.target.value})} disabled={isPlaying}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white text-sm focus:border-blue-500 focus:outline-none disabled:opacity-50"/>
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Trap Distance (meters)</label>
              <input type="number" value={config.dist} onChange={e=>setConfig({...config, dist:e.target.value})} disabled={isPlaying}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white text-sm focus:border-blue-500 focus:outline-none disabled:opacity-50"/>
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Zone Name</label>
              <input type="text" value={config.zone} onChange={e=>setConfig({...config, zone:e.target.value})} disabled={isPlaying}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white text-sm focus:border-blue-500 focus:outline-none disabled:opacity-50"/>
            </div>
          </div>

          {/* File Drop */}
          <div className="border-2 border-dashed border-slate-600 rounded-xl p-6 text-center mb-4 hover:bg-slate-700/30 transition cursor-pointer relative">
            <input type="file" accept="video/*" onChange={e=>setFile(e.target.files[0])} disabled={isPlaying}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"/>
            <FileVideo className="w-10 h-10 text-blue-400 mx-auto mb-2"/>
            <div className="text-white font-medium text-sm">{file ? file.name : 'Drop video or click to select'}</div>
            {file && <div className="text-xs text-slate-500 mt-1">{(file.size/1024/1024).toFixed(1)} MB</div>}
          </div>

          {!isPlaying ? (
            <button onClick={handleStart} disabled={loading || !file}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 py-3 rounded-xl font-bold text-white transition shadow-lg flex justify-center items-center gap-2 disabled:opacity-50">
              {loading ? <><Loader size={16} className="animate-spin"/> Uploading...</> : <><Play size={16}/> Start Processing</>}
            </button>
          ) : (
            <button onClick={handleStop}
              className="w-full bg-red-600/20 border border-red-500/40 py-3 rounded-xl font-bold text-red-400 hover:bg-red-600/30 transition flex justify-center items-center gap-2">
              <StopCircle size={16}/> Stop
            </button>
          )}
        </div>

        {/* Video Feed */}
        <div className="lg:col-span-2 bg-black rounded-2xl overflow-hidden min-h-[420px] flex items-center justify-center relative border border-slate-700 shadow-2xl">
          {streamUrl ? (
            <>
              <img src={streamUrl} alt="Live stream" className="w-full h-full object-contain"/>
              {isPlaying && (
                <div className="absolute top-3 left-3 bg-red-600 px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-2 shadow-lg">
                  <span className="blink w-2 h-2 bg-white rounded-full inline-block"/>REC
                </div>
              )}
              <div className="absolute bottom-4 left-0 w-full text-center">
                <span className="bg-black/70 text-white px-4 py-1.5 rounded-full text-sm backdrop-blur-sm border border-white/10">
                  {isPlaying ? 'Processing in progress — results auto-saving to History' : 'Processing complete.'}
                </span>
              </div>
            </>
          ) : (
            <div className="text-slate-600 text-center">
              <Play className="w-16 h-16 mx-auto mb-4 opacity-30"/>
              <div className="text-sm">Upload a video and press Start</div>
              <div className="text-xs text-slate-700 mt-2">YOLOv8 · OCR · Speed Trap</div>
            </div>
          )}
        </div>
      </div>

      {/* Log Table + Detail Panel */}
      <div className={`grid gap-6 ${selectedEntry ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>

        {/* Log Table */}
        <div className={`bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden ${selectedEntry ? 'lg:col-span-2' : ''}`}>
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <div className="flex gap-2 bg-slate-900/50 border border-slate-700 rounded-xl p-1">
              {[['all', `All Vehicles (${logs.length})`], ['violations', `Violations (${viols.length})`]].map(([k, label]) => (
                <button key={k} onClick={() => setActiveTab(k)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${activeTab===k ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                  {label}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-500">Click row for driver details</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="text-xs text-slate-400 uppercase bg-slate-900/60 border-b border-slate-700">
                <tr>
                  {['ID','Plate No.','Speed','Driver Name','License No.','Vehicle','Status','Zone','Time'].map(h => (
                    <th key={h} className="px-4 py-3 font-semibold tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {shown.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                    {isPlaying ? 'Waiting for vehicles to cross detection lines…' : 'No data yet. Start processing to see results.'}
                  </td></tr>
                ) : shown.map((entry, i) => (
                  <tr key={`${entry.id}-${i}`}
                    onClick={() => setSelectedEntry(selectedEntry?.id === entry.id ? null : entry)}
                    className={`hover:bg-slate-700/30 cursor-pointer transition-colors ${entry.overspeed ? 'bg-red-500/5' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">#{entry.id}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-white bg-slate-900 border border-slate-600 px-2 py-0.5 rounded text-xs tracking-wider">
                        {entry.plate || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold" style={{color: entry.overspeed ? '#f87171' : '#34d399'}}>
                      {entry.speed} <span className="text-xs font-normal opacity-60">km/h</span>
                    </td>
                    <td className="px-4 py-3 text-slate-200 text-xs">{entry.driver_name || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{entry.driver_license_number || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {entry.vehicle_make && entry.vehicle_make !== '—' ? `${entry.vehicle_make} ${entry.vehicle_model}` : entry.label || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${entry.overspeed ? 'bg-red-500/20 text-red-400' : 'bg-green-500/15 text-green-400'}`}>
                        {entry.overspeed ? '🚨 VIOLATION' : '✓ OK'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{entry.zone || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 font-mono">{entry.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Driver Detail Panel */}
        {selectedEntry && (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Driver & Vehicle</span>
              <button onClick={() => setSelectedEntry(null)} className="text-slate-500 hover:text-white transition">
                <X size={16}/>
              </button>
            </div>

            {/* Plate Badge */}
            <div className={`rounded-xl p-3 mb-4 border ${selectedEntry.overspeed ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/20'}`}>
              <div className="font-mono text-lg font-bold text-white tracking-widest">{selectedEntry.plate || 'UNKNOWN'}</div>
              <div className={`text-xs mt-1 ${selectedEntry.overspeed ? 'text-red-400' : 'text-green-400'}`}>
                {selectedEntry.speed} km/h · {selectedEntry.overspeed
                  ? `${Math.round(selectedEntry.speed - (selectedEntry.speed_limit || config.limit))} km/h over limit`
                  : 'Within limit'}
              </div>
            </div>

            {/* Driver Info */}
            <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Driver</div>
            {[
              ['Name',    selectedEntry.driver_name],
              ['Contact', selectedEntry.driver_contact],
              ['License', selectedEntry.driver_license_number],
              ['Owner',   selectedEntry.owner_name],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-3 py-2 border-b border-slate-700/50">
                <span className="text-slate-500 text-xs w-16 flex-shrink-0">{label}</span>
                <span className="text-slate-200 text-xs">{value || '—'}</span>
              </div>
            ))}

            {/* Vehicle Info */}
            <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mt-4 mb-2">Vehicle</div>
            {[
              ['Make/Model', `${selectedEntry.vehicle_make || '—'} ${selectedEntry.vehicle_model || ''}`],
              ['Color',      selectedEntry.vehicle_color],
              ['Type',       selectedEntry.label],
              ['Zone',       selectedEntry.zone],
              ['Time',       selectedEntry.timestamp],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-3 py-2 border-b border-slate-700/50">
                <span className="text-slate-500 text-xs w-16 flex-shrink-0">{label}</span>
                <span className="text-slate-200 text-xs">{value || '—'}</span>
              </div>
            ))}

            {selectedEntry.overspeed && (
              <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-300 leading-relaxed">
                🚨 <strong>Challan Generated</strong><br/>
                Speed: {selectedEntry.speed} km/h · Limit: {selectedEntry.speed_limit || config.limit} km/h<br/>
                Excess: <strong>{Math.round(selectedEntry.speed - (selectedEntry.speed_limit || config.limit))} km/h over</strong>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// =========================================================
//  HISTORY PAGE
// =========================================================
const HistoryPage = ({token}) => {
    const [activeTab, setActiveTab] = useState('simulation');
    const [batchHistory, setBatchHistory] = useState([]);
    const [loadingBatch, setLoadingBatch] = useState(true);
    const [simLogs, setSimLogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLevel, setFilterLevel] = useState('All');
    const [filterZone, setFilterZone] = useState('All');

    const fetchBatchHistory = useCallback(() => {
        setLoadingBatch(true);
        fetch(`${API_ENDPOINT}/api/history`, {headers:{Authorization:`Bearer ${token}`}})
            .then(r => r.ok?r.json():[]).then(data => setBatchHistory(Array.isArray(data)?data:[]))
            .finally(() => setLoadingBatch(false));
    }, [token]);

    useEffect(() => {
        fetchBatchHistory();
        let savedLogs = JSON.parse(localStorage.getItem('smart_city_historical_logs') || '[]');
        if (savedLogs.length === 0) {
            const plates  = ["MH 01 AB 1234","DL 02 CD 5678","KA 03 EF 9012","TN 04 GH 3456","WB 05 IJ 7890","UP 14 MN 5678","RJ 14 OP 9012"];
            const drivers = ["Rajesh Kumar","Sunita Jain","Mahesh Gowda","Lakshmi Pillai","Biswajit Das","Sanjay Singh","Kailash Choudhary"];
            const phones  = ["+91-9876543210","+91-9988776655","+91-7653456789","+91-6544567890","+91-8989898989","+91-9871112233","+91-8899776655"];
            const zones   = ["School","Hospital","Highway"];
            const levels  = ["Safe Entry (Detected)","1st Warning (600m)","Final Warning (300m)","CHALLAN ISSUED (0m)"];
            const generated = Array.from({length:50}).map((_,i) => {
                const rnd = Math.floor(Math.random()*plates.length);
                const lvl = levels[Math.floor(Math.random()*levels.length)];
                const speed = lvl.includes("Safe") ? 25+Math.random()*15 : 45+Math.random()*40;
                const d = new Date(); d.setMinutes(d.getMinutes()-(i*14));
                return { id:`LOG-${1000+i}`, date:d.toISOString().split('T')[0], time:d.toTimeString().split(' ')[0],
                  camera:lvl.includes("600m")||lvl.includes("Safe")?"Cam 1":lvl.includes("300m")?"Cam 2":"Cam 3",
                  plate:plates[rnd], type:rnd>4?"Truck":"Car", driver:drivers[rnd], phone:phones[rnd],
                  license:plates[rnd].replace(/\s/g,'')+2020, zone:zones[Math.floor(Math.random()*zones.length)],
                  speed:speed.toFixed(1), level:lvl };
            });
            localStorage.setItem('smart_city_historical_logs', JSON.stringify(generated));
            savedLogs = generated;
        }
        setSimLogs(savedLogs);
    }, [fetchBatchHistory]);

    const filteredSimLogs = useMemo(() => simLogs.filter(log => {
        const s = searchTerm.toLowerCase();
        return (log.plate.toLowerCase().includes(s)||log.driver.toLowerCase().includes(s)||log.phone.toLowerCase().includes(s))
            && (filterLevel==='All'||log.level.includes(filterLevel))
            && (filterZone==='All'||log.zone===filterZone);
    }), [simLogs, searchTerm, filterLevel, filterZone]);

    return (
        <div className="space-y-6 pb-10">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-pink-500/10 rounded-lg border border-pink-500/20"><Database className="text-pink-400 w-6 h-6"/></div>
                Central Record Management
            </h1>
            <div className="flex gap-4 border-b border-slate-700 pb-2">
                <button onClick={()=>setActiveTab('simulation')} className={`pb-2 px-4 font-bold transition-colors ${activeTab==='simulation'?'text-pink-400 border-b-2 border-pink-400':'text-slate-500 hover:text-slate-300'}`}>Smart City Logs</button>
                <button onClick={()=>setActiveTab('batch')} className={`pb-2 px-4 font-bold transition-colors ${activeTab==='batch'?'text-blue-400 border-b-2 border-blue-400':'text-slate-500 hover:text-slate-300'}`}>File Processing History</button>
            </div>

            {activeTab==='simulation' && (
                <div className="space-y-6">
                    <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 flex flex-col lg:flex-row gap-4 justify-between items-center">
                        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4"/>
                                <input type="text" placeholder="Search Plate, Driver, Phone..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-600 rounded-xl text-sm text-white focus:ring-1 focus:ring-pink-500 w-full sm:w-64"/>
                            </div>
                            <select value={filterLevel} onChange={e=>setFilterLevel(e.target.value)} className="px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-xl text-sm text-white">
                                <option value="All">All Alert Levels</option><option value="Safe">Safe Entry</option>
                                <option value="600m">1st Warning</option><option value="300m">Final Warning</option><option value="CHALLAN">Challans</option>
                            </select>
                            <select value={filterZone} onChange={e=>setFilterZone(e.target.value)} className="px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-xl text-sm text-white">
                                <option value="All">All Zones</option><option value="School">School</option><option value="Hospital">Hospital</option><option value="Highway">Highway</option>
                            </select>
                        </div>
                        <button onClick={()=>convertToCSVAndDownload(filteredSimLogs,`SmartCity_Logs_${new Date().toISOString().split('T')[0]}.csv`)}
                            className="bg-green-600 hover:bg-green-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition w-full lg:w-auto justify-center">
                            <Download size={16}/> Export CSV
                        </button>
                    </div>
                    <div className="bg-slate-900/60 rounded-2xl border border-slate-700/50 overflow-x-auto shadow-2xl">
                        <table className="w-full text-sm text-left text-slate-300 min-w-max">
                            <thead className="text-xs text-slate-400 uppercase bg-slate-950/80 border-b border-slate-700">
                                <tr>{['Date & Time','Camera','Plate No.','Type','Driver Details','Speed','Zone','Status'].map(h=>(
                                    <th key={h} className="px-5 py-4">{h}</th>
                                ))}</tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {filteredSimLogs.map((log,i)=>(
                                    <tr key={i} className="hover:bg-slate-800/40 whitespace-nowrap">
                                        <td className="px-5 py-3"><div className="text-white">{log.date}</div><div className="text-xs text-slate-500">{log.time}</div></td>
                                        <td className="px-5 py-3 text-slate-400 font-mono text-xs">{log.camera}</td>
                                        <td className="px-5 py-3"><span className="font-mono bg-slate-950 border border-slate-700 px-2 py-1 rounded text-white">{log.plate}</span></td>
                                        <td className="px-5 py-3 text-slate-400">{log.type}</td>
                                        <td className="px-5 py-3"><div className="text-slate-200">{log.driver}</div><div className="text-xs text-slate-500">{log.phone}</div></td>
                                        <td className="px-5 py-3 font-bold" style={{color:log.speed>60?'#f87171':'#94a3b8'}}>{log.speed} km/h</td>
                                        <td className="px-5 py-3 text-slate-400">{log.zone}</td>
                                        <td className="px-5 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${log.level.includes("600m")?"bg-yellow-500/10 text-yellow-400 border border-yellow-500/30":log.level.includes("300m")?"bg-orange-500/10 text-orange-400 border border-orange-500/30":log.level.includes("Safe")?"bg-blue-500/10 text-blue-400 border border-blue-500/30":"bg-red-500/10 text-red-400 border border-red-500/30"}`}>
                                                {log.level}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredSimLogs.length===0 && <div className="text-center p-10 text-slate-500">No records match your filters.</div>}
                    </div>
                </div>
            )}

            {activeTab==='batch' && (
                <div className="space-y-4">
                    {loadingBatch ? <div className="text-center p-10 text-slate-400">Loading...</div> :
                    batchHistory.length===0 ? <div className="text-center p-10 bg-slate-800 rounded-xl text-slate-400">No file processing records found.</div> :
                    <div className="grid gap-6 md:grid-cols-2">{batchHistory.map(h=>(
                        <div key={h.id} className="bg-slate-800 p-6 rounded-xl text-white border border-slate-700 shadow-lg">
                            <div className="flex justify-between items-start mb-2"><div className="font-bold text-lg truncate">{h.original_filename}</div><div className="text-xs bg-slate-700 px-2 py-1 rounded">User: {h.user}</div></div>
                            <div className="text-sm text-slate-400 mb-4 flex items-center gap-2"><Clock size={14}/>{new Date(h.timestamp).toLocaleString()}</div>
                            <div className="grid grid-cols-4 gap-2 text-center text-sm mb-4">
                                <div className="bg-blue-900/40 p-2 rounded border border-blue-500/20"><div className="font-bold text-blue-400">{h.total_vehicles}</div>Vehicles</div>
                                <div className="bg-red-900/40 p-2 rounded border border-red-500/20"><div className="font-bold text-red-400">{h.total_violations}</div>Violations</div>
                                <div className="bg-orange-900/40 p-2 rounded border border-orange-500/20"><div className="font-bold text-orange-400">{h.overspeed_limit}</div>Limit</div>
                                <div className="bg-green-900/40 p-2 rounded border border-green-500/20"><div className="font-bold text-green-400">{h.distance_meters}m</div>Dist</div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={()=>convertToCSVAndDownload(h.all_logs,`logs_${h.download_name}.csv`)} className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 py-2 rounded text-sm transition"><FileText size={14}/>All Logs</button>
                                <button onClick={()=>convertToCSVAndDownload(h.overspeed_summary,`violations_${h.download_name}.csv`)} className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 py-2 rounded text-sm transition"><AlertTriangle size={14} className="text-red-400"/>Violations</button>
                            </div>
                        </div>
                    ))}</div>}
                </div>
            )}
        </div>
    );
};

// =========================================================
//  ADMIN DASHBOARD
// =========================================================
const StatBox = ({ label, value, icon, color }) => {
  const colorMap = {
    blue:   { border:'border-blue-500/20',   bg:'bg-blue-500/5',   iconText:'text-blue-400',   iconBg:'bg-blue-500/10' },
    green:  { border:'border-green-500/20',  bg:'bg-green-500/5',  iconText:'text-green-400',  iconBg:'bg-green-500/10' },
    red:    { border:'border-red-500/20',    bg:'bg-red-500/5',    iconText:'text-red-400',    iconBg:'bg-red-500/10' },
    purple: { border:'border-purple-500/20', bg:'bg-purple-500/5', iconText:'text-purple-400', iconBg:'bg-purple-500/10' },
  };
  const style = colorMap[color] || colorMap.blue;
  return (
    <div className={`p-6 rounded-2xl border ${style.border} ${style.bg} shadow-lg flex items-center justify-between`}>
      <div><p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{label}</p><p className="text-3xl font-black text-white">{value}</p></div>
      <div className={`p-3.5 rounded-xl ${style.iconBg} ${style.iconText}`}>{icon}</div>
    </div>
  );
};

const AdminDashboard = ({ token }) => {
  const [stats, setStats]           = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    setIsRefreshing(true);
    try {
      const statsRes  = await fetch(`${API_ENDPOINT}/api/stats`, { headers:{ Authorization:`Bearer ${token}` } });
      const statsData = await statsRes.json();
      setStats(statsData);
      const savedLogs = JSON.parse(localStorage.getItem('smart_city_historical_logs') || '[]');
      setRecentLogs(savedLogs.slice(0,15));
    } catch { setStats({ total_videos:0, total_vehicles:0, total_violations:0 }); }
    finally { setIsLoading(false); setIsRefreshing(false); }
  };

  useEffect(() => { fetchDashboardData(); const i=setInterval(fetchDashboardData,4000); return ()=>clearInterval(i); }, [token]);

  const violationsList    = recentLogs.filter(l=>l.level.includes("300m")||l.level.includes("CHALLAN"));
  const pushNotifications = recentLogs.filter(l=>!l.level.includes("Safe")).slice(0,5);
  const avgSpeed          = violationsList.length>0 ? (violationsList.reduce((a,c)=>a+Number(c.speed),0)/violationsList.length).toFixed(1) : '0.0';

  if (isLoading) return <div className="flex items-center justify-center p-20"><RefreshCw className="animate-spin text-blue-500 w-12 h-12"/></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3"><Shield className="text-blue-500"/> Admin Command Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time analytics and monitoring</p>
        </div>
        <button onClick={fetchDashboardData} disabled={isRefreshing}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl border border-slate-700 transition">
          <RefreshCw size={16} className={isRefreshing?"animate-spin text-blue-400":"text-blue-400"}/>
          {isRefreshing?"Syncing...":"Sync Live Logs"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatBox label="Total Videos"      value={stats?.total_videos||0}      icon={<FileVideo/>}    color="blue"/>
        <StatBox label="Total Vehicles"    value={stats?.total_vehicles||50}   icon={<Car/>}          color="green"/>
        <StatBox label="Violations Caught" value={stats?.total_violations||violationsList.length} icon={<AlertTriangle/>} color="red"/>
        <StatBox label="Avg Violator Speed" value={`${avgSpeed} km/h`}         icon={<Activity/>}    color="purple"/>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><TrendingUp size={20} className="text-red-400"/> Live Violations Stream</h2>
            <span className="text-xs bg-red-900/30 text-red-400 border border-red-900/50 px-2 py-1 rounded">Real-time</span>
          </div>
          {violationsList.length===0 ? (
            <div className="text-center py-12 text-slate-500 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">No violations yet. Run the simulation!</div>
          ) : violationsList.map((v,i)=>(
            <div key={i} className="flex items-center justify-between gap-3 p-4 bg-slate-900/60 border border-slate-700/50 rounded-xl mb-3">
              <div className="flex items-start gap-3">
                <div className="bg-red-950 text-red-400 p-2.5 rounded-lg"><AlertTriangle size={18}/></div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-white bg-yellow-500/10 border border-yellow-500/30 px-2 py-0.5 rounded">{v.plate}</span>
                    <span className="text-xs text-slate-300 capitalize">{v.type||"Car"}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Driver: <span className="text-slate-300 font-semibold">{v.driver||"N/A"}</span> ({v.phone||"N/A"})</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-red-400 font-bold text-sm">{v.speed} km/h</p>
                <p className="text-[10px] text-slate-500">{v.level}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl flex flex-col h-[480px]">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><MessageSquare size={18} className="text-blue-400"/> App Push Gateway</h2>
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"/>
          </div>
          <div className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl overflow-hidden flex flex-col">
            <div className="bg-slate-900 px-3 py-2 border-b border-slate-800 text-[10px] text-slate-400 font-mono flex justify-between">
              <span>FIREBASE_FCM_GATEWAY</span><span>LIVE FEED</span>
            </div>
            <div className="flex-1 p-3 overflow-y-auto space-y-3">
              {pushNotifications.length===0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 text-center">
                  <Smartphone size={32} className="opacity-20 mb-2"/><p className="text-xs">Waiting for alerts...</p>
                </div>
              ) : pushNotifications.map((log,i)=>(
                <div key={i} className="space-y-1">
                  <div className="text-[10px] text-blue-400 font-mono flex items-center gap-1"><Smartphone size={10}/><span>{log.phone}</span></div>
                  <div className="bg-slate-800 text-white border border-slate-700 rounded-2xl rounded-tl-none p-3 text-xs max-w-[90%]">
                    <strong className="text-yellow-400">Traffic Alert:</strong> Vehicle {log.plate} at {log.speed} km/h in {log.zone}. {log.level}.
                    <div className="flex justify-between mt-1 text-[9px] text-slate-400 border-t border-slate-700 pt-1">
                      <span>{log.time}</span><span className="text-green-400 font-mono">DELIVERED</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================
//  IMPORTS + APP ENTRY
// =========================================================
import LiveMonitorPage from './pages/LiveMonitorPage';
import DriverAppPage from './pages/DriverAppPage';
import ExternalAboutPage from './pages/AboutPage';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser]           = useState(null);
  const [currentPage, setCurrentPage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const u     = localStorage.getItem('username');
    const r     = localStorage.getItem('role');
    if (token && u) {
      setUser({username:u, role:r});
      setIsAuthenticated(true);
      if (!currentPage) setCurrentPage(r==='user'?'driver_app':'home');
    }
  }, [currentPage]);

  const handleLoginSuccess = (u) => {
    setUser({username:u.username, role:u.role});
    setIsAuthenticated(true);
    setCurrentPage(u.role==='user'?'driver_app':'home');
  };

  if (!isAuthenticated) return <LoginPage onLogin={handleLoginSuccess}/>;

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      <Navigation currentPage={currentPage} setCurrentPage={setCurrentPage} user={user}
        onLogout={()=>{ setIsAuthenticated(false); localStorage.clear(); setCurrentPage(''); }}/>
      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        {currentPage==='home'       && user?.role==='admin' && <ProcessingPage token={localStorage.getItem('token')}/>}
        {currentPage==='monitor'    && user?.role==='admin' && <LiveMonitorPage token={localStorage.getItem('token')}/>}
        {currentPage==='history'    && user?.role==='admin' && <HistoryPage key={user?.username} token={localStorage.getItem('token')}/>}
        {currentPage==='admin'      && user?.role==='admin' && <AdminDashboard token={localStorage.getItem('token')}/>}
        {currentPage==='driver_app' && user?.role==='user'  && <DriverAppPage/>}
        {currentPage==='about'      && <ExternalAboutPage/>}
      </div>
    </div>
  );
};

export default App;