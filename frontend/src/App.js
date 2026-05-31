import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Upload, Play, Loader, AlertTriangle, Download, Car, Activity, Zap, 
  FileVideo, TrendingUp, LogOut, User, Home, History as HistoryIcon, 
  Info, Menu, X, Shield, Eye, Trash2, Clock, Settings, Video, RefreshCw, 
  FileText, Square, Lock, MapPin, Bell, ShieldCheck, Database, Search, 
  Filter, Calendar, MessageSquare, Phone, CheckCircle, Smartphone
} from 'lucide-react';

const API_ENDPOINT = 'http://192.168.1.100:5000';
// const API_ENDPOINT = 'http://127.0.0.1:5000';
// --- UTILS ---
const convertToCSVAndDownload = (data, filename) => {
  if (!data || data.length === 0) return alert("No data to download");
  
  // Dynamic headers based on data structure
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      // Escape commas and quotes for CSV
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }
  
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
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

       <div className="relative z-10 w-full max-w-md p-8 m-4 bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl transform transition-all hover:scale-[1.01]">
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
             <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2">
                {isLoading ? <Loader className="animate-spin w-5 h-5"/> : "Access Portal"}
             </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-700/50 text-center">
             <p className="text-xs text-slate-500">Demo Credentials</p>
             <div className="flex flex-col gap-2 mt-3 text-xs font-mono text-slate-400">
                <div className="flex items-center justify-between bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-700">
                  <span>Admin Authority:</span>
                  <span className="text-blue-400">admin / admin123</span>
                </div>
                <div className="flex items-center justify-between bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-700">
                  <span>Citizen/Driver:</span>
                  <span className="text-green-400">user / user123</span>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}

