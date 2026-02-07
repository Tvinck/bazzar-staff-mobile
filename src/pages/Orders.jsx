import { useState, useEffect } from 'react'; // Re-triggering HMR
import { Search, Filter, Clock, ShoppingBag, Globe, Zap, Circle } from 'lucide-react';
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
import { haptic } from '../utils/telegram';
import { OrderSkeleton } from '../components/SkeletonLoader';

const Orders = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('all');
    const [platformTab, setPlatformTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Telegram Mini Apps Integration
    useBackButton();
    useSwipeBehavior(false);

    // React Query Fetching
    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['orders', platformTab],
        queryFn: async () => {
            let query = supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(200);

            if (platformTab !== 'all') {
                query = query.eq('platform', platformTab);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        },
        staleTime: 30000,
    });

    const handleRefresh = async () => {
        haptic.impact('light');
        await queryClient.invalidateQueries(['orders']);
    };

    // Real-time
    useEffect(() => {
        const channel = supabase
            .channel('public:orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
                if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                    queryClient.setQueryData(['orders'], (old = []) => {
                        const exists = old.find(o => o.id === payload.new.id);
                        if (exists) {
                            return old.map(o => o.id === payload.new.id ? payload.new : o);
                        }
                        if (payload.eventType === 'INSERT') {
                            haptic.notification('success');
                            toast.success(`Новый заказ #${payload.new.id.slice(0, 8)}`);
                        }
                        return [payload.new, ...old];
                    });
                } else {
                    queryClient.invalidateQueries(['orders']);
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [queryClient]);

    const statusConfig = {
        'new': { bg: 'bg-accent-blue/10', text: 'text-accent-blue', border: 'border-accent-blue/20', label: 'Новый' },
        'processing': { bg: 'bg-accent-orange/10', text: 'text-accent-orange', border: 'border-accent-orange/20', label: 'В работе' },
        'completed': { bg: 'bg-accent-green/10', text: 'text-accent-green', border: 'border-accent-green/20', label: 'Готов' },
        'cancelled': { bg: 'bg-accent-red/10', text: 'text-accent-red', border: 'border-accent-red/20', label: 'Отмена' }
    };

    const getStatusConfig = (status) => statusConfig[status] || statusConfig['new'];

    const handleComplete = async (orderId) => {
        haptic.impact('medium');
        try {
            const { error } = await supabase
                .from('orders')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString()
                })
                .eq('id', orderId);
            if (error) throw error;
            toast.success('Заказ выполнен');
        } catch (e) {
            toast.error('Ошибка при обновлении');
        }
    };

    const handleChat = async (order) => {
        haptic.impact('light');
        if (!order.external_id || !order.platform) {
            toast.error('Инфо о заказе неполное');
            return;
        }

        try {
            const { data, error } = await supabase
                .from('platform_chats')
                .select('id')
                .eq('platform', order.platform)
                .eq('external_id', order.external_id)
                .single();

            if (data) {
                navigate(`/chats/${data.id}`);
            } else {
                toast.error('Чат с покупателем не найден');
            }
        } catch (e) {
            toast.error('Сначала синхронизируйте чаты');
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesStatus = activeTab === 'all'
            || order.status === activeTab
            || (activeTab === 'new' && order.status === 'pending');

        const matchesPlatform = platformTab === 'all' || order.platform === platformTab;
        const customerName = order.metadata?.customer_name ?? order.customer?.name ?? '';
        const buyerEmail = order.metadata?.buyer_email ?? '';
        const productName = order.product_name ?? '';
        const platformField = order.platform || order.metadata?.platform || '';

        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
            (order.id && order.id.toLowerCase().includes(searchLower)) ||
            customerName.toLowerCase().includes(searchLower) ||
            buyerEmail.toLowerCase().includes(searchLower) ||
            productName.toLowerCase().includes(searchLower) ||
            platformField.toLowerCase().includes(searchLower);

        return matchesStatus && matchesPlatform && matchesSearch;
    });

    const statusTabs = [
        { id: 'all', label: 'Все' },
        { id: 'new', label: 'Новые' },
        { id: 'processing', label: 'В работе' },
        { id: 'completed', label: 'Готовые' },
    ];

    const platformTabs = [
        { id: 'all', label: 'Все платф.', icon: null },
        { id: 'yandex', label: 'Yandex', icon: <ShoppingBag className="w-3 h-3" /> },
        { id: 'digiseller', label: 'Digi', icon: <Globe className="w-3 h-3" /> },
        { id: 'ggsel', label: 'GGSel', icon: <Zap className="w-3 h-3" /> },
        { id: 'avito', label: 'Avito', icon: <Circle className="w-3 h-3" /> },
    ];

    return (
        <div className="min-h-screen pb-24 bg-tg-bg relative">
            {/* Header Area */}
            <div className="fixed top-0 left-0 right-0 z-20 bg-tg-bg/80 backdrop-blur-xl border-b border-white/5 pt-safe px-4 pb-2">
                <div className="flex items-center justify-between mb-4 mt-2">
                    <h1 className="text-2xl font-bold text-white tracking-tight">Заказы</h1>
                    <div className="w-8 h-8 rounded-full bg-accent-blue/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-accent-blue">{filteredOrders.length}</span>
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Поиск..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-accent-blue/50 transition-all"
                    />
                </div>

                {/* Status Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-2 border-b border-white/5">
                    {statusTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); haptic.impact('light'); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${activeTab === tab.id
                                ? 'bg-white text-black border-white shadow-lg'
                                : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Platform Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {platformTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setPlatformTab(tab.id); haptic.impact('light'); }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${platformTab === tab.id
                                ? 'bg-accent-blue text-white border-accent-blue shadow-lg'
                                : 'bg-white/5 text-zinc-500 border-white/5 hover:bg-white/10'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="pt-[160px] px-4 min-h-screen">
                <PullToRefresh
                    onRefresh={handleRefresh}
                    pullingContent={<div className="text-center text-zinc-500 py-4 text-xs">Тяни...</div>}
                >
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <OrderSkeleton key={i} />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3 pb-safe">
                            <SwipeableList type={ListType.IOS}>
                                {filteredOrders.map((order) => (
                                    <SwipeableOrderCard
                                        key={order.id}
                                        order={order}
                                        onComplete={handleComplete}
                                        onChat={handleChat}
                                        getStatusConfig={getStatusConfig}
                                    />
                                ))}
                            </SwipeableList>

                            {filteredOrders.length === 0 && (
                                <div className="py-20 text-center">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Search className="w-8 h-8 text-zinc-600" />
                                    </div>
                                    <p className="text-zinc-500 font-medium">Ничего не найдено</p>
                                </div>
                            )}
                        </div>
                    )}
                </PullToRefresh>
            </div>

            <BottomNav />
        </div>
    );
};

export default Orders;
