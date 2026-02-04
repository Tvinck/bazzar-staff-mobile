import { ArrowLeft, Server, Activity, Wifi, Database, CheckCircle, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Monitoring = () => {
    const navigate = useNavigate();

    const services = [
        { name: 'API Server', status: 'online', uptime: '99.9%', ping: '45ms' },
        { name: 'Database (Supabase)', status: 'online', uptime: '99.99%', ping: '12ms' },
        { name: 'Telegram Bot', status: 'online', uptime: '99.5%', ping: '120ms' },
        { name: 'Yandex Integration', status: 'warning', uptime: '98.2%', ping: '350ms' },
        { name: 'Payment Gateway', status: 'online', uptime: '100%', ping: '80ms' },
    ];

    return (
        <div className="min-h-screen pb-20 bg-[#09090b]">
            {/* Header */}
            <div className="glass-panel border-b border-white/5 pt-12 pb-4 px-4 sticky top-0 z-10 backdrop-blur-xl bg-[#09090b]/80">
                <div className="flex items-center gap-3 mb-2">
                    <button
                        onClick={() => navigate('/services')}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-xl font-bold text-white">Мониторинг</h1>
                </div>
            </div>

            <div className="p-4 space-y-6">
                {/* Overall Status */}
                <div className="fintech-card p-6 rounded-3xl text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-emerald-500 animate-shimmer"></div>

                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                        <Activity className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-1">Все системы в норме</h2>
                    <p className="text-zinc-400 text-sm">Последнее обновление: только что</p>
                </div>

                {/* Services List */}
                <div className="space-y-3">
                    {services.map((svc, i) => (
                        <div key={i} className="glass-panel p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${svc.status === 'online' ? 'bg-emerald-500/10 border-emerald-500/10' : 'bg-orange-500/10 border-orange-500/10'
                                    }`}>
                                    <Server className={`w-5 h-5 ${svc.status === 'online' ? 'text-emerald-400' : 'text-orange-400'}`} />
                                </div>
                                <div>
                                    <p className="text-white font-medium text-sm">{svc.name}</p>
                                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                                        <span className="flex items-center gap-1">
                                            <Wifi className="w-3 h-3" /> {svc.ping}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`text-xs font-bold px-2 py-1 rounded-lg border mb-1 inline-block ${svc.status === 'online' ? 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20' : 'text-orange-400 bg-orange-500/5 border-orange-500/20'
                                    }`}>
                                    {svc.status.toUpperCase()}
                                </div>
                                <p className="text-xs text-zinc-500">Uptime: {svc.uptime}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Logs Preview */}
                <div className="bg-black/40 rounded-2xl p-4 border border-white/5 font-mono text-xs text-zinc-400">
                    <p className="mb-2 text-zinc-500 font-bold uppercase">System Logs</p>
                    <div className="space-y-1">
                        <p><span className="text-emerald-500">[14:30:05]</span> Service started successfully</p>
                        <p><span className="text-blue-500">[14:32:12]</span> Sync completed (45 items)</p>
                        <p><span className="text-zinc-500">[14:35:00]</span> Health check passed</p>
                        <p><span className="text-orange-500">[14:40:22]</span> High latency on node-3</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Monitoring;
