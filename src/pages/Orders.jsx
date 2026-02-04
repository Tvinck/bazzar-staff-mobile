import { useState, useEffect } from 'react';
import { Search, Filter, Clock } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import SwipeableOrderCard from '../components/SwipeableOrderCard';
import { SwipeableList, Type as ListType } from 'react-swipeable-list';
import PullToRefresh from 'react-simple-pull-to-refresh';
import { useBackButton } from '../hooks/useBackButton';
import { useSwipeBehavior } from '../hooks/useSwipeBehavior';

const Orders = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Telegram Mini Apps Integration
    useBackButton(); // Native back button
    useSwipeBehavior(false); // Disable vertical swipes (prevent closing while scrolling)


    // Звук уведомления
    const playNotificationSound = () => {
        try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.volume = 0.5;
            audio.play().catch(e => console.log('Audio play blocked:', e));
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        } catch (e) { console.error(e); }
    };

    // 1. React Query Fetching
    const { data: orders = [], isLoading, isError, refetch } = useQuery({
        queryKey: ['orders'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);
            if (error) throw error;
            return data;
        },
        staleTime: 60000,
    });

    const handleRefresh = async () => {
        if (navigator.vibrate) navigator.vibrate(20);
        await refetch();
        if (navigator.vibrate) navigator.vibrate(20);
    };

    // 2. Real-time Subscription
    useEffect(() => {
        const channel = supabase
            .channel('public:orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    playNotificationSound();
                    toast.success(`Новый заказ #${payload.new.id.slice(0, 8)}`);
                    queryClient.setQueryData(['orders'], (oldData) => [payload.new, ...oldData]);
                } else {
                    queryClient.invalidateQueries(['orders']);
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [queryClient]);

    const statusConfig = {
        'new': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', label: 'Новый' },
        'processing': { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', label: 'В обработке' },
        'completed': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', label: 'Выполнен' },
        'cancelled': { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', label: 'Отменен' }
    };

    const getStatusConfig = (status) => statusConfig[status] || statusConfig['new'];

    // Actions
    const handleComplete = async (orderId) => {
        if (navigator.vibrate) navigator.vibrate(50);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not found');

            const promise = supabase
                .from('orders')
                .update({
                    status: 'completed',
                    processed_by: user.id
                })
                .eq('id', orderId);

            toast.promise(promise, {
                loading: 'Завершаем заказ...',
                success: 'Заказ выполнен! (+50 XP)',
                error: 'Ошибка обновления'
            });

            queryClient.setQueryData(['orders'], (old) =>
                old.map(o => o.id === orderId ? { ...o, status: 'completed' } : o)
            );
        } catch (e) {
            toast.error('Ошибка авторизации');
        }
    };



    const handleTelegram = (order) => {
        if (navigator.vibrate) navigator.vibrate(50);
        const username = order.extra_data?.telegram || order.customer?.telegram;
        if (username) {
            const cleanUsername = username.replace('@', '');
            window.open(`https://t.me/${cleanUsername}`, '_blank');
        } else {
            toast.error('Telegram не найден');
        }
    };

    return (
        <div className="min-h-screen pb-20">
            {/* Header */}
            <div className="glass-panel border-b border-white/5 px-4 pt-12 pb-4 sticky top-0 z-20 backdrop-blur-xl bg-[#09090b]/80">
                <h1 className="text-2xl font-bold text-white mb-4 tracking-tight">Заказы</h1>

                {/* Search */}
                <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Поиск по номеру или клиенту..."
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                    />
                </div>

                {/* Filter */}
                <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-zinc-300 hover:bg-white/10 transition-all active:scale-95">
                    <Filter className="w-4 h-4" />
                    Фильтры
                </button>
            </div>

            {/* Orders List */}
            <div className="flex-1 overflow-hidden" id="scrollableDiv">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <p className="text-zinc-500 text-sm">Загружаем заказы...</p>
                    </div>
                ) : (
                    <PullToRefresh
                        onRefresh={handleRefresh}
                        pullingContent={<div className="text-center text-zinc-500 py-4 text-sm font-medium">Тяни сильнее...</div>}
                        refreshingContent={<div className="text-center text-blue-400 py-4 text-sm font-medium">Обновляем...</div>}
                        resistance={2.5}
                        className="min-h-[80vh]"
                    >
                        <div className="p-4 space-y-3 min-h-[80vh]">
                            <SwipeableList type={ListType.IOS}>
                                {orders.map((order) => (
                                    <SwipeableOrderCard
                                        key={order.id}
                                        order={order}
                                        onComplete={handleComplete}
                                        onTelegram={handleTelegram}
                                        getStatusConfig={getStatusConfig}
                                    />
                                ))}
                            </SwipeableList>
                            {orders.length === 0 && (
                                <div className="text-center text-zinc-500 py-20 flex flex-col items-center">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                        <Search className="w-8 h-8 text-zinc-600" />
                                    </div>
                                    <p>Нет активных заказов</p>
                                </div>
                            )}
                        </div>
                    </PullToRefresh>
                )}
            </div>

            <BottomNav />
        </div>
    );
};

export default Orders;
