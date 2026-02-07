import { Package, DollarSign, Clock, CheckCircle, Bell, User, TrendingUp, ShoppingBag, Globe, Zap, Circle } from 'lucide-react';
import StatCard from '../components/StatCard';
import BottomNav from '../components/BottomNav';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { OrderSkeleton } from '../components/SkeletonLoader';

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        newOrders: 0,
        todayRevenue: '0',
        completedToday: 0,
        totalToday: 0,
        weeklyGrowth: '+12%',
        pendingManual: 0,
        avgTime: '15м',
    });

    const [recentOrders, setRecentOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasNotifications, setHasNotifications] = useState(false);
    const [chatsCount, setChatsCount] = useState(0);

    useEffect(() => {
        let isMounted = true;
        let fetchTimeout = null;

        const fetchDashboardData = async () => {
            if (!isMounted) return;
            try {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                // Fetching all needed data in parallel for speed
                const [
                    { count: newCount },
                    { count: processingCount },
                    { data: todayOrders },
                    { data: todayTransactions },
                    { data: chatsData },
                    { data: recent }
                ] = await Promise.all([
                    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'processing'),
                    supabase.from('orders').select('total_amount, price, status, platform').gte('created_at', today.toISOString()),
                    supabase.from('transactions').select('amount, type').gte('created_at', today.toISOString()),
                    supabase.from('platform_chats').select('unread_count'),
                    supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5)
                ]);

                if (!isMounted) return;

                // Platforms Fees (same as in Accounting)
                const fees = {
                    yandex: 0.15,
                    digiseller: 0.10,
                    ggsel: 0.12,
                    avito: 0.05
                };

                // Revenue & Completed
                let revenue = 0;
                let expenses = 0;
                let completed = 0;

                todayOrders?.forEach(o => {
                    const amt = Number(o.total_amount || o.price) || 0;
                    if (o.status !== 'cancelled') {
                        revenue += amt;
                        // Calculate Fee Expense
                        const feeRate = fees[o.platform || 'other'] || 0.1;
                        expenses += amt * feeRate;
                    }
                    if (o.status === 'completed' || o.status === 'delivered') completed++;
                });

                // Add Manual Transactions
                todayTransactions?.forEach(t => {
                    const amt = Number(t.amount) || 0;
                    if (t.type === 'income') {
                        revenue += amt;
                    } else {
                        expenses += amt;
                    }
                });

                const profit = revenue - expenses;

                // 2. Growth Calculation (Last 7 days vs Previous 7 days)
                // ... (Keep existing growth logic if needed, or simplify)
                const weekAgo = new Date();
                weekAgo.setDate(today.getDate() - 7);
                const twoWeeksAgo = new Date();
                twoWeeksAgo.setDate(today.getDate() - 14);

                const { data: weekData } = await supabase
                    .from('orders')
                    .select('total_amount, price')
                    .neq('status', 'cancelled')
                    .gte('created_at', weekAgo.toISOString());

                const { data: prevWeekData } = await supabase
                    .from('orders')
                    .select('total_amount')
                    .neq('status', 'cancelled')
                    .gte('created_at', twoWeeksAgo.toISOString())
                    .lt('created_at', weekAgo.toISOString());

                const currentWeekRevenue = weekData?.reduce((acc, o) => acc + (Number(o.total_amount || o.price) || 0), 0) || 0;
                const prevWeekRevenue = prevWeekData?.reduce((acc, o) => acc + (Number(o.total_amount || o.price) || 0), 0) || 0;

                let growth = '+0%';
                if (prevWeekRevenue > 0) {
                    const diff = ((currentWeekRevenue - prevWeekRevenue) / prevWeekRevenue) * 100;
                    growth = (diff >= 0 ? '+' : '') + Math.round(diff) + '%';
                }

                // 3. Average Fulfillment Time (Last 50 completed orders)
                const { data: completedTimes } = await supabase
                    .from('orders')
                    .select('created_at, completed_at')
                    .eq('status', 'completed')
                    .not('completed_at', 'is', null)
                    .order('completed_at', { ascending: false })
                    .limit(50);

                let avgMins = '-';
                if (completedTimes?.length > 0) {
                    const totalMins = completedTimes.reduce((acc, o) => {
                        const start = new Date(o.created_at);
                        const end = new Date(o.completed_at);
                        return acc + (end - start) / (1000 * 60);
                    }, 0);
                    const avg = Math.round(totalMins / completedTimes.length);
                    avgMins = avg > 60 ? Math.round(avg / 60) + 'ч' : avg + 'м';
                }

                const totalUnread = chatsData?.reduce((acc, c) => acc + (Number(c.unread_count) || 0), 0) || 0;

                if (isMounted) {
                    setStats({
                        newOrders: newCount || 0,
                        todayRevenue: revenue.toLocaleString(),
                        todayProfit: Math.round(profit).toLocaleString(), // New field
                        todayExpenses: Math.round(expenses).toLocaleString(), // New field
                        completedToday: completed || 0,
                        totalToday: todayOrders?.length || 0,
                        weeklyGrowth: growth,
                        pendingManual: processingCount || 0,
                        avgTime: avgMins,
                    });

                    setChatsCount(totalUnread);

                    if (recent) {
                        setRecentOrders(recent.map(o => ({
                            id: o.id,
                            customer: o.metadata?.customer_name || o.metadata?.buyer_email || 'Клиент',
                            product: o.product_name || 'Товар',
                            amount: Number(o.total_amount || o.price) || 0,
                            status: o.status === 'pending' ? 'pending' : o.status,
                            platform: o.platform || 'yandex',
                            time: new Date(o.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                        })));
                    }
                }
            } catch (err) {
                console.error('❌ Dashboard Error:', err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        // Debounced fetch to avoid rapid-fire updates
        const debouncedFetch = () => {
            if (fetchTimeout) clearTimeout(fetchTimeout);
            fetchTimeout = setTimeout(fetchDashboardData, 300);
        };

        debouncedFetch();

        const subscription = supabase
            .channel('dashboard_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, debouncedFetch)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'platform_chats' }, debouncedFetch)
            .subscribe();

        return () => {
            isMounted = false;
            if (fetchTimeout) clearTimeout(fetchTimeout);
            supabase.removeChannel(subscription);
        };
    }, []);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'pending': return 'bg-accent-orange/10 text-accent-orange border-accent-orange/20';
            case 'processing': return 'bg-accent-blue/10 text-accent-blue border-accent-blue/20';
            case 'completed':
            case 'delivered': return 'bg-accent-green/10 text-accent-green border-accent-green/20';
            case 'cancelled': return 'bg-accent-red/10 text-accent-red border-accent-red/20';
            default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending': return 'Новый';
            case 'processing': return 'В работе';
            case 'completed':
            case 'delivered': return 'Готов';
            case 'cancelled': return 'Отмена';
            default: return status;
        }
    };

    const getPlatformIcon = (platform) => {
        const p = platform?.toLowerCase() || 'other';
        if (p.includes('yandex')) return <ShoppingBag className="w-3.5 h-3.5 text-yellow-500" />;
        if (p.includes('digi')) return <Globe className="w-3.5 h-3.5 text-blue-500" />;
        if (p.includes('ggsel')) return <Zap className="w-3.5 h-3.5 text-orange-500" />;
        if (p.includes('avito')) return <Circle className="w-3.5 h-3.5 text-green-500" />;
        return <Package className="w-3.5 h-3.5 text-zinc-400" />;
    };

    return (
        <div className="min-h-screen pb-24 bg-tg-bg relative overflow-hidden">
            {/* Background Ambient Effects */}
            <div className="fixed top-0 left-0 w-full h-96 bg-accent-blue/5 blur-[120px] rounded-b-[100%] pointer-events-none" />

            {/* Header */}
            <header className="px-6 pt-safe pb-4 relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Панель</h1>
                        <p className="text-zinc-400 text-sm font-medium">Bazzar Staff Mobile</p>
                    </motion.div>

                    <div className="flex items-center gap-3">
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/notifications')}
                            className="w-11 h-11 rounded-2xl glass flex items-center justify-center relative hover:bg-white/5 transition-colors"
                        >
                            <Bell className="w-5 h-5 text-zinc-300" />
                            {hasNotifications && (
                                <span className="absolute top-3 right-3 w-2 h-2 bg-accent-blue rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse"></span>
                            )}
                        </motion.button>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                            className="w-11 h-11 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center shadow-lg shadow-accent-blue/20 cursor-pointer"
                            onClick={() => navigate('/profile')}
                        >
                            <User className="w-5 h-5 text-white" />
                        </motion.div>
                    </div>
                </div>

                {/* Main Stats Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    onClick={() => navigate('/accounting')}
                    className="glass-card p-6 rounded-3xl relative group cursor-pointer border border-white/10"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative z-10 flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 rounded-lg bg-emerald-500/20">
                                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                                </div>
                                <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Прибыль за сегодня</span>
                            </div>

                            {isLoading ? (
                                <div className="h-10 w-32 bg-white/5 rounded-lg animate-pulse" />
                            ) : (
                                <h2 className="text-4xl font-bold text-white tracking-tight tabular-nums">
                                    {stats.todayProfit || 0} ₽
                                </h2>
                            )}
                        </div>

                        <div className="text-right">
                            <div className="flex items-center gap-1.5 justify-end bg-white/5 px-2 py-1 rounded-lg border border-white/5 mb-1">
                                <span className="text-[10px] uppercase text-zinc-500 font-bold">Оборот</span>
                                <span className="text-sm font-bold text-white tabular-nums">{stats.todayRevenue} ₽</span>
                            </div>
                            <div className="flex items-center gap-1.5 justify-end bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                                <span className="text-[10px] uppercase text-zinc-500 font-bold">Расход</span>
                                <span className="text-sm font-bold text-red-300 tabular-nums">-{stats.todayExpenses} ₽</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </header>

            {/* Stats Grid */}
            <div className="px-4 space-y-3 relative z-10">
                <div className="grid grid-cols-2 gap-3">
                    <StatCard
                        isLoading={isLoading}
                        icon={Package}
                        title="Заказы сегодня"
                        value={stats.totalToday}
                        subtitle={`${stats.newOrders} новых`}
                        color="blue"
                        delay={0.2}
                    />
                    <StatCard
                        isLoading={isLoading}
                        icon={Clock}
                        title="В работе"
                        value={stats.pendingManual}
                        subtitle="активные"
                        color="orange"
                        delay={0.3}
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <StatCard
                        isLoading={isLoading}
                        icon={Bell}
                        title="Чаты"
                        value={chatsCount}
                        subtitle="непрочитанных"
                        color="purple"
                        delay={0.4}
                    />
                    <StatCard
                        isLoading={isLoading}
                        icon={CheckCircle}
                        title="Готово"
                        value={stats.completedToday}
                        subtitle="за сегодня"
                        color="green"
                        delay={0.5}
                    />
                </div>
            </div >

            {/* Recent Orders */}
            < motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="px-4 mt-8 mb-6 relative z-10"
            >
                <div className="flex items-center justify-between mb-4 pl-1">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        Последние заказы
                    </h2>
                    <button onClick={() => navigate('/orders')} className="text-sm text-accent-blue font-medium hover:text-white transition-colors">
                        Показать все
                    </button>
                </div>

                <div className="space-y-3">
                    {isLoading ? (
                        [1, 2, 3].map(i => (
                            <OrderSkeleton key={i} />
                        ))
                    ) : recentOrders.length > 0 ? (
                        recentOrders.map((order, i) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.6 + (i * 0.1) }}
                                onClick={() => navigate(`/orders/${order.id}`)}
                                className="glass-card p-4 rounded-2xl active:scale-98 cursor-pointer flex items-center justify-between group border border-white/5"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-white/5 bg-white/5`}>
                                        {getPlatformIcon(order.platform)}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-white font-bold truncate">{order.customer}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${getStatusStyle(order.status)} border-none bg-opacity-20`}>
                                                {getStatusText(order.status)}
                                            </span>
                                            <span className="text-xs text-zinc-500">•</span>
                                            <span className="text-xs text-zinc-400 truncate max-w-[100px]">{order.product}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-white font-bold tracking-tight">{order.amount?.toLocaleString()} ₽</p>
                                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{order.time}</p>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center py-12 glass rounded-2xl border-dashed border-zinc-700">
                            <Package className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                            <p className="text-zinc-500 font-medium">Заказов пока нет</p>
                        </div>
                    )}
                </div>
            </motion.div >

            <BottomNav />
        </div >
    );
};

export default Dashboard;
