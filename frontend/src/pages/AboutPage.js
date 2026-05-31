import React from 'react';
import { 
  Target, AlertTriangle, ShieldCheck, Cpu, 
  Layers, Smartphone, Radio, Server, 
  CheckCircle2, Lightbulb, TrendingDown, Activity, Eye, Database, Navigation
} from 'lucide-react';

const SectionHeading = ({ icon, title }) => (
  <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-3 border-b border-slate-700 pb-3">
    {icon}
    {title}
  </h2>
);

const AboutPage = () => {
  return (
    <div className="space-y-8 animate-fade-in pb-10">
        
        {/* HERO SECTION */}
        <div className="relative bg-slate-900/60 backdrop-blur-md p-8 rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-4 flex items-center gap-4 relative z-10">
                <ShieldCheck className="text-blue-400 w-10 h-10 shrink-0" />
                Road Accident Prevention & Smart Traffic Matrix
            </h1>
            <p className="text-slate-300 leading-relaxed text-lg max-w-4xl relative z-10">
                A next-generation, AI-driven traffic enforcement ecosystem designed to automate speed monitoring, proactively warn drivers, and seamlessly log violations. By bridging the gap between advanced computer vision and citizen-facing mobile applications, our mission is to cultivate safer roads and drastically reduce accident rates.
            </p>
        </div>

        {/* PROBLEM & SOLUTION */}
        <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-red-900/10 p-6 md:p-8 rounded-3xl border border-red-500/20 shadow-lg relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl"></div>
                <SectionHeading icon={<AlertTriangle className="text-red-400" />} title="The Problem" />
                <ul className="space-y-4 text-slate-300">
                    <li className="flex items-start gap-3"><span className="text-red-400 mt-1 font-bold">✗</span> <strong>High Fatality Rates:</strong> Overspeeding remains the leading cause of fatal road accidents globally.</li>
                    <li className="flex items-start gap-3"><span className="text-red-400 mt-1 font-bold">✗</span> <strong>No Preventive Feedback:</strong> Traditional speed traps are isolated and lack real-time feedback loops to warn drivers <em>before</em> a penalty is issued.</li>
                    <li className="flex items-start gap-3"><span className="text-red-400 mt-1 font-bold">✗</span> <strong>Inefficient Enforcement:</strong> Manual monitoring is resource-heavy, prone to human error, and ineffective during peak traffic hours.</li>
                </ul>
            </div>

            <div className="bg-green-900/10 p-6 md:p-8 rounded-3xl border border-green-500/20 shadow-lg relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl"></div>
                <SectionHeading icon={<Target className="text-green-400" />} title="Our Solution" />
                <ul className="space-y-4 text-slate-300">
                    <li className="flex items-start gap-3"><span className="text-green-400 mt-1 font-bold">✓</span> <strong>Predictive Monitoring:</strong> Multi-camera tracking (600m & 300m warnings, 0m enforcement) gives drivers a chance to correct behavior.</li>
                    <li className="flex items-start gap-3"><span className="text-green-400 mt-1 font-bold">✓</span> <strong>100% Automation:</strong> Physics-based speed calculation requiring zero manual intervention using AI algorithms.</li>
                    <li className="flex items-start gap-3"><span className="text-green-400 mt-1 font-bold">✓</span> <strong>Direct Citizen Link:</strong> Integration with mobile apps for instant, automated audio and visual push alerts.</li>
                </ul>
            </div>
        </div>

        {/* SYSTEM ARCHITECTURE */}
        <div className="bg-slate-800/40 p-6 md:p-8 rounded-3xl border border-slate-700 shadow-xl backdrop-blur-sm">
            <SectionHeading icon={<Layers className="text-blue-400" />} title="System Architecture Overview" />
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 text-center mt-8">
                <div className="flex-1 bg-slate-900/80 p-6 rounded-2xl border border-slate-700 w-full hover:border-cyan-500/50 transition-colors">
                    <Eye className="w-10 h-10 text-cyan-400 mx-auto mb-3" />
                    <h4 className="font-bold text-white mb-2">1. Visual Detection</h4>
                    <p className="text-xs text-slate-400">YOLOv8 & ByteTrack identify and seamlessly track vehicles across video frames.</p>
                </div>
                <Activity className="w-8 h-8 text-slate-600 rotate-90 lg:rotate-0 shrink-0" />
                <div className="flex-1 bg-slate-900/80 p-6 rounded-2xl border border-slate-700 w-full hover:border-blue-500/50 transition-colors">
                    <Cpu className="w-10 h-10 text-blue-400 mx-auto mb-3" />
                    <h4 className="font-bold text-white mb-2">2. Physics Processing</h4>
                    <p className="text-xs text-slate-400">Engine calculates speed using Distance/Time logic across virtual trap lines.</p>
                </div>
                <Activity className="w-8 h-8 text-slate-600 rotate-90 lg:rotate-0 shrink-0" />
                <div className="flex-1 bg-slate-900/80 p-6 rounded-2xl border border-slate-700 w-full hover:border-purple-500/50 transition-colors">
                    <Server className="w-10 h-10 text-purple-400 mx-auto mb-3" />
                    <h4 className="font-bold text-white mb-2">3. Decision Matrix</h4>
                    <p className="text-xs text-slate-400">System evaluates speed limits against zone data and generates warnings/challans.</p>
                </div>
                <Activity className="w-8 h-8 text-slate-600 rotate-90 lg:rotate-0 shrink-0" />
                <div className="flex-1 bg-slate-900/80 p-6 rounded-2xl border border-slate-700 w-full hover:border-green-500/50 transition-colors">
                    <Smartphone className="w-10 h-10 text-green-400 mx-auto mb-3" />
                    <h4 className="font-bold text-white mb-2">4. Action & Alert</h4>
                    <p className="text-xs text-slate-400">Data is instantly dispatched to the Control Room and Driver's Mobile App.</p>
                </div>
            </div>
        </div>

        {/* FUTURE ENHANCEMENTS */}
        <div className="bg-gradient-to-br from-blue-900/20 to-slate-900 p-6 md:p-8 rounded-3xl border border-blue-500/30 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.1)_0%,rgba(0,0,0,0)_70%)] pointer-events-none"></div>
            <SectionHeading icon={<Lightbulb className="text-yellow-400" />} title="Future Scope & Smart City Innovations" />
            
            <div className="grid md:grid-cols-2 gap-6 mt-6 relative z-10">
                <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-600 hover:border-blue-400 transition-colors shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-500/20 rounded-lg"><Radio className="text-blue-400 w-6 h-6" /></div>
                        <h3 className="text-lg font-bold text-white">In-Vehicle Smart IoT Alert Device</h3>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">
                        A dedicated, low-cost IoT dashboard unit linked via FASTag or RFID. When the highway camera detects an overspeeding plate, a localized cellular signal triggers an immediate, loud audio alarm <strong>directly inside the car's cabin</strong>, forcing the driver's attention back to the road limit without relying on their smartphone.
                    </p>
                </div>

                <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-600 hover:border-green-400 transition-colors shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-500/20 rounded-lg"><Navigation className="text-green-400 w-6 h-6" /></div>
                        <h3 className="text-lg font-bold text-white">Govt. Platform Integrations</h3>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">
                        Embedding our API as a microservice directly into national citizen apps like <strong>mParivahan</strong>, <strong>DigiLocker</strong>, and <strong>Smart City Citizen Apps</strong>. This allows automatic delivery of e-Challans, instant push-notifications, and seamless logging of driving behavior.
                    </p>
                </div>

                <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-600 hover:border-yellow-400 transition-colors shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-yellow-500/20 rounded-lg"><Activity className="text-yellow-400 w-6 h-6" /></div>
                        <h3 className="text-lg font-bold text-white">Smart Traffic Light Ecosystem</h3>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">
                        Synchronizing our AI counting logic with traffic signals. By analyzing real-time traffic density at intersections, the system dynamically adjusts green/red light durations to alleviate congestion and clears paths instantly for incoming emergency vehicles.
                    </p>
                </div>

                <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-600 hover:border-purple-400 transition-colors shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-500/20 rounded-lg"><Database className="text-purple-400 w-6 h-6" /></div>
                        <h3 className="text-lg font-bold text-white">E-Challan PDF & Blockchain Log</h3>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">
                        Automated generation of official E-Challan PDFs containing the violation timestamp, vehicle image snippet, and GPS coordinates. Future updates aim to log these violations on a secure, tamper-proof blockchain database accessible only to RTO authorities.
                    </p>
                </div>
            </div>
        </div>

        {/* BENEFITS & TECH STACK */}
        <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-800/40 p-6 md:p-8 rounded-3xl border border-slate-700 shadow-lg">
                <SectionHeading icon={<TrendingDown className="text-teal-400" />} title="Key Benefits" />
                <ul className="space-y-5 mt-6">
                    <li className="flex items-start gap-4">
                        <CheckCircle2 className="text-teal-400 w-6 h-6 shrink-0 mt-0.5" />
                        <div><strong className="text-slate-100 block mb-1 text-base">For Drivers</strong> Transparent warning systems prevent accidental fines and promote safer driving habits.</div>
                    </li>
                    <li className="flex items-start gap-4">
                        <CheckCircle2 className="text-teal-400 w-6 h-6 shrink-0 mt-0.5" />
                        <div><strong className="text-slate-100 block mb-1 text-base">For Traffic Police</strong> Eliminates manual radar monitoring, reducing workforce strain and human error.</div>
                    </li>
                    <li className="flex items-start gap-4">
                        <CheckCircle2 className="text-teal-400 w-6 h-6 shrink-0 mt-0.5" />
                        <div><strong className="text-slate-100 block mb-1 text-base">For Smart Cities</strong> Generates actionable traffic analytics to improve road infrastructure and urban planning.</div>
                    </li>
                </ul>
            </div>

            <div className="bg-slate-800/40 p-6 md:p-8 rounded-3xl border border-slate-700 shadow-lg">
                <SectionHeading icon={<Cpu className="text-indigo-400" />} title="Technologies Used" />
                <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 text-center hover:bg-slate-800 transition-colors">
                        <div className="text-indigo-400 font-bold mb-2">Frontend</div>
                        <div className="text-sm text-slate-400">React.js, Tailwind CSS</div>
                    </div>
                    <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 text-center hover:bg-slate-800 transition-colors">
                        <div className="text-indigo-400 font-bold mb-2">Backend</div>
                        <div className="text-sm text-slate-400">Python, Flask, JWT Auth</div>
                    </div>
                    <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 text-center hover:bg-slate-800 transition-colors">
                        <div className="text-indigo-400 font-bold mb-2">AI / Vision</div>
                        <div className="text-sm text-slate-400">YOLOv8, ByteTrack, OpenCV</div>
                    </div>
                    <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 text-center hover:bg-slate-800 transition-colors">
                        <div className="text-indigo-400 font-bold mb-2">APIs / Comm.</div>
                        <div className="text-sm text-slate-400">Web Speech API, RESTful JSON</div>
                    </div>
                </div>
            </div>
        </div>

        {/* FOOTER */}
        <div className="text-center text-slate-500 text-sm pt-8 border-t border-slate-800 font-mono tracking-widest uppercase">
            Final Year Engineering Project © {new Date().getFullYear()} <br/>
            <span className="text-[10px] mt-2 block opacity-70">Road Accident Prevention & Smart Traffic Enforcement Matrix</span>
        </div>
    </div>
  );
};

export default AboutPage;