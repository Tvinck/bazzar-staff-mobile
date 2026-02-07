import { useState, useEffect } from 'react';
import { ArrowLeft, User, Shield, Mail, Phone, BadgeCheck, Search, Users, ExternalLink, MessageSquare, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabase';
import { useBackButton } from '../../hooks/useBackButton';

const Staff = () => {
    const navigate = useNavigate();
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all'); // all, admin, manager, staff

    useBackButton();

    useEffect(() => {
        const fetchStaff = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('role', { ascending: true });

            if (data) setStaff(data);
            setLoading(false);
        };
        fetchStaff();
    }, []);

    const filteredStaff = staff.filter(user => {
        const matchesSearch = (user.full_name || user.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (user.email || '').toLowerCase().includes(searchQuery.toLowerCase());

        if (filter === 'all') return matchesSearch;
        return matchesSearch && (user.role || '').toLowerCase() === filter;
    });

    const getRoleColor = (role) => {
        switch ((role || '').toLowerCase()) {
            case 'admin': return 'from-red-500/20 to-red-600/20 text-red-400 border-red-500/30';
            case 'manager': return 'from-blue-500/20 to-indigo-600/20 text-blue-400 border-blue-500/30';
            case 'staff': return 'from-emerald-500/20 to-teal-600/20 text-emerald-400 border-emerald-500/30';
            default: return 'from-zinc-500/10 to-zinc-600/10 text-zinc-400 border-zinc-500/20';
        }
    };

    return (
        <div className="min-h-screen pb-24 bg-[#09090b]">
            {/* Header */}
            <div className="glass-panel border-b border-white/5 pt-12 pb-6 px-4 sticky top-0 z-20 backdrop-blur-xl bg-[#09090b]/80">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/services')}
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 transition-colors border border-white/10"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-tight">Команда BAZZAR</h1>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{staff.length} сотрудников</p>
                        </div>
                    </div>
                </div>

                {/* Search & Filter */}
                <div className="space-y-4">
                    <div className="relative group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Поиск по имени или почте..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all"
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {['all', 'admin', 'manager', 'staff'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap border ${filter === f
                                        ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20'
                                        : 'bg-white/5 text-zinc-500 border-white/5 hover:text-zinc-300'
                                    }`}
                            >
                                {f === 'all' ? 'Все' : f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-3">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                        <p className="text-zinc-500 text-sm font-medium">Загружаем список...</p>
                    </div>
                ) : filteredStaff.length > 0 ? (
                    filteredStaff.map((user, index) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            key={user.id}
                            className="glass-card p-4 rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent hover:border-white/10 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 bg-zinc-800">
                                        {user.avatar_url ? (
                                            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-900">
                                                <User className="w-6 h-6 text-zinc-500" />
                                            </div>
                                        )}
                                    </div>
                                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#09090b] ${user.last_seen_at && new Date() - new Date(user.last_seen_at) < 5 * 60 * 1000
                                            ? 'bg-emerald-500'
                                            : 'bg-zinc-600'
                                        }`}></div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                        <h3 className="text-white font-bold truncate">{user.full_name || user.username || 'Без имени'}</h3>
                                        {(user.role === 'admin' || user.role === 'manager') && (
                                            <BadgeCheck className={`w-4 h-4 ${user.role === 'admin' ? 'text-blue-400' : 'text-purple-400'}`} />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1">
                                        <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                                            <Mail className="w-3 h-3" />
                                            <span className="truncate max-w-[120px]">{user.email || 'Нет почты'}</span>
                                        </div>
                                        {user.telegram_username && (
                                            <div className="flex items-center gap-1 text-[10px] text-blue-400 font-medium">
                                                <MessageSquare className="w-3 h-3" />
                                                @{user.telegram_username}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border bg-gradient-to-br ${getRoleColor(user.role)}`}>
                                        {user.role || 'User'}
                                    </span>
                                    {user.performance_rating && (
                                        <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
                                            <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
                                            <span className="text-[10px] font-bold text-yellow-500">{user.performance_rating}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Expandable Info / Quick Actions on click potential */}
                        </motion.div>
                    ))
                ) : (
                    <div className="text-center py-20 flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-dashed border-white/20">
                            <Users className="w-8 h-8 text-zinc-700" />
                        </div>
                        <div>
                            <p className="text-zinc-500 font-medium">Сотрудники не найдены</p>
                            <p className="text-xs text-zinc-600">Попробуйте изменить запрос</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Staff;
