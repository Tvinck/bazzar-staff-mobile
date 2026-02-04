import { ArrowLeft, Trophy, Crown, TrendingUp, Medal, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const Leaderboard = () => {
    const navigate = useNavigate();
    const [period, setPeriod] = useState('week'); // 'week' | 'month'
    const [leaders, setLeaders] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);

            // Fetch from REAL view
            const { data, error } = await supabase
                .from('view_leaderboard')
                .select('*')
                .limit(50); // Top 50

            if (data && data.length > 0) {
                setLeaders(data.map((item, index) => ({
                    id: item.user_id,
                    name: item.email ? item.email.split('@')[0] : 'User', // Mock name from email
                    avatar: (item.email?.[0] || 'U').toUpperCase(),
                    role: 'Staff',
                    xp: item.total_xp,
                    orders: Math.floor(item.total_xp / 100), // Mock calc
                    trend: '+5%', // Mock trend
                    isMe: user && item.user_id === user.id
                })));
            } else {
                // Fallback to Mock Data if DB is empty so page looks good
                setLeaders([
                    { id: '1', name: 'Артём Г.', avatar: 'AG', role: 'Admin', xp: 15400, orders: 142, trend: '+12%', isMe: false },
                    { id: '2', name: 'Елена С.', avatar: 'ES', role: 'Support', xp: 12100, orders: 98, trend: '+5%', isMe: false },
                    { id: '3', name: 'Иван М.', avatar: 'IM', role: 'Manager', xp: 10500, orders: 85, trend: '+2%', isMe: false },
                    { id: '4', name: 'User 4', avatar: 'U4', role: 'Staff', xp: 8200, orders: 64, trend: '-1%', isMe: false },
                    { id: '5', name: 'User 5', avatar: 'U5', role: 'Staff', xp: 7800, orders: 60, trend: '+4%', isMe: false },
                    { id: user?.id || 'me', name: 'Вы', avatar: 'ME', role: 'Staff', xp: 5200, orders: 42, trend: '+8%', isMe: true },
                ].sort((a, b) => b.xp - a.xp));
            }
            setLoading(false);
        };

        fetchLeaderboard();
    }, [period]); // Trigger on period change (logic to filter by date would be in query)

    // Helper to get top 3 safely
    const top1 = leaders[0] || {};
    const top2 = leaders[1] || {};
    const top3 = leaders[2] || {};
    const rest = leaders.slice(3);

    if (loading) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-white"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div></div>;

    return (
        <div className="min-h-screen bg-[#09090b] pb-24">
            {/* Header */}
            <div className="px-4 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-[#09090b]/90 backdrop-blur-xl z-20 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">Топ сотрудников</h1>
                        <p className="text-xs text-zinc-500">Рейтинг продуктивности</p>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-6">
                {/* Period Selector */}
                <div className="glass-panel p-1 rounded-xl flex text-sm font-medium">
                    <button
                        onClick={() => setPeriod('week')}
                        className={`flex-1 py-2 rounded-lg transition-all ${period === 'week' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Эта неделя
                    </button>
                    <button
                        onClick={() => setPeriod('month')}
                        className={`flex-1 py-2 rounded-lg transition-all ${period === 'month' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Весь месяц
                    </button>
                </div>

                {/* Top 3 Podium */}
                {leaders.length >= 3 && (
                    <div className="grid grid-cols-3 gap-2 items-end mb-8 pt-4">
                        {/* 2nd Place */}
                        <div className="flex flex-col items-center">
                            <div className="relative mb-2">
                                <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-zinc-600 flex items-center justify-center text-xl font-bold text-zinc-400 shadow-[0_0_20px_rgba(82,82,91,0.2)]">
                                    {top2.avatar}
                                </div>
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-zinc-700 text-white text-xs font-bold px-2 py-0.5 rounded-full border border-zinc-600">
                                    2
                                </div>
                            </div>
                            <p className="text-sm font-bold text-white text-center mt-2 truncate max-w-[80px]">{top2.name}</p>
                            <p className="text-[10px] text-zinc-500 font-bold">{top2.xp?.toLocaleString()} XP</p>
                        </div>

                        {/* 1st Place */}
                        <div className="flex flex-col items-center -mt-8">
                            <div className="relative mb-2">
                                <Crown className="absolute -top-6 left-1/2 -translate-x-1/2 w-6 h-6 text-yellow-400 animate-bounce" />
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 border-2 border-yellow-300 flex items-center justify-center text-2xl font-bold text-white shadow-[0_0_30px_rgba(234,179,8,0.4)]">
                                    {top1.avatar}
                                </div>
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-xs font-bold px-2.5 py-0.5 rounded-full border border-yellow-300 shadow-lg">
                                    1
                                </div>
                            </div>
                            <p className="text-base font-bold text-white text-center mt-2 truncate max-w-[100px]">{top1.name}</p>
                            <p className="text-xs text-yellow-500 font-bold">{top1.xp?.toLocaleString()} XP</p>
                        </div>

                        {/* 3rd Place */}
                        <div className="flex flex-col items-center">
                            <div className="relative mb-2">
                                <div className="w-16 h-16 rounded-full bg-amber-900/40 border-2 border-amber-700 flex items-center justify-center text-xl font-bold text-amber-500 shadow-[0_0_20px_rgba(180,83,9,0.2)]">
                                    {top3.avatar}
                                </div>
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-800 text-white text-xs font-bold px-2 py-0.5 rounded-full border border-amber-600">
                                    3
                                </div>
                            </div>
                            <p className="text-sm font-bold text-white text-center mt-2 truncate max-w-[80px]">{top3.name}</p>
                            <p className="text-[10px] text-zinc-500 font-bold">{top3.xp?.toLocaleString()} XP</p>
                        </div>
                    </div>
                )}

                {/* List */}
                <div className="glass-panel rounded-2xl overflow-hidden border border-white/5">
                    {rest.map((user, index) => (
                        <div key={user.id} className={`p-4 flex items-center gap-4 ${user.isMe ? 'bg-blue-500/10' : 'hover:bg-white/5'} ${index !== rest.length - 1 ? 'border-b border-white/5' : ''}`}>
                            <div className="w-6 text-center font-bold text-zinc-500">{index + 4}</div>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${user.isMe ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                                {user.avatar}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <p className={`font-bold ${user.isMe ? 'text-blue-400' : 'text-white'}`}>{user.name} {user.isMe && '(Вы)'}</p>
                                    <p className="text-sm font-bold text-white">{user.xp?.toLocaleString()} XP</p>
                                </div>
                                <div className="flex items-center justify-between mt-0.5">
                                    <p className="text-xs text-zinc-500">{user.orders} заказов</p>
                                    <div className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 rounded">
                                        <TrendingUp className="w-3 h-3" />
                                        {user.trend}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {rest.length === 0 && <div className="p-8 text-center text-zinc-500">Пока пусто...</div>}
                </div>

                {/* Personal Status Badge (if not in top 3?) */}
                {currentUser && (
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 flex items-center justify-between relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-blue-100 text-xs font-medium mb-1">Ваш прогресс</p>
                            <p className="text-white font-bold text-lg">{leaders.findIndex(l => l.isMe) + 1} место</p>
                            <p className="text-blue-200 text-xs mt-1">
                                {leaders[0]?.xp ? `До топ-1: ${(leaders[0].xp - (leaders.find(l => l.isMe)?.xp || 0)).toLocaleString()} XP` : 'Вы лидер!'}
                            </p>
                        </div>
                        <Trophy className="w-16 h-16 text-white/20 absolute right-2 top-1/2 -translate-y-1/2 rotate-12" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Leaderboard;
