import { ArrowLeft, Bell, AlertTriangle, Gift, DollarSign, MessageCircle, Send, Wallet, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'framer-motion';

const Notifications = () => {
    const navigate = useNavigate();
    const [isBotConnected, setIsBotConnected] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);

            const connected = localStorage.getItem('bazzar_bot_connected');
            if (connected) setIsBotConnected(true);

            if (user) {
                fetchNotifications(user.id);
                subscribeNotifications(user.id);
            }
        };
        init();
    }, []);

    const fetchNotifications = async (userId) => {
        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);

        if (data) setNotifications(data);
    };

    const subscribeNotifications = (userId) => {
        supabase
            .channel('public:notifications')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, payload => {
                setNotifications(prev => [payload.new, ...prev]);
            })
            .subscribe();
    };

    const markAllRead = async () => {
        setNotifications(notifications.map(n => ({ ...n, is_read: true })));

        if (currentUser) {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', currentUser.id)
                .eq('is_read', false);
        }
    };

    const handleConnectBot = () => {
        if (!currentUser) return;
        window.open(`https://t.me/bazzar_staff_bot?start=connect_${currentUser.id}`, '_blank');
        localStorage.setItem('bazzar_bot_connected', 'true');
        setIsBotConnected(true);
    };

    const getIcon = (type) => {
        switch (type) {
            case 'order': return <Gift className="w-5 h-5 text-accent-blue" />;
            case 'system': return <Bell className="w-5 h-5 text-accent-purple" />;
            case 'task': return <Wallet className="w-5 h-5 text-accent-green" />;
            case 'alert': return <ShieldAlert className="w-5 h-5 text-accent-red" />;
            default: return <MessageCircle className="w-5 h-5 text-zinc-400" />;
        }
    };

    const getBgColor = (type) => {
        switch (type) {
            case 'order': return 'bg-accent-blue/10 border-accent-blue/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]';
            case 'system': return 'bg-accent-purple/10 border-accent-purple/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]';
            case 'task': return 'bg-accent-green/10 border-accent-green/20 shadow-[0_0_15px_rgba(34,197,94,0.15)]';
            case 'alert': return 'bg-accent-red/10 border-accent-red/20 shadow-[0_0_15px_rgba(239,68,68,0.15)]';
            default: return 'bg-white/5 border-white/5';
        }
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const item = {
        hidden: { opacity: 0, x: -20 },
        show: { opacity: 1, x: 0 }
    };

    return (
        <div className="min-h-screen bg-tg-bg pb-24 relative overflow-hidden">
            <div className="fixed top-0 right-0 w-[300px] h-[300px] bg-accent-purple/10 blur-[100px] rounded-full pointer-events-none" />

            {/* Header */}
            <div className="glass border-b border-white/5 pt-safe px-4 pb-4 sticky top-0 z-20 backdrop-blur-xl">
                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-xl font-bold text-white tracking-tight">Уведомления</h1>
                    </div>

                    <button
                        onClick={markAllRead}
                        className="text-xs font-bold text-accent-blue active:text-blue-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-accent-blue/10"
                    >
                        Прочитать все
                    </button>
                </div>
            </div>

            <motion.div
                className="p-4 space-y-4 relative z-10"
                initial="hidden"
                animate="show"
                variants={container}
            >
                {/* Bot Connect Banner */}
                {!isBotConnected && (
                    <motion.div variants={item} className="relative overflow-hidden rounded-3xl p-5 border border-white/10 group">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-90 transition-opacity" />
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                                    <Bell className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-white font-bold text-lg">Push-уведомления</h3>
                            </div>
                            <p className="text-blue-100 text-sm mb-4 max-w-[85%] leading-relaxed opacity-90">
                                Получайте заказы мгновенно прямо в Telegram бот
                            </p>
                            <button
                                onClick={handleConnectBot}
                                className="bg-white text-blue-600 px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 active:scale-95 transition-all shadow-xl shadow-black/20"
                            >
                                <Send className="w-4 h-4" />
                                Подключить бота
                            </button>
                        </div>
                        <div className="absolute -right-6 -bottom-6 opacity-20 group-hover:scale-110 transition-transform duration-700">
                            <Bell className="w-32 h-32 text-white -rotate-12" />
                        </div>
                    </motion.div>
                )}

                {notifications.length === 0 ? (
                    <motion.div variants={item} className="text-center py-20">
                        <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-inner">
                            <Bell className="w-8 h-8 text-zinc-600" />
                        </div>
                        <h3 className="text-white font-bold mb-1">Нет новых уведомлений</h3>
                        <p className="text-zinc-500 text-sm">Здесь будут отображаться важные события</p>
                    </motion.div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence initial={false}>
                            {notifications.map(n => (
                                <motion.div
                                    key={n.id}
                                    variants={item}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={`relative overflow-hidden rounded-2xl p-4 border transition-all group ${n.is_read
                                            ? 'bg-transparent border-white/5 opacity-60 hover:opacity-100'
                                            : 'glass-card border-white/10'
                                        }`}
                                >
                                    {!n.is_read && (
                                        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-accent-blue shadow-[0_0_8px_#3b82f6] animate-pulse"></div>
                                    )}

                                    <div className="flex gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 transition-transform group-hover:scale-105 ${getBgColor(n.type)}`}>
                                            {getIcon(n.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start pr-4 mb-1">
                                                <h3 className={`font-bold text-sm truncate ${n.is_read ? 'text-zinc-400' : 'text-white'}`}>
                                                    {n.title}
                                                </h3>
                                            </div>
                                            <p className="text-xs text-zinc-500 leading-relaxed mb-2 line-clamp-2">
                                                {n.message}
                                            </p>
                                            <p className="text-[10px] text-zinc-600 font-mono">
                                                {new Date(n.created_at).toLocaleString('ru-RU')}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default Notifications;
