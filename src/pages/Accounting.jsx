import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Calendar, Download, Wallet, PieChart, ShoppingBag, Globe, Zap, BarChart3, ArrowUpRight, Plus, X, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase';
import { Skeleton, TransactionSkeleton } from '../components/SkeletonLoader';
import { haptic } from '../utils/telegram';
import { toast } from 'sonner';

const Accounting = () => {
    const navigate = useNavigate();
    const [period, setPeriod] = useState('month');
    const [stats, setStats] = useState({
        revenue: 0,
        expenses: 0,
        profit: 0,
        avgOrder: 0,
        platformBreakdown: {},
        topProducts: [],
        dailyTrends: []
    });
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Form State
    const [newTrans, setNewTrans] = useState({ type: 'expense', amount: '', category: 'ads', description: '' });

    const periodLabels = {
        day: 'Сегодня',
        week: 'Неделя',
        month: 'Месяц',
        year: 'Год'
    };

    const categories = {
        expense: [
            { id: 'ads', label: 'Реклама', icon: '📢' },
            { id: 'salary', label: 'Зарплата', icon: '💰' },
            { id: 'server', label: 'Сервера', icon: '🖥️' },
            { id: 'purchase', label: 'Закупка', icon: '📦' },
            { id: 'other', label: 'Прочее', icon: '🔹' }
        ],
        income: [
            { id: 'manual', label: 'Ручной ввод', icon: '💵' },
            { id: 'other', label: 'Прочее', icon: '🔹' }
        ]
    };

    useEffect(() => {
        fetchAccountingData();
    }, [period]);

    const fetchAccountingData = async () => {
        setIsLoading(true);
        try {
            const now = new Date();
            let startDate = new Date();

            if (period === 'day') {
                startDate.setHours(0, 0, 0, 0);
            } else if (period === 'week') {
                startDate.setDate(now.getDate() - 7);
            } else if (period === 'month') {
                startDate.setMonth(now.getMonth() - 1);
            } else if (period === 'year') {
                startDate.setFullYear(now.getFullYear() - 1);
            }

            // 1. Fetch Orders (Income)
            const { data: orders, error: ordersError } = await supabase
                .from('orders')
                .select('*')
                .eq('status', 'completed')
                .gte('created_at', startDate.toISOString())
                .order('created_at', { ascending: false });

            if (ordersError) throw ordersError;

            // 2. Fetch Manual Transactions
            const { data: manualTrans, error: transError } = await supabase
                .from('transactions')
                .select('*')
                .gte('created_at', startDate.toISOString())
                .order('created_at', { ascending: false });

            if (transError) throw transError;

            // Platform fees estimates
            const fees = {
                yandex: 0.15,
                digiseller: 0.10,
                ggsel: 0.12,
                avito: 0.05
            };

            let revenue = 0;
            let expenses = 0;
            const breakdown = {};

            // Process Orders
            const orderItems = orders.map(order => {
                const amount = Number(order.total_amount) || 0;
                revenue += amount;

                const platform = order.platform || 'other';
                const feeRate = fees[platform] || 0.1;
                expenses += amount * feeRate; // Automatic expense (fee)

                if (!breakdown[platform]) breakdown[platform] = 0;
                breakdown[platform] += amount;

                return {
                    id: order.id,
                    title: order.product_name || `Заказ #${order.id.slice(0, 6)}`,
                    amount: amount,
                    platform: order.platform,
                    type: 'income',
                    date: new Date(order.created_at),
                    isManual: false
                };
            });

            // Process Manual Transactions
            const manualItems = (manualTrans || []).map(t => {
                const amount = Number(t.amount) || 0;
                if (t.type === 'income') {
                    revenue += amount;
                } else {
                    expenses += amount;
                }

                return {
                    id: t.id,
                    title: t.description || (t.category ? categories[t.type]?.find(c => c.id === t.category)?.label : 'Транзакция'),
                    amount: amount,
                    platform: 'manual',
                    type: t.type,
                    date: new Date(t.created_at),
                    isManual: true,
                    category: t.category
                };
            });

            // Combine & Sort
            const allItems = [...orderItems, ...manualItems].sort((a, b) => b.date - a.date);

            // Calculate Product Stats & Trends
            const productMap = {};
            const trendMap = {};

            orders.forEach(order => {
                const amount = Number(order.total_amount) || 0;
                const pName = order.product_name || 'Прочее';

                // Products
                productMap[pName] = (productMap[pName] || 0) + amount;

                // Trends (by Date)
                const date = new Date(order.created_at);
                let trendKey;
                if (period === 'day') trendKey = date.getHours() + ':00';
                else if (period === 'year') trendKey = date.toLocaleString('ru-RU', { month: 'short' });
                else trendKey = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

                trendMap[trendKey] = (trendMap[trendKey] || 0) + amount;
            });

            const topProducts = Object.entries(productMap)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([name, val]) => ({ name, revenue: val }));

            // Ensure daily trends are ordered correctly if needed, for simple objects we just get values
            // but for charts we might want a sorted list of dates
            const dailyTrends = Object.entries(trendMap).map(([label, value]) => ({ label, value }));

            setStats({
                revenue,
                expenses: Math.round(expenses),
                profit: Math.round(revenue - expenses),
                avgOrder: orders.length ? Math.round(revenue / orders.length) : 0,
                platformBreakdown: breakdown,
                topProducts,
                dailyTrends
            });

            setTransactions(allItems.map(t => ({
                ...t,
                dateStr: t.date.toLocaleDateString('ru-RU', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                })
            })));

        } catch (e) {
            console.error('Accounting Sync Error:', e);
            toast.error('Ошибка загрузки данных');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddTransaction = async () => {
        if (!newTrans.amount) return;

        try {
            const { error } = await supabase
                .from('transactions')
                .insert({
                    type: newTrans.type,
                    amount: Number(newTrans.amount),
                    category: newTrans.category,
                    description: newTrans.description,
                    created_at: new Date().toISOString()
                });

            if (error) throw error;

            toast.success('Транзакция добавлена');
            setIsAddModalOpen(false);
            setNewTrans({ type: 'expense', amount: '', category: 'ads', description: '' });
            fetchAccountingData();
        } catch (e) {
            console.error(e);
            toast.error('Ошибка сохранения');
        }
    };

    const handleExport = () => {
        if (transactions.length === 0) {
            haptic.notification('error');
            return;
        }

        haptic.impact('light');
        const headers = ['ID', 'Type', 'Title', 'Amount', 'Date'];
        const rows = transactions.map(t => [
            t.id,
            t.type,
            t.title.replace(/,/g, ''),
            t.amount,
            t.dateStr
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `bazzar_report_${period}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getPlatformInfo = (platform) => {
        const info = {
            yandex: { icon: <ShoppingBag className="w-4 h-4" />, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
            digiseller: { icon: <Globe className="w-4 h-4" />, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            ggsel: { icon: <Zap className="w-4 h-4" />, color: 'text-orange-500', bg: 'bg-orange-500/10' },
            manual: { icon: <Wallet className="w-4 h-4" />, color: 'text-purple-500', bg: 'bg-purple-500/10' }
        };
        return info[platform] || { icon: <Wallet className="w-4 h-4" />, color: 'text-zinc-400', bg: 'bg-zinc-500/10' };
    };

    const TrendChart = ({ data }) => {
        if (!data || data.length === 0) return null;
        const maxVal = Math.max(...data.map(d => d.value)) || 1;

        return (
            <div className="space-y-4">
                <div className="px-1 flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Динамика выручки</h3>
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="glass-card p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group">
                    <div className="flex items-end justify-between h-32 gap-2">
                        {data.map((item, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group/bar">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${(item.value / maxVal) * 100}%` }}
                                    className="w-full bg-accent-blue rounded-t-md opacity-30 group-hover/bar:opacity-100 transition-opacity relative"
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-white text-black px-2 py-1 rounded-lg text-[10px] font-black whitespace-nowrap shadow-xl z-10">
                                        {item.value.toLocaleString()} ₽
                                    </div>
                                </motion.div>
                                <span className="text-[8px] text-zinc-700 font-bold uppercase truncate w-full text-center">
                                    {item.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const TopProducts = ({ products }) => {
        if (!products || products.length === 0) return null;
        const maxRevenue = products[0]?.revenue || 1;

        return (
            <div className="space-y-4">
                <div className="px-1 flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Топ товаров</h3>
                    <ShoppingBag className="w-4 h-4 text-zinc-700" />
                </div>
                <div className="space-y-3">
                    {products.map((p, i) => (
                        <div key={i} className="glass-card p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
                            <div className="flex justify-between items-start mb-2">
                                <p className="text-xs font-bold text-white truncate pr-4 max-w-[200px]">{p.name}</p>
                                <p className="text-xs font-black tabular-nums">{p.revenue.toLocaleString()} ₽</p>
                            </div>
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(p.revenue / maxRevenue) * 100}%` }}
                                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen pb-24 bg-[#09090b] text-white">
            <div className="fixed top-0 left-0 w-full h-[400px] bg-accent-blue/5 blur-[120px] pointer-events-none" />

            {/* Header */}
            <div className="px-4 pt-12 pb-6 sticky top-0 z-30 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/5">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => { navigate(-1); haptic.impact('light'); }}
                            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 text-zinc-400 hover:text-white transition-colors border border-white/10"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-xl font-black tracking-tight uppercase">Учет</h1>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="w-10 h-10 rounded-xl bg-accent-blue flex items-center justify-center text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-transform"
                    >
                        <Plus className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                    {Object.entries(periodLabels).map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => { setPeriod(key); haptic.impact('light'); }}
                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${period === key
                                ? 'bg-white text-black shadow-xl scale-[1.02]'
                                : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <main className="p-4 space-y-6 relative z-10">
                {/* Hero Balance Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative p-8 rounded-[32px] overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/10 shadow-2xl"
                >
                    <div className="absolute top-0 right-0 w-48 h-48 bg-accent-blue/20 blur-[60px] -mr-20 -mt-20 rounded-full" />

                    <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3 opacity-60">Текущая прибыль</p>
                    <div className="flex items-baseline gap-2 mb-6">
                        <h2 className="text-5xl font-black tracking-tighter tabular-nums">
                            {isLoading ? <Skeleton className="h-12 w-48 mb-1" /> : stats.profit?.toLocaleString() || '0'}
                        </h2>
                        <span className="text-2xl font-bold text-zinc-500">₽</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <TrendingUp className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase truncate">Доход</p>
                                <p className="font-bold tabular-nums">+{stats.revenue?.toLocaleString() || '0'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                                <TrendingDown className="w-4 h-4 text-red-400" />
                            </div>
                            <div>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase truncate">Расход</p>
                                <p className="font-bold tabular-nums">-{stats.expenses?.toLocaleString() || '0'}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Platforms Breakdown */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">По источникам</h3>
                        <BarChart3 className="w-4 h-4 text-zinc-700" />
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {isLoading ? (
                            Array(3).fill(0).map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                            ))
                        ) : Object.entries(stats.platformBreakdown).length > 0 ? (
                            Object.entries(stats.platformBreakdown).sort((a, b) => b[1] - a[1]).map(([platform, amount]) => {
                                const info = getPlatformInfo(platform);
                                const percentage = Math.round((amount / stats.revenue) * 100);
                                if (percentage < 1) return null;
                                return (
                                    <motion.div
                                        key={platform}
                                        layout
                                        className="glass-card p-4 rounded-2xl border border-white/5 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl ${info.bg} ${info.color} flex items-center justify-center border border-white/5`}>
                                                {info.icon}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-wider">{platform}</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-1 w-20 bg-white/5 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${percentage}%` }}
                                                            className={`h-full ${info.bg.replace('/10', '')}`}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] text-zinc-500 font-bold">{percentage}%</span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="font-black text-sm tracking-tight">{amount?.toLocaleString() || '0'} ₽</p>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="text-center py-6 text-zinc-600 border border-white/5 border-dashed rounded-2xl text-[10px] font-bold uppercase">
                                Нет данных
                            </div>
                        )}
                    </div>
                </div>

                {/* Growth Trends Chart */}
                {!isLoading && <TrendChart data={stats.dailyTrends} />}

                {/* Top Products */}
                {!isLoading && <TopProducts products={stats.topProducts} />}

                {/* Transactions List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Операции</h3>
                        <button
                            onClick={handleExport}
                            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 active:bg-white/10"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-2">
                        <AnimatePresence mode='popLayout'>
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <TransactionSkeleton key={i} />
                                ))
                            ) : transactions.length > 0 ? (
                                transactions.map(t => (
                                    <motion.div
                                        key={t.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-transform"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-white/5 ${t.type === 'income' ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10' : 'bg-red-500/5 text-red-400 border-red-500/10'
                                                }`}>
                                                {t.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold truncate pr-4 uppercase tracking-tighter">{t.title}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">{t.platform === 'manual' ? (t.category || 'Ручной') : t.platform}</span>
                                                    <span className="w-1 h-1 bg-zinc-800 rounded-full" />
                                                    <span className="text-[9px] text-zinc-600 font-bold">{t.dateStr}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className={`text-sm font-black tabular-nums ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {t.type === 'income' ? '+' : '-'}{Math.abs(t.amount)?.toLocaleString()} ₽
                                        </p>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="py-20 text-center">
                                    <p className="text-sm text-zinc-600 font-bold uppercase tracking-widest">Нет транзакций</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>

            {/* Add Transaction Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsAddModalOpen(false)}
                            className="fixed inset-0 bg-black/80 z-50 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 bg-[#09090b] rounded-t-[32px] border-t border-white/10 z-50 p-6 pb-24 shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black uppercase tracking-tight">Новая запись</h3>
                                <button onClick={() => setIsAddModalOpen(false)} className="p-2 bg-white/5 rounded-full text-zinc-400">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
                                    <button
                                        onClick={() => setNewTrans({ ...newTrans, type: 'expense' })}
                                        className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${newTrans.type === 'expense' ? 'bg-red-500 text-white shadow-lg' : 'text-zinc-500'}`}
                                    >
                                        Расход
                                    </button>
                                    <button
                                        onClick={() => setNewTrans({ ...newTrans, type: 'income' })}
                                        className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${newTrans.type === 'income' ? 'bg-emerald-500 text-white shadow-lg' : 'text-zinc-500'}`}
                                    >
                                        Доход
                                    </button>
                                </div>

                                <div>
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2 block">Сумма</label>
                                    <input
                                        type="number"
                                        value={newTrans.amount}
                                        onChange={(e) => setNewTrans({ ...newTrans, amount: e.target.value })}
                                        placeholder="0 ₽"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-2xl font-black text-white focus:border-accent-blue focus:outline-none"
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2 block">Категория</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {categories[newTrans.type].map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => setNewTrans({ ...newTrans, category: cat.id })}
                                                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${newTrans.category === cat.id
                                                    ? 'bg-white/10 border-white text-white'
                                                    : 'bg-white/5 border-white/5 text-zinc-500 hover:bg-white/10'}`}
                                            >
                                                <span className="text-xl">{cat.icon}</span>
                                                <span className="text-[9px] font-bold uppercase">{cat.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2 block">Описание (необязательно)</label>
                                    <input
                                        type="text"
                                        value={newTrans.description}
                                        onChange={(e) => setNewTrans({ ...newTrans, description: e.target.value })}
                                        placeholder="Например: Оплата хостинга"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-bold text-white focus:border-accent-blue focus:outline-none"
                                    />
                                </div>

                                <button
                                    onClick={handleAddTransaction}
                                    disabled={!newTrans.amount}
                                    className="w-full bg-white text-black font-black uppercase tracking-wider py-4 rounded-xl mt-4 active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100"
                                >
                                    Сохранить
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Accounting;
