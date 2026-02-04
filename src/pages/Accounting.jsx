import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Calendar, Download, Wallet, PieChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

const Accounting = () => {
    const navigate = useNavigate();
    const [period, setPeriod] = useState('month');
    const [stats, setStats] = useState({ revenue: 0, expenses: 0, profit: 0, growth: '0%' });
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchAccountingData();
    }, [period]);

    const fetchAccountingData = async () => {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Determine date range
        const now = new Date();
        let startDate = new Date();

        if (period === 'day') startDate.setDate(now.getDate() - 1);
        if (period === 'week') startDate.setDate(now.getDate() - 7);
        if (period === 'month') startDate.setMonth(now.getMonth() - 1);
        if (period === 'year') startDate.setFullYear(now.getFullYear() - 1);

        // Fetch completed orders (Income)
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*')
            .eq('status', 'completed')
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching accounting:', error);
            setIsLoading(false);
            return;
        }

        // Calculate Revenue
        const revenue = orders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);

        // Mock Expenses (e.g., commissions, refunds, etc.)
        const expenses = Math.floor(revenue * 0.15);
        const profit = revenue - expenses;

        setStats({
            revenue,
            expenses,
            profit,
            growth: '+12%' // Mock
        });

        // Map orders to transactions list
        const txs = orders.map(order => ({
            id: order.id,
            title: order.items?.[0]?.name || `Заказ #${order.id.slice(0, 6)}`,
            amount: order.total_amount,
            type: 'income',
            date: new Date(order.created_at).toLocaleDateString('ru-RU', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
            })
        }));

        setTransactions(txs);
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen pb-20">
            {/* Header with Balance */}
            <div className="glass-panel border-b border-white/5 pb-6 pt-12 px-4 sticky top-0 z-10 backdrop-blur-xl bg-[#09090b]/80">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/')}
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-xl font-bold text-white tracking-tight">Бухгалтерия</h1>
                    </div>
                </div>

                <div className="flex justify-center mb-6">
                    <div className="bg-white/5 p-1 rounded-xl flex w-full max-w-sm">
                        {['day', 'week', 'month', 'year'].map(p => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${period === p
                                    ? 'bg-zinc-800 text-white shadow-lg'
                                    : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                            >
                                {p === 'day' ? 'День' : p === 'week' ? 'Неделя' : p === 'month' ? 'Месяц' : 'Год'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="text-center">
                    <p className="text-zinc-400 text-xs mb-2 font-medium uppercase tracking-wider">Чистая прибыль</p>
                    <div className="flex items-end justify-center gap-2 mb-2">
                        <h2 className="text-4xl font-bold text-white tracking-tighter">
                            {isLoading ? '...' : stats.profit.toLocaleString()} <span className="text-2xl text-zinc-500">₽</span>
                        </h2>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 text-xs font-bold">{stats.growth} за период</span>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="fintech-card p-4 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                <TrendingUp className="w-4 h-4 text-emerald-400" />
                            </div>
                            <span className="text-xs font-bold text-zinc-400 uppercase">Доход</span>
                        </div>
                        <p className="text-xl font-bold text-white">+{isLoading ? '...' : stats.revenue.toLocaleString()}</p>
                    </div>

                    <div className="fintech-card p-4 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20">
                                <TrendingDown className="w-4 h-4 text-red-400" />
                            </div>
                            <span className="text-xs font-bold text-zinc-400 uppercase">Расход</span>
                        </div>
                        <p className="text-xl font-bold text-white">-{isLoading ? '...' : stats.expenses.toLocaleString()}</p>
                    </div>
                </div>

                {/* Transactions */}
                <div>
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-zinc-500" />
                            Операции
                        </h3>
                        <button className="text-blue-400 text-xs font-bold uppercase tracking-wider bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 flex items-center gap-1.5 hover:bg-blue-500/20 transition-colors">
                            <Download className="w-3.5 h-3.5" /> CSV
                        </button>
                    </div>

                    <div className="space-y-3">
                        {isLoading ? (
                            <div className="text-center text-zinc-500 py-10 flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-zinc-500"></div>
                                <span className="text-sm">Считаем цифры...</span>
                            </div>
                        ) : transactions.length > 0 ? (
                            transactions.map(t => (
                                <div key={t.id} className="glass-panel p-4 rounded-2xl border border-white/5 flex items-center justify-between hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-500/10 border border-emerald-500/10' : 'bg-red-500/10 border border-red-500/10'
                                            }`}>
                                            {t.type === 'income'
                                                ? <Wallet className="w-5 h-5 text-emerald-400" />
                                                : <DollarSign className="w-5 h-5 text-red-400" />
                                            }
                                        </div>
                                        <div>
                                            <p className="text-white font-medium text-sm line-clamp-1">{t.title}</p>
                                            <p className="text-zinc-500 text-xs">{t.date}</p>
                                        </div>
                                    </div>
                                    <span className={`font-bold whitespace-nowrap ${t.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                                        {t.type === 'income' ? '+' : ''}{t.amount.toLocaleString()} ₽
                                    </span>
                                </div>
                            ))) : (
                            <div className="text-center text-zinc-500 py-12 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                                Нет операций за этот период
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Accounting;
