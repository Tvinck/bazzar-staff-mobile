import { useNavigate, Link } from 'react-router-dom';
import { Activity, Users, Zap, ArrowRight, Server, Shield, Database, CheckSquare, Briefcase, Newspaper, MessageCircle, BookOpen, Wallet } from 'lucide-react';
import BottomNav from '../components/BottomNav';

const Services = () => {
    const navigate = useNavigate();

    const services = [
        {
            id: 'tasks',
            title: 'Биржа задач',
            description: 'Выполняй задания и зарабатывай',
            icon: CheckSquare,
            color: 'text-blue-400',
            path: '/tasks',
            featured: true
        },
        {
            id: 'chat',
            title: 'Командный чат',
            description: 'Общение с коллегами #general',
            icon: MessageCircle,
            color: 'text-indigo-400',
            path: '/chat',
            featured: true
        },
        {
            id: 'wiki',
            title: 'База знаний',
            description: 'Гайды, правила и обучение',
            icon: BookOpen,
            color: 'text-cyan-400',
            path: '/wiki',
            featured: true
        },
        {
            id: 'news',
            title: 'Новости',
            description: 'Обновления и события компании',
            icon: Newspaper,
            color: 'text-pink-400',
            path: '/news',
            featured: false
        },
        {
            id: 'monitoring',
            title: 'Мониторинг',
            description: 'Статус серверов и API',
            icon: Activity,
            color: 'text-emerald-400',
            path: '/services/monitoring',
            featured: false
        },
        {
            id: 'staff',
            title: 'Сотрудники',
            description: 'Управление командой',
            icon: Users,
            color: 'text-violet-400',
            path: '/services/staff',
            featured: false
        },
        {
            id: 'mighty',
            title: 'Mighty',
            description: 'Инструменты администратора',
            icon: Zap,
            color: 'text-amber-400',
            path: '/services/mighty',
            featured: false
        },
        {
            id: 'desslyhub',
            title: 'DesslyHub',
            description: 'Баланс и выдача товаров',
            icon: Wallet,
            color: 'text-green-400',
            path: '/services/desslyhub',
            featured: false
        }
    ];

    const systemInfo = [
        { label: 'Supabase', status: 'Online', color: 'bg-emerald-500' },
        { label: 'Telegram Bot', status: 'Online', color: 'bg-emerald-500' },
        { label: 'Yandex Market', status: 'Syncing', color: 'bg-blue-500 animate-pulse' },
    ];

    return (
        <div className="min-h-screen pb-20">
            {/* Header */}
            <div className="pt-12 pb-4 px-6 border-b border-white/5 sticky top-0 z-10 glass-panel backdrop-blur-xl bg-[#09090b]/80">
                <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">Сервисы</h1>
                <p className="text-zinc-400 text-sm">Инструменты управления BAZZAR</p>
            </div>

            <div className="p-4 space-y-6">
                {/* System Status Preview */}
                <div className="glass-panel rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 bg-zinc-800 rounded-lg">
                            <Server className="w-3.5 h-3.5 text-zinc-400" />
                        </div>
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Система</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {systemInfo.map((sys, idx) => (
                            <div key={idx} className="bg-white/5 rounded-xl p-3 text-center border border-white/5 hover:bg-white/10 transition-colors">
                                <div className={`w-2 h-2 rounded-full mx-auto mb-2 shadow-[0_0_8px_currentColor] ${sys.color}`}></div>
                                <p className="text-[10px] text-zinc-500 font-medium mb-0.5">{sys.label}</p>
                                <p className="text-xs font-bold text-white">{sys.status}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Services Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {services.map((service) => (
                        <Link
                            key={service.id}
                            to={service.path}
                            className={`group relative overflow-hidden rounded-2xl p-5 border transition-all active:scale-[0.98] ${service.featured
                                ? 'fintech-card border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)] col-span-1'
                                : 'glass-panel border-white/5 hover:border-white/10'
                                }`}
                        >
                            {service.featured && (
                                <div className="absolute top-0 right-0 p-3 opacity-10">
                                    <service.icon className={`w-24 h-24 ${service.color} -rotate-12 translate-x-8 -translate-y-8`} />
                                </div>
                            )}

                            <div className="flex items-center gap-4 relative z-10">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg ${service.featured
                                    ? `bg-opacity-20 border-opacity-30 ${service.color.replace('text-', 'bg-').replace('400', '500')} ${service.color.replace('text-', 'border-').replace('400', '500')}`
                                    : 'bg-white/5 border-white/10'
                                    }`}>
                                    <service.icon className={`w-6 h-6 ${service.color}`} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-white mb-0.5">{service.title}</h3>
                                        <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                    </div>
                                    <p className="text-sm text-zinc-500 line-clamp-1">{service.description}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="glass-panel p-4 rounded-2xl border border-white/5">
                        <Shield className="w-5 h-5 text-emerald-500/80 mb-2" />
                        <p className="text-xs text-zinc-500 mb-0.5">Безопасность</p>
                        <p className="text-sm text-white font-bold">Активна</p>
                    </div>
                    <div className="glass-panel p-4 rounded-2xl border border-white/5">
                        <Database className="w-5 h-5 text-blue-500/80 mb-2" />
                        <p className="text-xs text-zinc-500 mb-0.5">База данных</p>
                        <p className="text-sm text-white font-bold">Stable</p>
                    </div>
                </div>
            </div>

            <BottomNav />
        </div>
    );
};

export default Services;
