import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MessageCircle, ShoppingBag, Globe, Zap, Circle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptic } from '../utils/telegram';
import { supabase } from '../supabase';
import { toast } from 'sonner';
import { ChatSkeleton } from '../components/SkeletonLoader';

const Chats = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const [chats, setChats] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    const getAvatarColor = (platform) => {
        const colors = {
            yandex: 'bg-yellow-500',
            digiseller: 'bg-blue-500',
            ggsel: 'bg-orange-500',
            avito: 'bg-green-500',
        };
        return colors[platform] || 'bg-zinc-600';
    };

    const fetchChats = async () => {
        try {
            const { data, error } = await supabase
                .from('platform_chats')
                .select('*')
                .order('updated_at', { ascending: false });

            if (error) throw error;

            if (data) {
                setChats(data.map(c => ({
                    id: c.id,
                    platform: c.platform,
                    clientName: c.client_name,
                    externalId: c.external_id,
                    lastMessage: c.last_message,
                    time: new Date(c.updated_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
                    unread: c.unread_count,
                    avatarColor: getAvatarColor(c.platform)
                })));
            }
        } catch (err) {
            console.error('Error fetching chats:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSync = async () => {
        if (isSyncing) return;
        setIsSyncing(true);
        haptic.impact('medium');
        toast.info('Синхронизация с Avito...');

        try {
            const { data, error } = await supabase.functions.invoke('avito-io', {
                body: { action: 'sync_chats' }
            });

            if (error) throw error;

            toast.success('Avito синхронизировано');
            fetchChats();
        } catch (err) {
            console.error('Sync failed:', err);
            toast.error('Ошибка синхронизации: ' + err.message);
        } finally {
            setIsSyncing(false);
        }
    };

    useEffect(() => {
        fetchChats();

        const channel = supabase
            .channel('public:platform_chats')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'platform_chats' }, () => {
                fetchChats();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const tabs = [
        { id: 'all', label: 'Все', icon: null },
        { id: 'yandex', label: 'Yandex', icon: <ShoppingBag className="w-3 h-3" /> },
        { id: 'digiseller', label: 'Digi', icon: <Globe className="w-3 h-3" /> },
        { id: 'ggsel', label: 'GGSel', icon: <Zap className="w-3 h-3" /> },
        { id: 'avito', label: 'Avito', icon: <Circle className="w-3 h-3" /> },
    ];

    const getPlatformIcon = (platform) => {
        switch (platform) {
            case 'yandex': return <div className="p-1 bg-yellow-500/20 text-yellow-500 rounded-lg"><ShoppingBag className="w-3 h-3" /></div>;
            case 'digiseller': return <div className="p-1 bg-blue-500/20 text-blue-500 rounded-lg"><Globe className="w-3 h-3" /></div>;
            case 'ggsel': return <div className="p-1 bg-orange-500/20 text-orange-500 rounded-lg"><Zap className="w-3 h-3" /></div>;
            case 'avito': return <div className="p-1 bg-green-500/20 text-green-500 rounded-lg"><Circle className="w-3 h-3" /></div>;
            default: return null;
        }
    };

    const filteredChats = chats.filter(chat => {
        const matchesTab = activeTab === 'all' || chat.platform === activeTab;
        const name = chat.clientName || '';
        const msg = chat.lastMessage || '';
        const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            msg.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-tg-bg pb-24 relative">
            <div className="fixed top-0 right-0 w-[200px] h-[200px] bg-accent-blue/10 blur-[80px] rounded-full pointer-events-none" />
            <div className="fixed bottom-0 left-0 w-[200px] h-[200px] bg-accent-purple/10 blur-[80px] rounded-full pointer-events-none" />

            {/* Header */}
            <div className="glass border-b border-white/5 pt-safe px-4 pb-4 sticky top-0 z-20 backdrop-blur-xl">
                <div className="flex items-center justify-between mt-2 mb-4">
                    <h1 className="text-2xl font-bold text-white tracking-tight">Чаты</h1>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSync}
                            disabled={isSyncing}
                            className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 hover:bg-white/10 active:scale-95 transition-all ${isSyncing ? 'animate-spin opacity-50' : ''}`}
                        >
                            <RefreshCw className="w-5 h-5 text-zinc-400" />
                        </button>
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                            <MessageCircle className="w-5 h-5 text-zinc-400" />
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Поиск сообщений..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/50 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-accent-blue/50 transition-all"
                    />
                </div>

                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); haptic.impact('light'); }}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 ${activeTab === tab.id
                                ? 'bg-white text-black border-white'
                                : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>




            {/* Content */}
            {isLoading ? (
                <div className="space-y-0">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <ChatSkeleton key={i} />
                    ))}
                </div>
            ) : (
                <div className="p-4 space-y-2 relative z-10">
                    <AnimatePresence>
                        {filteredChats.map((chat) => (
                            <motion.div
                                key={chat.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    haptic.impact('light');
                                    navigate(`/chats/${chat.id}`, { state: { chat } });
                                }}
                                className="glass-card p-4 rounded-2xl flex items-center gap-4 cursor-pointer active:bg-white/5 border border-white/5"
                            >
                                <div className={`w-12 h-12 rounded-full ${chat.avatarColor} flex items-center justify-center text-white font-bold text-lg shadow-lg relative shrink-0`}>
                                    {chat.clientName?.charAt(0).toUpperCase() || '?'}
                                    <div className="absolute -bottom-1 -right-1 bg-tg-bg rounded-lg p-0.5">
                                        {getPlatformIcon(chat.platform)}
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-0.5">
                                        <h3 className="text-white font-semibold text-sm truncate pr-2">{chat.clientName || 'Без имени'}</h3>
                                        <span className="text-[10px] text-zinc-500 whitespace-nowrap">{chat.time}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className={`text-xs truncate max-w-[85%] ${chat.unread > 0 ? 'text-white font-medium' : 'text-zinc-500'}`}>
                                            {chat.lastMessage || 'Нет сообщений'}
                                        </p>
                                        {chat.unread > 0 && (
                                            <div className="w-5 h-5 rounded-full bg-accent-blue flex items-center justify-center text-[10px] font-bold text-white shrink-0 ml-2">
                                                {chat.unread}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {filteredChats.length === 0 && (
                        <div className="text-center py-20 text-zinc-500">
                            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>Чат не найден</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Chats;
