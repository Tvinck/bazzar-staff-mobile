import { Package, DollarSign, AlertCircle, TrendingUp, Clock, CheckCircle, Bell, User } from 'lucide-react';
import StatCard from '../components/StatCard';
import BottomNav from '../components/BottomNav';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useState, useEffect } from 'react';

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        newOrders: 0,
        todayRevenue: '0',
        completedToday: 0,
        weeklyGrowth: '+0%',
        pendingManual: 0,
        avgTime: '-',
    });

    const [recentOrders, setRecentOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasNotifications, setHasNotifications] = useState(false);

    useEffect(() => {
        const fetchDashboardData = async () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // 1. Fetch Stats
            // New Orders
            const { count: newOrdersCount } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending'); // Assuming 'pending' is new

            // Orders for Revenue & Completed Today
            const { data: todayOrders } = await supabase
                .from('orders')
                .select('price, status, created_at')
                .gte('created_at', today.toISOString());

            const revenue = todayOrders?.reduce((acc, order) => acc + (order.price || 0), 0) || 0;
            const completed = todayOrders?.filter(o => o.status === 'delivered' || o.status === 'completed').length || 0;

            // Pending Manual Processing (Processing status)
            const { count: pendingCount } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'processing');

            // 2. Fetch Recent Orders
            const { data: recentOrdersData } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            setStats({
                newOrders: newOrdersCount || 0,
                todayRevenue: revenue.toLocaleString(),
                completedToday: completed,
                weeklyGrowth: '+0%', // Placeholder for now
                pendingManual: pendingCount || 0,
                avgTime: '~10 мин',
            });

            if (recentOrdersData) {
                setRecentOrders(recentOrdersData.map(order => ({
                    id: order.id,
                    customer: order.metadata?.customer_name || order.metadata?.buyer?.firstName || 'Гость',
                    product: order.product_name || 'Товар',
                    amount: order.price,
                    status: order.status,
                    time: new Date(order.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                })));
            }

            setIsLoading(false);
        };

        fetchDashboardData();

        const channel = supabase
            .channel('dashboard_updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchDashboardData)
            .subscribe();

        return () => { supabase.removeChannel(channel) };
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
            case 'processing': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'completed':
            case 'delivered': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20';
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

    return (
        <div className="min-h-screen pb-24 bg-tg-bg">
            {/* Header */}
            <div className="px-6 pt-12 pb-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Панель управления</h1>
                        <p className="text-zinc-400 text-sm mt-1 font-medium">Bazzar Staff Mobile</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/notifications')}
                            className="w-10 h-10 rounded-xl glass-panel flex items-center justify-center border border-white/5 tap-active relative bg-tg-secondary"
                        >
                            <Bell className="w-5 h-5 text-zinc-400" />
                            {hasNotifications && (
                                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6]"></span>
                            )}
                        </button>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20 active:scale-95 transition-transform cursor-pointer border border-white/10" onClick={() => navigate('/profile')}>
                            <User className="w-5 h-5 text-white" />
                        </div>
                    </div>
                </div>

                {/* Quick Stats Bar */}
                <div
                    onClick={() => navigate('/accounting')}
                    className="fintech-card rounded-2xl p-5 active:scale-98 transition-transform cursor-pointer group border border-white/10 bg-zinc-900/50 backdrop-blur-md"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-zinc-400 text-xs mb-1.5 font-bold uppercase tracking-wider">Доход сегодня</p>
                            {isLoading ? (
                                <div className="h-8 w-24 bg-zinc-800 rounded animate-pulse" />
                            ) : (
                                <p className="text-3xl font-black text-white group-hover:text-blue-400 transition-colors tracking-tight">{stats.todayRevenue} ₽</p>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm font-bold text-emerald-400">{stats.weeklyGrowth}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="px-4 py-2 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <StatCard
                        icon={<Package className="w-5 h-5" />}
                        title="Новые"
                        value={stats.newOrders}
                        subtitle="заказов"
                        color="blue"
                        loading={isLoading}
                    />

                    <button
                        onClick={() => navigate('/orders')}
                        className="fintech-card rounded-2xl p-4 text-left border border-white/10 bg-zinc-900/50 active:scale-98 transition-all"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-2">В работе</p>
                                <p className="text-2xl font-bold text-white mb-1">{stats.pendingManual}</p>
                                <p className="text-xs text-zinc-500 font-medium">активны</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center border bg-orange-500/10 text-orange-500 border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
                                <Clock className="w-5 h-5" />
                            </div>
                        </div>
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <StatCard
                        icon={<CheckCircle className="w-5 h-5" />}
                        title="Готово"
                        value={stats.completedToday}
                        subtitle="сегодня"
                        color="emerald"
                        loading={isLoading}
                    />

                    <StatCard
                        icon={<Clock className="w-5 h-5" />}
                        title="Ср. время"
                        value={stats.avgTime}
                        subtitle="на заказ"
                        color="purple"
                        loading={isLoading}
                    />
                </div>
            </div>

            {/* Recent Orders */}
            <div className="px-4 mb-6 mt-6">
                <div className="flex items-center justify-between mb-4 px-1">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        Последние заказы
                        {stats.newOrders > 0 && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_#3b82f6]"></span>}
                    </h2>
                    <button onClick={() => navigate('/orders')} className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-bold bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20">
                        Все
                    </button>
                </div>

                <div className="space-y-2.5">
                    {isLoading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="h-20 bg-zinc-900 rounded-2xl animate-pulse border border-white/5" />
                        ))
                    ) : recentOrders.length > 0 ? (
                        recentOrders.map((order) => (
                            <div
                                key={order.id}
                                className="fintech-card rounded-2xl p-4 active:scale-95 transition-transform cursor-pointer border border-white/10 bg-zinc-900/80 hover:bg-zinc-800"
                                onClick={() => navigate(`/orders/${order.id}`)}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <p className="text-sm font-bold text-white mb-0.5">{order.customer}</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[10px] text-zinc-500 font-mono px-1.5 py-0.5 bg-zinc-800 rounded">#{order.id.slice(0, 8)}</p>
                                            <p className="text-xs text-zinc-500">• {order.time}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(order.status)}`}>
                                        {getStatusText(order.status)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between mt-3">
                                    <p className="text-sm text-zinc-300 font-medium truncate max-w-[200px]">{order.product}</p>
                                    <p className="text-base font-bold text-white tracking-tight">{order.amount?.toLocaleString()} ₽</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-zinc-500 text-sm bg-zinc-900/50 rounded-2xl border border-white/5 border-dashed">
                            Заказов пока нет
                        </div>
                    )}
                </div>
            </div>

            <BottomNav />
        </div>
    );
};

export default Dashboard;
