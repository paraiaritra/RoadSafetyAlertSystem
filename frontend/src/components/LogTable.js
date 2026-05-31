import React from 'react';

const LogTable = ({ title, data, icon, color, showPlate = false, showDetails = false }) => {
  // Safe Tailwind color maps to avoid dynamic string purges in compilation
  const themeStyles = {
    red: {
      border: 'border-red-500/30',
      headerBg: 'bg-red-500/10',
      badgeBg: 'bg-red-500/20 text-red-300 border border-red-500/30'
    },
    slate: {
      border: 'border-slate-700/80',
      headerBg: 'bg-slate-700/30',
      badgeBg: 'bg-slate-700/50 text-slate-300 border border-slate-700/60'
    }
  };

  const style = themeStyles[color] || themeStyles.slate;

  return (
    <div className={`bg-slate-800 rounded-2xl border ${style.border} overflow-hidden shadow-xl flex flex-col`}>
      {/* Table Header Section */}
      <div className={`p-4 ${style.headerBg} font-bold text-white border-b border-slate-700/60 flex justify-between items-center flex-shrink-0`}>
        <span className="flex items-center gap-2 text-sm sm:text-base font-semibold">
          {icon} {title}
        </span>
        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${style.badgeBg}`}>
          {data?.length || 0}
        </span>
      </div>
      
      {/* Table Body Wrapper with horizontal and vertical scrollbars */}
      <div className="h-72 overflow-y-auto overflow-x-auto p-2 custom-scrollbar">
        <table className="w-full text-xs sm:text-sm text-left text-slate-300 min-w-[750px]">
          <thead className="text-xs text-slate-400 uppercase bg-slate-900/40 sticky top-0 backdrop-blur z-10">
            <tr>
              <th className="px-4 py-2.5 rounded-l-lg whitespace-nowrap">ID</th>
              {showPlate && <th className="px-4 py-2.5 whitespace-nowrap">Plate</th>}
              <th className="px-4 py-2.5 whitespace-nowrap">Type</th>
              <th className="px-4 py-2.5 whitespace-nowrap">Speed</th>
              {showDetails && <th className="px-4 py-2.5 whitespace-nowrap">Driver Name</th>}
              {showDetails && <th className="px-4 py-2.5 whitespace-nowrap">Driver Contact</th>}
              {showDetails && <th className="px-4 py-2.5 whitespace-nowrap">Owner Name</th>}
              {showDetails && <th className="px-4 py-2.5 rounded-r-lg whitespace-nowrap">Owner Contact</th>}
            </tr>
          </thead>
          <tbody>
            {(!data || data.length === 0) ? (
              <tr>
                <td colSpan={showDetails ? 8 : 4} className="text-center py-16 text-slate-500 italic">
                  No vehicle data captured in this cycle.
                </td>
              </tr>
            ) : (
              [...(data || [])].reverse().map((log, i) => (
                <tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/40 transition duration-150">
                  <td className="px-4 py-3 font-semibold text-slate-400">{log.id}</td>
                  {showPlate && (
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold text-white bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded tracking-wider">
                        {log.plate}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-3 capitalize">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      log.label === 'truck' ? 'bg-indigo-900/40 text-indigo-300 border border-indigo-900/60' :
                      log.label === 'bus' ? 'bg-pink-900/40 text-pink-300 border border-pink-900/60' :
                      'bg-slate-700/50 text-slate-200'
                    }`}>
                      {log.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-bold whitespace-nowrap ${log.overspeed ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>
                      {log.speed} km/h
                    </span>
                  </td>
                  {showDetails && (
                    <td className="px-4 py-3 text-yellow-300 font-semibold whitespace-nowrap">
                      {log.driver_name || <span className="text-slate-500 italic">N/A</span>}
                    </td>
                  )}
                  {showDetails && (
                    <td className="px-4 py-3 text-blue-300 whitespace-nowrap font-mono text-xs">
                      {log.driver_contact || <span className="text-slate-500 italic">N/A</span>}
                    </td>
                  )}
                  {showDetails && (
                    <td className="px-4 py-3 text-purple-300 font-semibold whitespace-nowrap">
                      {log.owner_name || <span className="text-slate-500 italic">N/A</span>}
                    </td>
                  )}
                  {showDetails && (
                    <td className="px-4 py-3 text-green-400 whitespace-nowrap font-mono text-xs">
                      {log.owner_contact || <span className="text-slate-500 italic">N/A</span>}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LogTable;