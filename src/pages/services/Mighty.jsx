import { ArrowLeft, Terminal, Database, RotateCcw, Lock, AlertOctagon, Users, DollarSign, Activity, MapPin, TrendingUp, BarChart3, Zap, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../supabase';

const Mighty = () => {
    const navigate = useNavigate();
    const [auditLogs, setAuditLogs] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            // 1. Fetch Audit Logs (Real System Logs)
            const { data: logs } = await supabase
                .from('audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            if (logs) setAuditLogs(logs);

            // 2. Fetch Staff (Profiles)
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, email, role')
                .limit(5);

            if (profiles) {
                setStaffList(profiles.map((p, i) => ({
                    id: p.id,
                    name: p.email.split('@')[0],
                    status: i === 0 ? 'busy' : 'online', // Mock status for now
                    action: i === 0 ? 'Action' : 'Idle',
                    time: 'Online'
                })));
            } else {
                // Fallback Mock Staff
                setStaffList([
                    { id: 1, name: 'Артём Г.', status: 'busy', action: 'Обработка #53179', time: '12m' },
                    { id: 2, name: 'Елена С.', status: 'online', action: 'Просмотр заказов', time: 'Online' },
                    { id: 3, name: 'System Bot', status: 'bot', action: 'Auto-replying', time: 'Always' },
                ]);
            }

            setLoading(false);
        };
        fetchData();
    }, []);

    // Mock Financial Data (Last 7 Days) - Static for now as we lack easy agg API
    const revenueData = [
        { day: 'Пн', val: 45000, h: '60%' },
        { day: 'Вт', val: 52000, h: '70%' },
        { day: 'Ср', val: 38000, h: '45%' },
        { day: 'Чт', val: 61000, h: '85%' },
        { day: 'Пт', val: 75000, h: '100%' }, // Max
        { day: 'Сб', val: 68000, h: '90%' },
        { day: 'Вс', val: 72000, h: '95%' },
    ];

    const tools = [
        { name: 'SQL Console', icon: Database, color: 'text-blue-400', desc: 'Execute queries' },
        { name: 'System Logs', icon: Terminal, color: 'text-zinc-400', desc: 'View server logs' },
        { name: 'Restart Services', icon: RotateCcw, color: 'text-orange-400', desc: 'Reboot subsystems' },
        { name: 'Access Control', icon: Lock, color: 'text-red-400', desc: 'Manage permissions' },
    ];

    return (
        <div className="min-h-screen pb-20 bg-[#09090b]">
            <div className="glass-panel border-b border-white/5 pt-12 pb-4 px-4 sticky top-0 z-10 backdrop-blur-xl bg-[#09090b]/80">
                <div className="flex items-center gap-3 mb-2">
                    <button
                        onClick={() => navigate('/services')}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        Mighty <span className="bg-amber-500/10 text-amber-500 text-[10px] px-2 py-0.5 rounded border border-amber-500/20">ADMIN</span>
                    </h1>
                </div>
            </div>

            <div className="p-4 space-y-6">

                {/* Live Monitor (Real Profiles + Mock Status) */}
                <section>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-sm font-bold text-zinc-400 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-emerald-500" />
                            Live Monitor
                        </h3>
                        <span className="text-xs text-emerald-500 font-medium animate-pulse">● Online</span>
                    </div>
                    <div className="glass-panel rounded-2xl p-1 overflow-hidden border border-white/5">
                        {loading ? <div className="p-4 text-center text-zinc-500">Загрузка...</div> : staffList.map((staff, i) => (
                            <div key={staff.id} className={`p-3 flex items-center gap-3 ${i !== staffList.length - 1 ? 'border-b border-white/5' : ''}`}>
                                <div className="relative">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${staff.status === 'bot' ? 'bg-purple-600' : 'bg-zinc-800 text-zinc-400'
                                        }`}>
                                        {staff.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#18181b] ${staff.status === 'busy' ? 'bg-amber-500' :
                                            staff.status === 'bot' ? 'bg-purple-500' : 'bg-emerald-500'
                                        }`}></div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-white max-w-[150px] truncate">{staff.name}</p>
                                    <p className={`text-xs ${staff.status === 'busy' ? 'text-amber-400' : 'text-zinc-500'
                                        }`}>
                                        {staff.action}
                                    </p>
                                </div>
                                <span className="text-xs text-zinc-600 font-mono">{staff.time}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Audit Logs Preview */}
                <section>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-sm font-bold text-zinc-400 flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-zinc-500" />
                            System Logs
                        </h3>
                    </div>
                    <div className="glass-panel rounded-2xl p-4 border border-white/5 bg-black/20 font-mono text-xs overflow-hidden">
                        {auditLogs.length > 0 ? (
                            <div className="space-y-2">
                                {auditLogs.map(log => (
                                    <div key={log.id} className="flex gap-2">
                                        <span className="text-zinc-600">[{new Date(log.created_at).toLocaleTimeString()}]</span>
                                        <span className="text-blue-400">{log.action}</span>
                                        <span className="text-zinc-500 truncate">{JSON.stringify(log.details)}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-zinc-600">No logs yet...</p>
                        )}
                    </div>
                </section>

                {/* Global Finance Chart */}
                <section>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-sm font-bold text-zinc-400 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-blue-500" />
                            Выручка компании
                        </h3>
                        <span className="text-xs text-blue-400 font-bold">+12% vs week</span>
                    </div>
                    <div className="glass-panel rounded-2xl p-5 border border-white/5">
                        <div className="flex items-end justify-between h-32 gap-2">
                            {revenueData.map((d, i) => (
                                <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                                    <div className="w-full relative h-full flex items-end">
                                        <div
                                            className="w-full bg-blue-500/20 rounded-t-lg group-hover:bg-blue-500/40 transition-all relative"
                                            style={{ height: d.h }}
                                        >
                                            {/* Tooltip on hover (desktop) / always visible for max? */}
                                            {d.h === '100%' && (
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                                    {(d.val / 1000).toFixed(0)}k
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-zinc-500 font-medium">{d.day}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 flex items-center justify-between pt-4 border-t border-white/5">
                            <div>
                                <p className="text-xs text-zinc-500">Общая выручка</p>
                                <p className="text-xl font-bold text-white">411,000 ₽</p>
                            </div>
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <DollarSign className="w-5 h-5 text-emerald-500" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Tools Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {tools.map((tool, i) => (
                        <div key={i} className="glass-panel p-4 rounded-2xl border border-white/5 active:scale-95 transition-transform">
                            <tool.icon className={`w-6 h-6 ${tool.color} mb-3`} />
                            <h3 className="text-white font-bold text-sm mb-0.5">{tool.name}</h3>
                            <p className="text-zinc-500 text-[10px]">{tool.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
                    <AlertOctagon className="w-6 h-6 text-red-500 shrink-0" />
                    <div>
                        <h3 className="text-red-500 font-bold text-sm mb-1">Режим ЧП</h3>
                        <p className="text-red-400/80 text-xs leading-relaxed">
                            Активация экстренного режима ограничит доступ всем сотрудникам.
                        </p>
                        <button className="mt-2 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-transform">
                            Активировать
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Mighty;