// --- NAVIGATION ---
const Navigation = ({ currentPage, setCurrentPage, user, onLogout }) => (
  <nav className="bg-slate-800 p-4 text-white flex justify-between items-center sticky top-0 z-50 border-b border-slate-700 shadow-lg">
     <div className="flex items-center gap-2 font-bold text-xl"><Activity className="text-blue-400"/> Traffic AI</div>
     
     <div className="hidden md:flex gap-2">
        {/* ADMIN EXCLUSIVE TABS */}
        {user?.role === 'admin' && (
          <>
            <NavBtn active={currentPage==='home'} onClick={()=>setCurrentPage('home')} icon={<Home size={18}/>} label="Processing" />
            <NavBtn active={currentPage==='monitor'} onClick={()=>setCurrentPage('monitor')} icon={<Eye size={18}/>} label="Live Simulation" />
            <NavBtn active={currentPage==='history'} onClick={()=>setCurrentPage('history')} icon={<HistoryIcon size={18}/>} label="History" />
            <NavBtn active={currentPage==='admin'} onClick={()=>setCurrentPage('admin')} icon={<Shield size={18}/>} label="Admin Dashboard" />
          </>
        )}

        {/* CITIZEN/DRIVER EXCLUSIVE TABS */}
        {user?.role === 'user' && (
          <NavBtn active={currentPage==='driver_app'} onClick={()=>setCurrentPage('driver_app')} icon={<Smartphone size={18}/>} label="Mobile App Demo" />
        )}
        
        {/* UNIVERSAL TABS */}
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
//  NEW COMPREHENSIVE HISTORY DASHBOARD
// =========================================================
const HistoryPage = ({token}) => {
    const [activeTab, setActiveTab] = useState('simulation'); // 'simulation' or 'batch'
    
    // States for Batch History
    const [batchHistory, setBatchHistory] = useState([]);
    const [loadingBatch, setLoadingBatch] = useState(true);

    // States for Simulation History
    const [simLogs, setSimLogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLevel, setFilterLevel] = useState('All');
    const [filterZone, setFilterZone] = useState('All');

    // Fetch Batch History
    const fetchBatchHistory = useCallback(() => {
        setLoadingBatch(true);
        fetch(`${API_ENDPOINT}/api/history`, {headers:{Authorization:`Bearer ${token}`}})
            .then(r => r.ok?r.json():[])
            .then(data => setBatchHistory(Array.isArray(data)?data:[]))
            .finally(() => setLoadingBatch(false));
    }, [token]);

    // Load or Generate Simulation History Data for Presentation
    useEffect(() => {
        fetchBatchHistory();
        
        // Check if we have saved simulation logs, otherwise generate realistic demo data for the presentation
        let savedLogs = JSON.parse(localStorage.getItem('smart_city_historical_logs') || '[]');
        
        if (savedLogs.length === 0) {
            const plates = ["MH 01 AB 1234", "DL 02 CD 5678", "KA 03 EF 9012", "TN 04 GH 3456", "WB 05 IJ 7890", "UP 14 MN 5678", "RJ 14 OP 9012"];
            const drivers = ["Rajesh Kumar", "Sunita Jain", "Mahesh Gowda", "Lakshmi Pillai", "Biswajit Das", "Sanjay Singh", "Kailash Choudhary"];
            const phones = ["+91-9876543210", "+91-9988776655", "+91-7653456789", "+91-6544567890", "+91-8989898989", "+91-9871112233", "+91-8899776655"];
            const zones = ["School", "Hospital", "Highway"];
            const levels = ["Safe Entry (Detected)", "1st Warning (600m)", "Final Warning (300m)", "CHALLAN ISSUED (0m)"];
            
            const generated = Array.from({length: 50}).map((_, i) => {
                const rnd = Math.floor(Math.random() * plates.length);
                const lvl = levels[Math.floor(Math.random() * levels.length)];
                let speed = lvl.includes("Safe") ? 25 + Math.random()*15 : 45 + Math.random()*40;
                
                // Create random past time
                const d = new Date();
                d.setMinutes(d.getMinutes() - (i * 14)); // spread over the last few hours

                return {
                    id: `LOG-${1000 + i}`,
                    date: d.toISOString().split('T')[0],
                    time: d.toTimeString().split(' ')[0],
                    camera: lvl.includes("600m") || lvl.includes("Safe") ? "Cam 1" : lvl.includes("300m") ? "Cam 2" : "Cam 3",
                    plate: plates[rnd],
                    type: rnd > 4 ? "Truck" : "Car",
                    driver: drivers[rnd],
                    phone: phones[rnd],
                    license: plates[rnd].replace(/\s/g, '') + "2020",
                    zone: zones[Math.floor(Math.random() * zones.length)],
                    speed: speed.toFixed(1),
                    level: lvl
                };
            });
            localStorage.setItem('smart_city_historical_logs', JSON.stringify(generated));
            savedLogs = generated;
        }
        setSimLogs(savedLogs);
    }, [fetchBatchHistory]);

    // Filtering Logic for Simulation Logs
    const filteredSimLogs = useMemo(() => {
        return simLogs.filter(log => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = log.plate.toLowerCase().includes(searchLower) || 
                                  log.driver.toLowerCase().includes(searchLower) || 
                                  log.phone.toLowerCase().includes(searchLower);
            const matchesLevel = filterLevel === 'All' || log.level.includes(filterLevel);
            const matchesZone = filterZone === 'All' || log.zone === filterZone;
            
            return matchesSearch && matchesLevel && matchesZone;
        });
    }, [simLogs, searchTerm, filterLevel, filterZone]);

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
                        <div className="p-2 bg-pink-500/10 rounded-lg border border-pink-500/20"><Database className="text-pink-400 w-6 h-6"/></div> 
                        Central Record Management
                    </h1>
                    <p className="text-slate-400 text-sm mt-1 ml-12">Search, review, and export all historical tracking data</p>
                </div>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex gap-4 border-b border-slate-700 pb-2">
                <button onClick={() => setActiveTab('simulation')} className={`pb-2 px-4 font-bold transition-colors ${activeTab === 'simulation' ? 'text-pink-400 border-b-2 border-pink-400' : 'text-slate-500 hover:text-slate-300'}`}>
                    Smart City Logs (Virtual Feeds)
                </button>
                <button onClick={() => setActiveTab('batch')} className={`pb-2 px-4 font-bold transition-colors ${activeTab === 'batch' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500 hover:text-slate-300'}`}>
                    File Processing History (Batch)
                </button>
            </div>

            {/* TAB 1: SMART CITY SIMULATION LOGS */}
            {activeTab === 'simulation' && (
                <div className="space-y-6">
                    {/* FILTERS & EXPORT */}
                    <div className="bg-slate-800/60 backdrop-blur-md p-5 rounded-2xl border border-slate-700 shadow-lg flex flex-col lg:flex-row gap-4 justify-between items-center">
                        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input 
                                    type="text" placeholder="Search Plate, Driver, or Phone..." 
                                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-600 rounded-xl text-sm text-white focus:ring-1 focus:ring-pink-500 w-full sm:w-64"
                                />
                            </div>
                            <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} className="px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-xl text-sm text-white focus:ring-1 focus:ring-pink-500">
                                <option value="All">All Alert Levels</option>
                                <option value="Safe">Safe Entry</option>
                                <option value="600m">1st Warning (600m)</option>
                                <option value="300m">Final Warning (300m)</option>
                                <option value="CHALLAN">Challans Issued</option>
                            </select>
                            <select value={filterZone} onChange={e => setFilterZone(e.target.value)} className="px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-xl text-sm text-white focus:ring-1 focus:ring-pink-500">
                                <option value="All">All Zones</option>
                                <option value="School">School Zone</option>
                                <option value="Hospital">Hospital Zone</option>
                                <option value="Highway">Highway Zone</option>
                            </select>
                        </div>
                        <button 
                            onClick={() => convertToCSVAndDownload(filteredSimLogs, `SmartCity_Logs_${new Date().toISOString().split('T')[0]}.csv`)}
                            className="bg-green-600 hover:bg-green-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors w-full lg:w-auto justify-center shadow-lg"
                        >
                            <Download size={16} /> Export to Excel (.CSV)
                        </button>
                    </div>

                    {/* COMPREHENSIVE DATA TABLE */}
                    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-purple-500 opacity-50"></div>
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-sm text-left text-slate-300 min-w-max">
                                <thead className="text-xs text-slate-400 uppercase bg-slate-950/80 whitespace-nowrap border-b border-slate-700">
                                    <tr>
                                        <th className="px-5 py-4"><div className="flex items-center gap-1"><Calendar size={14}/> Date & Time</div></th>
                                        <th className="px-5 py-4"><div className="flex items-center gap-1"><Video size={14}/> Camera</div></th>
                                        <th className="px-5 py-4">Plate No.</th>
                                        <th className="px-5 py-4">Type</th>
                                        <th className="px-5 py-4"><div className="flex items-center gap-1"><User size={14}/> Driver Details</div></th>
                                        <th className="px-5 py-4">Speed</th>
                                        <th className="px-5 py-4">Zone</th>
                                        <th className="px-5 py-4">Status / Alert Level</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                    {filteredSimLogs.map((log, i) => (
                                        <tr key={i} className="hover:bg-slate-800/40 whitespace-nowrap transition-colors group">
                                            <td className="px-5 py-3">
                                                <div className="text-white font-medium">{log.date}</div>
                                                <div className="text-xs text-slate-500">{log.time}</div>
                                            </td>
                                            <td className="px-5 py-3 text-slate-400 font-mono text-xs">{log.camera}</td>
                                            <td className="px-5 py-3">
                                                <span className="text-white font-mono bg-slate-950/80 border border-slate-700 px-2.5 py-1 rounded shadow-sm">{log.plate}</span>
                                            </td>
                                            <td className="px-5 py-3 capitalize text-slate-400">{log.type}</td>
                                            <td className="px-5 py-3">
                                                <div className="text-slate-200 font-medium">{log.driver}</div>
                                                <div className="text-xs text-slate-500 font-mono">{log.phone} | DL: {log.license}</div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={`font-mono font-bold ${log.speed > 60 ? 'text-red-400' : 'text-slate-300'}`}>{log.speed} km/h</span>
                                            </td>
                                            <td className="px-5 py-3 text-slate-400">{log.zone}</td>
                                            <td className="px-5 py-3">
                                                <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase shadow-sm flex items-center w-max gap-1.5 ${
                                                    log.level.includes("600m") ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30" :
                                                    log.level.includes("300m") ? "bg-orange-500/10 text-orange-400 border border-orange-500/30" :
                                                    log.level.includes("Safe") ? "bg-blue-500/10 text-blue-400 border border-blue-500/30" :
                                                    "bg-red-500/10 text-red-400 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                                                }`}>
                                                    {log.level.includes("Safe") ? <ShieldCheck size={12}/> : <AlertTriangle size={12}/>}
                                                    {log.level}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredSimLogs.length === 0 && (
                                <div className="text-center p-10 text-slate-500 italic">No records match your filters.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: OLD BATCH PROCESSING HISTORY */}
            {activeTab === 'batch' && (
                <div className="space-y-4">
                    {loadingBatch ? <div className="text-center p-10 text-slate-400">Loading history...</div> : 
                    batchHistory.length === 0 ? <div className="text-center p-10 bg-slate-800 rounded-xl text-slate-400"><HistoryIcon className="mx-auto w-12 h-12 mb-2 opacity-50"/><p>No file processing records found.</p></div> : 
                    <div className="grid gap-6 md:grid-cols-2">{batchHistory.map(h => (
                        <div key={h.id} className="bg-slate-800/80 p-6 rounded-xl text-white border border-slate-700 shadow-lg relative overflow-hidden">
                            <div className="flex justify-between items-start mb-2"><div className="font-bold text-lg truncate flex-1" title={h.original_filename}>{h.original_filename}</div><div className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">User: {h.user}</div></div>
                            <div className="text-sm text-slate-400 mb-4 flex items-center gap-2"><Clock size={14}/> {new Date(h.timestamp).toLocaleString()}</div>
                            <div className="grid grid-cols-4 gap-2 text-center text-sm mb-4">
                                <div className="bg-blue-900/40 p-2 rounded border border-blue-500/20"><div className="font-bold text-blue-400">{h.total_vehicles}</div> Vehicles</div>
                                <div className="bg-red-900/40 p-2 rounded border border-red-500/20"><div className="font-bold text-red-400">{h.total_violations}</div> Violations</div>
                                <div className="bg-orange-900/40 p-2 rounded border border-orange-500/20"><div className="font-bold text-orange-400">{h.overspeed_limit}</div> Limit</div>
                                <div className="bg-green-900/40 p-2 rounded border border-green-500/20"><div className="font-bold text-green-400">{h.distance_meters}m</div> Dist</div>
                            </div>
                            <div className="flex flex-col gap-2">
                                {h.download_name && <a href={`${API_ENDPOINT}/download/${h.download_name}`} className="flex items-center justify-center gap-2 w-full text-center bg-blue-600 hover:bg-blue-500 py-2 rounded font-bold transition" download><FileVideo size={16}/> Download Video</a>}
                                <div className="flex gap-2">
                                    <button onClick={()=>convertToCSVAndDownload(h.all_logs, `logs_${h.download_name}.csv`)} className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 py-2 rounded text-sm transition"><FileText size={14}/> All Logs CSV</button>
                                    <button onClick={()=>convertToCSVAndDownload(h.overspeed_summary, `violations_${h.download_name}.csv`)} className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 py-2 rounded text-sm transition"><AlertTriangle size={14} className="text-red-400"/> Violations CSV</button>
                                </div>
                            </div>
                        </div>))}
                    </div>}
                </div>
            )}
        </div>
    );
}

// =========================================================
//  UPDATED ADMIN DASHBOARD (Modernized & Integrated)
// =========================================================
const StatBox = ({ label, value, icon, color }) => {
  const colorMap = {
    blue: { border: 'border-blue-500/20 hover:border-blue-500/40', bg: 'bg-blue-500/5', iconText: 'text-blue-400', iconBg: 'bg-blue-500/10' },
    green: { border: 'border-green-500/20 hover:border-green-500/40', bg: 'bg-green-500/5', iconText: 'text-green-400', iconBg: 'bg-green-500/10' },
    red: { border: 'border-red-500/20 hover:border-red-500/40', bg: 'bg-red-500/5', iconText: 'text-red-400', iconBg: 'bg-red-500/10' },
    purple: { border: 'border-purple-500/20 hover:border-purple-500/40', bg: 'bg-purple-500/5', iconText: 'text-purple-400', iconBg: 'bg-purple-500/10' }
  };
  const style = colorMap[color] || colorMap.blue;

  return (
    <div className={`p-6 rounded-2xl border ${style.border} ${style.bg} transition-all duration-300 shadow-lg flex items-center justify-between`}>
      <div className="space-y-1">
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-black text-white">{value}</p>
      </div>
      <div className={`p-3.5 rounded-xl ${style.iconBg} ${style.iconText}`}>
        {icon}
      </div>
    </div>
  );
};

const AdminDashboard = ({ token }) => {
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    setIsRefreshing(true);
    try {
      // Fetch high-level API stats
      const statsRes = await fetch(`${API_ENDPOINT}/api/stats`, { headers: { Authorization: `Bearer ${token}` } });
      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch simulated records from local storage (to act as the live unified database feed)
      const savedLogs = JSON.parse(localStorage.getItem('smart_city_historical_logs') || '[]');
      setRecentLogs(savedLogs.slice(0, 15)); // Get top 15 newest logs

    } catch (err) {
      console.error('Error loading admin dashboard stats:', err);
      setStats({ total_videos: 0, total_vehicles: 0, total_violations: 0, avg_speed: 0 });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 4000);
    return () => clearInterval(interval);
  }, [token]);

  // Derived filtered feeds
  const violationsList = recentLogs.filter(l => l.level.includes("300m") || l.level.includes("CHALLAN"));
  const pushNotifications = recentLogs.filter(l => !l.level.includes("Safe")).slice(0, 5); // Latest 5 alerts

  const calculateAvgSpeed = () => {
    if (violationsList && violationsList.length > 0) {
      const sum = violationsList.reduce((acc, curr) => acc + Number(curr.speed), 0);
      return (sum / violationsList.length).toFixed(1);
    }
    return '0.0';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4 text-white text-center">
        <RefreshCw className="animate-spin text-blue-500 w-12 h-12" />
        <p className="text-slate-400 font-medium">Fetching real-time analytics & system feeds...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header section with Refresh actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="text-blue-500" /> Admin Command Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time analytics, speed trap monitoring, and simulated Push Notification gateways.
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={isRefreshing}
          className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-medium px-4 py-2.5 rounded-xl border border-slate-700 transition"
        >
          <RefreshCw size={16} className={isRefreshing ? "animate-spin text-blue-400" : "text-blue-400"} />
          {isRefreshing ? "Syncing..." : "Sync Live Logs"}
        </button>
      </div>

      {/* Primary Analytics Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatBox label="Total Videos Evaluated" value={stats?.total_videos || 0} icon={<FileVideo />} color="blue" />
        <StatBox label="Database Vehicle Count" value={stats?.total_vehicles || 50} icon={<Car />} color="green" />
        <StatBox label="Violations Caught" value={stats?.total_violations || violationsList.length} icon={<AlertTriangle />} color="red" />
        <StatBox label="Avg Violator Speed" value={`${calculateAvgSpeed()} km/h`} icon={<Activity />} color="purple" />
      </div>

      {/* Two Column Layout for Live Terminal Streams */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left: Latest Violations Audit Stream (2/3 width) */}
        <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <TrendingUp size={20} className="text-red-400" /> Live Violations Stream
              </h2>
              <span className="text-xs bg-red-900/30 text-red-400 border border-red-900/50 px-2 py-1 rounded">
                Real-time DB Capture
              </span>
            </div>

            {violationsList.length === 0 ? (
              <div className="text-center py-12 text-slate-500 italic bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
                No major speeding violations logged in this session yet. Run the simulation!
              </div>
            ) : (
              <div className="space-y-3">
                {violationsList.map((v, i) => (
                  <div key={i} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-700/50 rounded-xl transition">
                    <div className="flex items-start gap-3">
                      <div className="bg-red-950 text-red-400 p-2.5 rounded-lg border border-red-900/40">
                        <AlertTriangle size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-extrabold text-white bg-yellow-500/10 border border-yellow-500/30 px-2 py-0.5 rounded">
                            {v.plate}
                          </span>
                          <span className="text-slate-500 text-xs">•</span>
                          <span className="text-xs font-medium text-slate-300 capitalize">{v.type || "Car"}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Driver: <span className="text-slate-300 font-semibold">{v.driver || "N/A"}</span> ({v.phone || "N/A"})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end md:self-center">
                      <div className="text-right">
                        <p className="text-red-400 font-bold text-sm">{v.speed} km/h</p>
                        <p className="text-[10px] text-slate-500">{v.level}</p>
                      </div>
                      <div className="bg-green-950/40 text-green-400 border border-green-900/50 px-2 py-1 rounded-md text-[10px] font-semibold flex items-center gap-1.5">
                        <CheckCircle size={10} /> Saved to DB
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 p-3 bg-blue-950/40 border border-blue-900/40 text-blue-300 text-xs rounded-xl">
            💡 <strong>Note to Presenter:</strong> Latest violations are automatically pushed into your local JSON store database, which acts as persistent source-of-truth.
          </div>
        </div>

        {/* Right: Simulated App Push Notification Gateway Feed (1/3 width) */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl flex flex-col h-[480px]">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MessageSquare size={18} className="text-blue-400" /> App Push Gateway
            </h2>
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
          </div>

          <div className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl overflow-hidden flex flex-col">
            <div className="bg-slate-900 px-3 py-2 border-b border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>FIREBASE_FCM_GATEWAY</span>
              <span>LIVE FEED</span>
            </div>

            <div className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar">
              {pushNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 text-center p-4">
                  <Smartphone size={32} className="opacity-20 text-slate-400 mb-2"/>
                  <p className="text-xs font-medium mt-2">Waiting for simulation alerts...</p>
                  <p className="text-[10px] text-slate-700 mt-1">Push notifications will populate here live.</p>
                </div>
              ) : (
                pushNotifications.map((log, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] text-blue-400 font-mono">
                      <Smartphone size={10} />
                      <span>{log.phone} (Device App)</span>
                    </div>

                    <div className="bg-slate-800 text-white border border-slate-700 rounded-2xl rounded-tl-none p-3 shadow-md max-w-[90%] text-xs relative">
                      <p className="leading-relaxed font-sans">
                        <strong className="text-yellow-400">Traffic Alert:</strong> Vehicle {log.plate} detected at {log.speed} km/h in {log.zone} Zone. {log.level}.
                      </p>
                      
                      <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-700 text-[9px] text-slate-400">
                        <span className="flex items-center gap-0.5">
                          <Clock size={8} /> {log.time}
                        </span>
                        <span className="text-green-400 font-mono font-bold text-[8px]">
                          DELIVERED
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// --- ABOUT PAGE PLACEHOLDER ---
const AboutPage = () => (
  <div className="space-y-6">
    <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl">
      <h1 className="text-3xl font-bold mb-4 flex items-center gap-3 text-white"><Info className="text-blue-400" size={32} /> About System</h1>
      <p className="text-slate-300">This content is handled by your separate AboutPage.js component. Ensure it's imported if you have moved it to its own file.</p>
    </div>
  </div>
);

// --- PROCESSING PAGE (Batch) ---
const LogTableReal = ({title, data, icon, color}) => (
    <div className={`bg-slate-800 rounded-2xl border border-${color}-700 overflow-hidden`}>
       <div className={`p-4 bg-${color}-900/20 font-bold text-white border-b border-slate-700 flex justify-between items-center`}>
           <span className="flex items-center gap-2">{icon} {title}</span><span className="text-xs bg-slate-700 px-2 py-1 rounded">{data?.length || 0}</span>
       </div>
       <div className="h-64 overflow-y-auto p-2 custom-scrollbar">
           <table className="w-full text-sm text-left text-slate-300">
               <thead className="text-xs text-slate-400 uppercase bg-slate-700/30"><tr><th className="px-3 py-2">ID</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Speed</th></tr></thead>
               <tbody>
                   {[...(data || [])].reverse().map((log, i) => (
                       <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                           <td className="px-3 py-2">{log.id}</td><td className="px-3 py-2">{log.label}</td><td className={`px-3 py-2 font-bold ${log.overspeed?'text-red-400':'text-green-400'}`}>{log.speed} km/h</td>
                       </tr>
                   ))}
               </tbody>
           </table>
       </div>
   </div>
);

const ProcessingPage = ({ token }) => {
  const [file, setFile] = useState(null);
  const [streamUrl, setStreamUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false); 
  const [config, setConfig] = useState({ limit: 60, dist: 20 });
  const [liveStats, setLiveStats] = useState({ total_vehicles: 0, total_violations: 0, avg_speed: 0, max_speed: 0, all_logs: [], overspeed_summary: [] });
  
  useEffect(() => {
     if (!streamUrl) return;
     const match = streamUrl.match(/\/video_feed\/([^\?]+)/);
     if (!match) return;
     const filename = match[1];
     const interval = setInterval(() => {
        fetch(`${API_ENDPOINT}/api/stream-status/${filename}`).then(res => res.json()).then(data => setLiveStats(data)).catch(err => console.error(err));
     }, 1000); 
     return () => clearInterval(interval);
  }, [streamUrl]);

  const handleUploadAndStart = async () => {
     if(!file) return alert("Select a file");
     setLoading(true);
     setLiveStats({ total_vehicles: 0, total_violations: 0, avg_speed: 0, max_speed: 0, all_logs: [], overspeed_summary: [] }); 
     const formData = new FormData();
     formData.append('video', file);
     try {
        const res = await fetch(`${API_ENDPOINT}/api/prepare-simulation`, { method: 'POST', body: formData });
        const data = await res.json();
        if(res.ok) {
            setStreamUrl(`${API_ENDPOINT}/video_feed/${data.filename}?save=true&user=${localStorage.getItem('username')}&limit=${config.limit}&dist=${config.dist}`);
            setIsPlaying(true); 
        } else { alert("Error: " + data.error); }
     } catch(e) { alert("Error uploading file"); }
     setLoading(false);
  };

  return (
    <div className="space-y-6">
       <h1 className="text-3xl font-bold text-white flex items-center gap-3"><Home className="text-blue-400"/> Immediate Processing</h1>
       
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-4 rounded-xl shadow-xl text-white"><div className="flex items-center gap-2 text-blue-200 mb-1 text-sm"><Car size={16}/> Total Vehicles</div><div className="text-3xl font-bold">{liveStats.total_vehicles || 0}</div></div>
          <div className="bg-gradient-to-br from-red-600 to-red-800 p-4 rounded-xl shadow-xl text-white"><div className="flex items-center gap-2 text-red-200 mb-1 text-sm"><AlertTriangle size={16}/> Violations</div><div className="text-3xl font-bold">{liveStats.total_violations || 0}</div></div>
          <div className="bg-gradient-to-br from-green-600 to-green-800 p-4 rounded-xl shadow-xl text-white"><div className="flex items-center gap-2 text-green-200 mb-1 text-sm"><Activity size={16}/> Avg Speed</div><div className="text-3xl font-bold">{liveStats.avg_speed || 0} <span className="text-sm font-normal">km/h</span></div></div>
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-4 rounded-xl shadow-xl text-white"><div className="flex items-center gap-2 text-purple-200 mb-1 text-sm"><Zap size={16}/> Max Speed</div><div className="text-3xl font-bold">{liveStats.max_speed || 0} <span className="text-sm font-normal">km/h</span></div></div>
       </div>

       <div className="grid lg:grid-cols-3 gap-6">
          <div className="bg-slate-800 p-6 rounded-2xl h-fit border border-slate-700 shadow-xl">
             <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Settings size={16}/> Configuration</h3>
             <div className="space-y-3 mb-6">
                <div><label className="text-xs text-slate-400">Speed Limit (km/h)</label><input type="number" value={config.limit} onChange={e=>setConfig({...config, limit:e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm"/></div>
                <div><label className="text-xs text-slate-400">Distance (meters)</label><input type="number" value={config.dist} onChange={e=>setConfig({...config, dist:e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm"/></div>
             </div>
             <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center mb-6 hover:bg-slate-700/50 transition cursor-pointer relative">
                <input type="file" accept="video/*" onChange={e=>setFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"/>
                <FileVideo className="w-12 h-12 text-blue-400 mx-auto mb-2"/><div className="text-white font-bold">{file ? file.name : "Select Video"}</div>
             </div>
             <button onClick={handleUploadAndStart} disabled={loading||!file||isPlaying} className="w-full bg-blue-600 py-3 rounded-xl font-bold text-white hover:bg-blue-500 disabled:opacity-50 transition shadow-lg flex justify-center items-center">
                {loading ? <Loader className="animate-spin mx-auto"/> : isPlaying ? <><Loader className="animate-spin mr-2 w-4 h-4"/> Processing...</> : "Start Processing"}
             </button>
          </div>
          <div className="lg:col-span-2 bg-black rounded-2xl overflow-hidden min-h-[400px] flex items-center justify-center relative border border-slate-700 shadow-2xl">
             {streamUrl ? (
                <><img src={streamUrl} alt="Stream" className="w-full h-full object-contain" onError={() => setIsPlaying(false)} />
                   {isPlaying && <div className="absolute top-4 left-4 bg-red-600 px-3 py-1 rounded-full text-xs font-bold text-white animate-pulse flex items-center gap-2 shadow-lg"><div className="w-2 h-2 bg-white rounded-full"></div> REC</div>}
                   <div className="absolute bottom-4 left-0 w-full text-center"><span className="bg-black/70 text-white px-4 py-1 rounded-full text-sm backdrop-blur-sm border border-white/10">{isPlaying ? "Results are being saved to History..." : "Processing Complete."}</span></div>
                </>
             ) : (<div className="text-slate-600 text-center"><Play className="w-16 h-16 mx-auto mb-4 opacity-50"/><div>Waiting for video...</div></div>)}
          </div>
       </div>

       <div className="grid lg:grid-cols-2 gap-6">
           <LogTableReal title="Total Vehicle Logs" data={liveStats.all_logs} icon={<Car className="text-green-400"/>} color="slate" />
           <LogTableReal title="Violation Logs" data={liveStats.overspeed_summary} icon={<AlertTriangle className="text-red-400"/>} color="red" />
       </div>
    </div>
  );
};

// --- APP ENTRY COMPONENT ---
// NOTE: I am referencing your custom LiveMonitorPage and DriverAppPage and AboutPage here.
// Assuming they are in the 'pages' directory as you've set up previously.
import LiveMonitorPage from './pages/LiveMonitorPage';
import DriverAppPage from './pages/DriverAppPage'; 
import ExternalAboutPage from './pages/AboutPage';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('');

  useEffect(() => {
     const token = localStorage.getItem('token');
     const u = localStorage.getItem('username');
     const r = localStorage.getItem('role');
     if(token && u) { 
         setUser({username:u, role:r}); 
         setIsAuthenticated(true); 
         if (!currentPage) setCurrentPage(r === 'user' ? 'driver_app' : 'home');
     }
  }, [currentPage]);

  const handleLoginSuccess = (u) => {
    setUser({username: u.username, role: u.role});
    setIsAuthenticated(true);
    setCurrentPage(u.role === 'user' ? 'driver_app' : 'home');
  };

  if (!isAuthenticated) return <LoginPage onLogin={handleLoginSuccess} />;

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      <Navigation currentPage={currentPage} setCurrentPage={setCurrentPage} user={user} onLogout={()=>{setIsAuthenticated(false); localStorage.clear(); setCurrentPage('');}} />
      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        {/* ADMIN ROUTES */}
        {currentPage === 'home' && user?.role === 'admin' && <ProcessingPage token={localStorage.getItem('token')} />}
        {currentPage === 'monitor' && user?.role === 'admin' && <LiveMonitorPage token={localStorage.getItem('token')} />}
        {currentPage === 'history' && user?.role === 'admin' && <HistoryPage key={user?.username} token={localStorage.getItem('token')} />}
        {currentPage === 'admin' && user?.role === 'admin' && <AdminDashboard token={localStorage.getItem('token')} />}
        
        {/* DRIVER ROUTE */}
        {currentPage === 'driver_app' && user?.role === 'user' && <DriverAppPage />}
        
        {/* SHARED ROUTE */}
        {currentPage === 'about' && <ExternalAboutPage />}
      </div>
    </div>
  );
};

export default App;