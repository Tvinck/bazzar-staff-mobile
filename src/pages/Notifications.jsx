import { ArrowLeft, Bell, CheckCircle, AlertTriangle, Gift, DollarSign, MessageCircle, Send, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const Notifications = () => {
    const navigate = useNavigate();
    const [isBotConnected, setIsBotConnected] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);

            // Check Bot Connection (Mock check via localStorage or check DB if time permitted)
            // Real check would be: await supabase.from('bot_users').select('*').eq('user_id', user.id).single();
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
        // UI Optimistic
        setNotifications(notifications.map(n => ({ ...n, is_read: true })));

        // DB Update
        if (currentUser) {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', currentUser.id)
                .eq('is_read', false); // Only update unread
        }
    };

    const handleConnectBot = () => {
        if (!currentUser) return;
        window.open(`https://t.me/bazzar_staff_bot?start=connect_${currentUser.id}`, '_blank');
        // We set local storage optimistically, but real confirmation comes from DB in future loads
        localStorage.setItem('bazzar_bot_connected', 'true');
        setIsBotConnected(true);
    };

    const getIcon = (type) => {
        switch (type) {
            case 'order': return <Gift className="w-5 h-5 text-blue-400" />;
            case 'system': return <Bell className="w-5 h-5 text-purple-400" />;
            case 'task': return <DollarSign className="w-5 h-5 text-emerald-400" />;
            case 'alert': return <AlertTriangle className="w-5 h-5 text-red-400" />;
            default: return <MessageCircle className="w-5 h-5 text-zinc-400" />;
        }
    };

    const getBgColor = (type) => {
        switch (type) {
            case 'order': return 'bg-blue-500/10 border-blue-500/20';
            case 'system': return 'bg-purple-500/10 border-purple-500/20';
            case 'task': return 'bg-emerald-500/10 border-emerald-500/20';
            case 'alert': return 'bg-red-500/10 border-red-500/20';
            default: return 'bg-zinc-800 border-zinc-700';
        }
    };

    return (
        <div className="min-h-screen bg-[#09090b] pb-20">
            {/* Header */}
            <div className="glass-panel border-b border-white/5 pt-12 pb-4 px-4 sticky top-0 z-10 backdrop-blur-xl bg-[#09090b]/80">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-xl font-bold text-white">Уведомления</h1>
                    </div>

                    <button
                        onClick={markAllRead}
                        className="text-xs font-bold text-blue-400 active:text-blue-300 transition-colors"
                    >
                        Прочитать все
                    </button>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Bot Connect Banner */}
                {!isBotConnected && (
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 shadow-lg shadow-blue-500/20 relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-white font-bold text-lg mb-1">Push-уведомления</h3>
                            <p className="text-blue-100 text-sm mb-3 max-w-[80%]">Получайте заказы мгновенно прямо в Telegram</p>
                            <button
                                onClick={handleConnectBot}
                                className="bg-white text-blue-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 active:scale-95 transition-transform"
                            >
                                <Send className="w-4 h-4" />
                                Подключить бота
                            </button>
                        </div>
                        <div className="absolute -right-4 -bottom-4 opacity-30">
                            <Bell className="w-24 h-24 text-white -rotate-12" />
                        </div>
                    </div>
                )}

                {notifications.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bell className="w-8 h-8 text-zinc-600" />
                        </div>
                        <p className="text-zinc-500">Уведомлений нет</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map(n => (
                            <div
                                key={n.id}
                                className={`relative overflow-hidden rounded-2xl p-4 border transition-all ${n.is_read ? 'bg-transparent border-white/5 opacity-70' : 'bg-white/[0.02] border-white/10'
                                    }`}
                            >
                                {!n.is_read && (
                                    <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"></div>
                                )}

                                <div className="flex gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${getBgColor(n.type)}`}>
                                        {getIcon(n.type)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start pr-4">
                                            <h3 className={`font-bold text-sm mb-1 ${n.is_read ? 'text-zinc-400' : 'text-white'}`}>
                                                {n.title}
                                            </h3>
                                        </div>
                                        <p className="text-xs text-zinc-500 leading-relaxed mb-2">
                                            {n.message}
                                        </p>
                                        <p className="text-[10px] text-zinc-600 font-medium">
                                            {new Date(n.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
