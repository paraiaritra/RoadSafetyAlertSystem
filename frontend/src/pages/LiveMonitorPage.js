import React, { useState, useEffect, useRef } from 'react';
import { Play, AlertTriangle, Video, Bell, MapPin, Square, Info, Activity, ShieldCheck, Car, Crosshair } from 'lucide-react';

const API_ENDPOINT = 'http://127.0.0.1:5000';

// Premium sleek table component
const VirtualLogTable = ({title, data, icon, color}) => (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl relative">
       {/* Glowing top border accent */}
       <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-${color}-500 to-transparent opacity-50`}></div>
       
       <div className="p-5 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/30">
           <span className={`flex items-center gap-3 font-semibold tracking-wide text-${color}-400`}>
               {icon} {title}
           </span>
           <span className="text-xs font-mono bg-slate-950 px-3 py-1.5 rounded-full border border-slate-700 text-slate-300 shadow-inner flex items-center gap-2">
               <span className={`w-2 h-2 rounded-full bg-${color}-500 animate-pulse`}></span>
               {data?.length || 0} Records
           </span>
       </div>
       
       <div className="h-72 overflow-y-auto overflow-x-auto p-0 custom-scrollbar">
           <table className="w-full text-sm text-left text-slate-300 min-w-max">
               <thead className="text-xs text-slate-400 uppercase bg-slate-950/50 whitespace-nowrap sticky top-0 z-10 backdrop-blur-md">
                   <tr>
                       <th className="px-5 py-4 font-semibold tracking-wider">Time</th>
                       <th className="px-5 py-4 font-semibold tracking-wider">Plate</th>
                       <th className="px-5 py-4 font-semibold tracking-wider">Type</th>
                       <th className="px-5 py-4 font-semibold tracking-wider">Driver Name</th>
                       <th className="px-5 py-4 font-semibold tracking-wider">Speed</th>
                       <th className="px-5 py-4 font-semibold tracking-wider">Alert Level</th>
                       <th className="px-5 py-4 font-semibold tracking-wider">Phone No.</th>
                       <th className="px-5 py-4 font-semibold tracking-wider">License No.</th>
                       <th className="px-5 py-4 font-semibold tracking-wider">Zone</th>
                   </tr>
               </thead>
               <tbody className="divide-y divide-slate-800/60">
                   {(data || []).map((log, i) => (
                       <tr key={i} className="hover:bg-slate-800/40 whitespace-nowrap transition-all duration-200 group">
                           <td className="px-5 py-3 text-slate-500 font-mono text-xs">{log.timestamp}</td>
                           <td className="px-5 py-3">
                               <span className="text-white font-mono bg-slate-950/80 border border-slate-700 px-2.5 py-1 rounded shadow-sm group-hover:border-blue-500/50 transition-colors">
                                   {log.plate}
                               </span>
                           </td>
                           <td className="px-5 py-3 capitalize text-slate-400">{log.type || 'N/A'}</td>
                           <td className="px-5 py-3 text-slate-200 font-medium">{log.driver || 'Unknown'}</td>
                           <td className="px-5 py-3">
                               <span className={`font-mono font-bold ${log.speed > 60 ? 'text-red-400' : 'text-slate-300'}`}>
                                   {log.speed} <span className="text-[10px] text-slate-500">km/h</span>
                               </span>
                           </td>
                           <td className="px-5 py-3">
                               <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase shadow-sm flex items-center w-max gap-1.5 ${
                                   log.level.includes("600m") ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30" :
                                   log.level.includes("300m") ? "bg-orange-500/10 text-orange-400 border border-orange-500/30" :
                                   log.level.includes("Detected") ? "bg-blue-500/10 text-blue-400 border border-blue-500/30" :
                                   "bg-red-500/10 text-red-400 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                               }`}>
                                   {log.level.includes("Detected") ? <ShieldCheck size={12}/> : <AlertTriangle size={12}/>}
                                   {log.level}
                               </span>
                           </td>
                           <td className="px-5 py-3 text-slate-400 font-mono text-xs">{log.driver_contact || 'N/A'}</td>
                           <td className="px-5 py-3 text-slate-400 font-mono text-xs uppercase">{log.driver_license_number || log.license || 'N/A'}</td>
                           <td className="px-5 py-3 text-slate-400 text-xs">{log.zone}</td>
                       </tr>
                   ))}
               </tbody>
           </table>
           {(!data || data.length === 0) && (
               <div className="flex flex-col justify-center items-center h-48 text-slate-600 gap-3">
                   <Activity className="w-8 h-8 opacity-20 animate-pulse"/>
                   <span className="text-sm tracking-wide">Monitoring feed for incoming data...</span>
               </div>
           )}
       </div>
   </div>
);

