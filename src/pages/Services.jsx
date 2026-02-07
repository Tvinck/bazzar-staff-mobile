import { useNavigate, Link } from 'react-router-dom';
import { Activity, Users, Zap, ArrowRight, Server, Shield, Database, CheckSquare, Briefcase, Newspaper, MessageCircle, BookOpen, Wallet } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { motion } from 'framer-motion';

const Services = () => {
    const navigate = useNavigate();

    const services = [
        {
            id: 'tasks',
            title: 'Биржа задач',
            description: 'Выполняй задания и зарабатывай',
            icon: CheckSquare,
            gradient: 'from-blue-500/20 to-indigo-500/20',
            text: 'text-blue-400',
            border: 'border-blue-500/30',
            path: '/tasks',
            featured: true
        },
        /* {
            id: 'chat',
            title: 'Командный чат',
            description: 'Общение с коллегами #general',
            icon: MessageCircle,
            gradient: 'from-purple-500/20 to-pink-500/20',
            text: 'text-purple-400',
            border: 'border-purple-500/30',
            path: '/chat',
            featured: true
        }, */
        {
            id: 'wiki',
            title: 'База знаний',
            description: 'Гайды, правила и обучение',
            icon: BookOpen,
            gradient: 'from-cyan-500/20 to-teal-500/20',
            text: 'text-cyan-400',
            border: 'border-cyan-500/30',
            path: '/wiki',
            featured: true
        },
        {
            id: 'news',
            title: 'Новости',
            description: 'Обновления и события',
            icon: Newspaper,
            gradient: 'hidden',
            text: 'text-pink-400',
            border: 'border-white/5',
            path: '/news',
            featured: false
        },
        {
            id: 'monitoring',
            title: 'Мониторинг',
            description: 'Статус серверов и API',
            icon: Activity,
            gradient: 'hidden',
            text: 'text-emerald-400',
            border: 'border-white/5',
            path: '/services/monitoring',
            featured: false
        },
        {
            id: 'staff',
            title: 'Сотрудники',
            description: 'Управление командой',
            icon: Users,
            gradient: 'hidden',
            text: 'text-violet-400',
            border: 'border-white/5',
            path: '/services/staff',
            featured: false
        },
        {
            id: 'mighty',
            title: 'Mighty',
            description: 'Инструменты администратора',
            icon: Zap,
            gradient: 'hidden',
            text: 'text-amber-400',
            border: 'border-white/5',
            path: '/services/mighty',
            featured: false
        },
        {
            id: 'desslyhub',
            title: 'DesslyHub',
            description: 'Баланс и выдача товаров',
            icon: Wallet,
            gradient: 'hidden',
            text: 'text-green-400',
            border: 'border-white/5',
            path: '/services/desslyhub',
            featured: false
        }
    ];

    const systemInfo = [
        { label: 'Supabase', status: 'Online', color: 'bg-emerald-500', shadow: 'shadow-[0_0_10px_#10b981]' },
        { label: 'Bot', status: 'Online', color: 'bg-emerald-500', shadow: 'shadow-[0_0_10px_#10b981]' },
        { label: 'Yandex', status: 'Syncing', color: 'bg-blue-500', shadow: 'shadow-[0_0_10px_#3b82f6] animate-pulse' },
    ];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen pb-24 bg-tg-bg relative overflow-hidden">
            {/* Background Ambient Effects */}
            <div className="fixed top-0 left-0 w-full h-96 bg-accent-purple/5 blur-[120px] rounded-b-[100%] pointer-events-none" />

            {/* Header */}
            <div className="pt-safe pb-4 px-6 border-b border-white/5 sticky top-0 z-20 backdrop-blur-xl bg-tg-bg/80">
                <div className="mt-2">
                    <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">Сервисы</h1>
                    <p className="text-zinc-400 text-sm">Инструменты управления BAZZAR</p>
                </div>
            </div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="p-4 space-y-6 relative z-10"
            >
                {/* System Status Preview */}
                <motion.div variants={item} className="glass-card rounded-2xl p-5 border border-white/5">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 bg-zinc-800/50 rounded-lg">
                            <Server className="w-4 h-4 text-zinc-400" />
                        </div>
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Статус Системы</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {systemInfo.map((sys, idx) => (
                            <div key={idx} className="bg-white/5 rounded-xl p-3 text-center border border-white/5 hover:border-white/10 transition-colors">
                                <div className={`w-2 h-2 rounded-full mx-auto mb-2 ${sys.color} ${sys.shadow}`}></div>
                                <p className="text-[10px] text-zinc-500 font-medium mb-0.5">{sys.label}</p>
                                <p className="text-xs font-bold text-white">{sys.status}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Services Grid */}
                <div className="grid grid-cols-1 gap-3">
                    {services.map((service) => (
                        <motion.div variants={item} key={service.id}>
                            <Link
                                to={service.path}
                                className={`group relative overflow-hidden rounded-2xl p-5 border transition-all active:scale-[0.98] block ${service.featured ? `glass-card ${service.border}` : 'glass border-white/5 hover:border-white/10'
                                    }`}
                            >
                                {service.featured && (
                                    <>
                                        <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:rotate-12 duration-500">
                                            <service.icon className={`w-24 h-24 ${service.text} -rotate-12 translate-x-8 -translate-y-8`} />
                                        </div>
                                    </>
                                )}

                                <div className="flex items-center gap-4 relative z-10">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg ${service.featured
                                        ? `bg-black/20 backdrop-blur-md border-white/10`
                                        : 'bg-white/5 border-white/5'
                                        }`}>
                                        <service.icon className={`w-6 h-6 ${service.text}`} />
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
                        </motion.div>
                    ))}
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-2 gap-3">
                    <motion.div variants={item} className="glass rounded-2xl p-4 border border-white/5 flex flex-col items-center text-center">
                        <Shield className="w-6 h-6 text-emerald-500 mb-2 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <p className="text-xs text-zinc-500 mb-0.5">Безопасность</p>
                        <p className="text-sm text-white font-bold">Защищено</p>
                    </motion.div>
                    <motion.div variants={item} className="glass rounded-2xl p-4 border border-white/5 flex flex-col items-center text-center">
                        <Database className="w-6 h-6 text-blue-500 mb-2 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        <p className="text-xs text-zinc-500 mb-0.5">База данных</p>
                        <p className="text-sm text-white font-bold">Стабильно</p>
                    </motion.div>
                </div>
            </motion.div>

            <BottomNav />
        </div>
    );
};

export default Services;