// Premium Stat Box Component
const StatBox = ({ label, value, icon, color, trend }) => (
    <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-700/50 shadow-lg relative overflow-hidden group">
        <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 group-hover:bg-${color}-500/20 transition-all`}></div>
        <div className="flex justify-between items-start relative z-10">
            <div>
                <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">{label}</div>
                <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
            </div>
            <div className={`p-3 bg-${color}-500/10 rounded-xl border border-${color}-500/20 text-${color}-400 shadow-inner`}>
                {icon}
            </div>
        </div>
    </div>
);

const LiveMonitorPage = () => {
  const [streamUrl, setStreamUrl] = useState(null);
  const [liveStats, setLiveStats] = useState({ all_logs: [], warnings: [], violations: [] });
  const [isPlaying, setIsPlaying] = useState(false);
  
  const zones = { School: { limit: 30 }, Hospital: { limit: 40 }, Highway: { limit: 80 } };
  const [selectedZone, setSelectedZone] = useState('School');
  const [config, setConfig] = useState({ limit: 30 }); 

  useEffect(() => { setConfig({ limit: zones[selectedZone].limit }); }, [selectedZone]);

  useEffect(() => {
     if (!streamUrl) return;
     const filename = "virtual_simulation";
     const interval = setInterval(() => {
        fetch(`${API_ENDPOINT}/api/stream-status/${filename}`)
           .then(res => res.json())
           .then(data => { if(data && (data.warnings || data.all_logs)) setLiveStats(data); })
           .catch(err => console.error(err));
     }, 1000);
     return () => clearInterval(interval);
  }, [streamUrl]);
  
  const handleStart = async () => {
      setIsPlaying(true);
      setLiveStats({ all_logs: [], warnings: [], violations: [] });
      setStreamUrl(`${API_ENDPOINT}/video_feed/virtual_simulation?zone=${selectedZone}&limit=${config.limit}`);
  };

  const handleStop = () => {
      setStreamUrl(null);
      setIsPlaying(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
                    <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20"><Video className="text-blue-400 w-6 h-6"/></div> 
                    Live Tracking Matrix
                </h1>
                <p className="text-slate-400 text-sm mt-1 ml-12">Multi-camera automated enforcement system</p>
            </div>
            
            {isPlaying && (
                <div className="flex items-center gap-3 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <span className="text-red-400 text-xs font-bold tracking-widest uppercase">System Armed</span>
                </div>
            )}
        </div>
        
        {/* TOP CONFIGURATION SECTION (Stacked layout restored) */}
        <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end mb-4">
                <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1"><MapPin size={14}/> Surveillance Zone</label>
                    <select value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)} disabled={isPlaying} 
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner outline-none disabled:opacity-50 appearance-none">
                        <option value="School">School Zone (Limit: 30 km/h)</option>
                        <option value="Hospital">Hospital Zone (Limit: 40 km/h)</option>
                        <option value="Highway">Express Highway (Limit: 80 km/h)</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2 block">Enforced Limit (km/h)</label>
                    <input type="number" value={config.limit} disabled={isPlaying} onChange={e=>setConfig({...config, limit:e.target.value})} 
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner outline-none disabled:opacity-50 font-mono" />
                </div>
                
                <div>
                    {!isPlaying ? (
                        <button onClick={handleStart} className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 p-3.5 rounded-xl font-bold text-white transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] flex justify-center items-center transform hover:-translate-y-0.5">
                            <Play size={18} className="mr-2 fill-current"/> Initialize Cameras
                        </button>
                    ) : (
                        <button onClick={handleStop} className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 p-3.5 rounded-xl font-bold text-white transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] flex justify-center items-center">
                            <Square size={18} className="mr-2 fill-current"/> Terminate Feed
                        </button>
                    )}
                </div>
            </div>
            
            {/* System Info Box */}
            <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-xl flex items-start gap-3 backdrop-blur-sm mt-2">
                <Info className="min-w-[20px] mt-0.5 text-blue-400" size={20} />
                <p className="text-xs text-blue-200/80 leading-relaxed">
                    <strong className="text-blue-300">Automated Enforcement Logic:</strong> 
                    Feed stitches 3 cameras together. Vehicles spawn in Cam 1 (600m). Non-compliant drivers are tracked through Cam 2 (300m) and finally to Cam 3 (Enforcement).
                </p>
            </div>
        </div>

        {/* FULL-WIDTH VIDEO DISPLAY */}
        <div className="space-y-4">
            <div className="w-full bg-slate-950 rounded-2xl overflow-hidden aspect-video max-h-[65vh] flex items-center justify-center border border-slate-700/50 shadow-[0_0_40px_rgba(0,0,0,0.5)] relative group">
                
                {/* CCTV Overlay Effects */}
                <div className="absolute inset-0 pointer-events-none border-[1px] border-white/5 z-20"></div>
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.4)_100%)] z-20"></div>
                
                {/* Crosshairs for aesthetics */}
                <Crosshair className="absolute top-4 left-4 text-white/20 w-6 h-6 z-20" strokeWidth={1} />
                <Crosshair className="absolute top-4 right-4 text-white/20 w-6 h-6 z-20" strokeWidth={1} />
                <Crosshair className="absolute bottom-4 left-4 text-white/20 w-6 h-6 z-20" strokeWidth={1} />
                <Crosshair className="absolute bottom-4 right-4 text-white/20 w-6 h-6 z-20" strokeWidth={1} />

                {/* Camera Headers Overlay */}
                <div className="absolute top-0 left-0 w-full flex bg-slate-950/80 backdrop-blur-md border-b border-slate-800 z-30">
                    <div className="flex-1 text-center py-2.5 border-r border-slate-800">
                        <div className="text-white font-semibold text-xs tracking-widest uppercase opacity-80">CAM 01</div>
                        <div className="text-yellow-400 text-[10px] mt-0.5 font-bold tracking-widest">600m WARNING</div>
                    </div>
                    <div className="flex-1 text-center py-2.5 border-r border-slate-800">
                        <div className="text-white font-semibold text-xs tracking-widest uppercase opacity-80">CAM 02</div>
                        <div className="text-orange-400 text-[10px] mt-0.5 font-bold tracking-widest">300m WARNING</div>
                    </div>
                    <div className="flex-1 text-center py-2.5">
                        <div className="text-white font-semibold text-xs tracking-widest uppercase opacity-80">CAM 03</div>
                        <div className="text-red-400 text-[10px] mt-0.5 font-bold tracking-widest">ENFORCEMENT (0m)</div>
                    </div>
                </div>

                {streamUrl ? (
                    <>
                        <img src={streamUrl} alt="Stream" className="w-full h-full object-cover pt-12 z-10 relative" onError={() => setIsPlaying(false)} />
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-900/80 backdrop-blur border border-slate-700 px-4 py-1.5 rounded-full text-[10px] font-mono text-slate-400 shadow-lg z-30 flex items-center gap-3">
                            <span>REC • {new Date().toISOString().split('T')[0]}</span>
                            <span className="w-1 h-1 bg-slate-500 rounded-full"></span>
                            <span>FPS: 30.0</span>
                            <span className="w-1 h-1 bg-slate-500 rounded-full"></span>
                            <span>NET: OK</span>
                        </div>
                    </>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 z-10 bg-slate-900/20">
                        <Video className="w-16 h-16 mb-4 opacity-30"/>
                        <span className="text-sm tracking-widest uppercase font-semibold">Feed Offline</span>
                        <span className="text-xs mt-2 opacity-50 font-mono">Awaiting initialization command</span>
                    </div>
                )}
            </div>

            {/* MINI STATS UNDER VIDEO */}
            <div className="grid grid-cols-2 gap-4 mt-2">
                <StatBox label="Active Warnings" value={liveStats.warnings?.length || 0} icon={<Bell size={24}/>} color="yellow" />
                <StatBox label="Challans Issued" value={liveStats.violations?.length || 0} icon={<AlertTriangle size={24}/>} color="red" />
            </div>
        </div>

        {/* BOTTOM SECTION: Log Tables */}
        <div className="flex flex-col gap-6 pt-4">
           <VirtualLogTable title="Network Entry Log (Cam 1)" data={liveStats.all_logs} icon={<Car size={18}/>} color="blue" />
           <VirtualLogTable title="Active Warnings (600m & 300m)" data={liveStats.warnings} icon={<Bell size={18}/>} color="yellow" />
           <VirtualLogTable title="Enforcement Log (Challans Issued)" data={liveStats.violations} icon={<AlertTriangle size={18}/>} color="red" />
        </div>
    </div>
  );
};

export default LiveMonitorPage;