import { LogOut, Settings, HelpCircle, ChevronRight, Shield, User, CheckSquare, DollarSign, Wallet, TrendingUp, CreditCard, ArrowUpRight, ArrowDownLeft, X, History, Lock, Bell, Globe, Moon, Trophy, Star, Award, Zap, Target } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useBackButton } from '../hooks/useBackButton';
import { useSettingsButton } from '../hooks/useSettingsButton';
import { showDialog, haptic } from '../utils/telegram';

const Toggle = ({ checked, onChange }) => (
    <div
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors ${checked ? 'bg-blue-500' : 'bg-zinc-700'}`}
    >
        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </div>
);

const SettingsModal = ({ isOpen, onClose, userId, onResetPin }) => {
    const [pushEnabled, setPushEnabled] = useState(true);
    const [tgNotifs, setTgNotifs] = useState(false);
    const [isLinked, setIsLinked] = useState(false);
    const [botName, setBotName] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && userId) {
            fetchSettings();
            fetchBotInfo();
        }
    }, [isOpen, userId]);

    const fetchSettings = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('telegram_chat_id, telegram_notifications')
            .eq('id', userId)
            .single();

        if (data) {
            setIsLinked(!!data.telegram_chat_id);
            setTgNotifs(data.telegram_notifications ?? true); // Default to true if linked
        }
    };

    const fetchBotInfo = async () => {
        try {
            const { data, error } = await supabase.functions.invoke('telegram-bot', {
                body: { action: 'get_bot_info' }
            });
            if (data?.bot_name) {
                setBotName(data.bot_name);
            }
        } catch (e) {
            console.error('Failed to fetch bot info', e);
        }
    };

    const handleToggleTg = async (val) => {
        setTgNotifs(val);
        // Update in DB
        await supabase.from('profiles').update({ telegram_notifications: val }).eq('id', userId);

        if (val && !isLinked && botName) {
            // If turning on and not linked, suggest linking
            window.open(`https://t.me/${botName}?start=${userId}`, '_blank');
        }
    };

    const handleConnectTg = () => {
        if (!botName) {
            toast.error('Бот не настроен');
            return;
        }
        window.open(`https://t.me/${botName}?start=${userId}`, '_blank');
    };

    if (!isOpen) return null;

    const handlePasswordReset = () => {
        toast.success('Ссылка на сброс пароля отправлена на email');
    };

    const handlePinChange = async () => {
        const confirmed = await showDialog({
            title: 'Сменить PIN-код?',
            message: 'Текущий код будет удален, и вы сможете установить новый.',
            okText: 'Сменить',
            cancelText: 'Отмена'
        });

        if (confirmed) {
            localStorage.removeItem('bazzar_staff_pin');
            onResetPin();
            onClose();
            toast.success('PIN-код удален. Установите новый.');
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    className="relative w-full sm:max-w-md bg-[#18181b] rounded-t-3xl sm:rounded-3xl p-6 border-t sm:border border-white/10 h-[85vh] sm:h-auto overflow-y-auto"
                >
                    <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mb-6 opacity-50 block sm:hidden" />

                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white">Настройки</h3>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X className="w-5 h-5 text-zinc-400" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Security */}
                        <div>
                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 ml-1">Безопасность</h4>
                            <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                                <button onClick={handlePasswordReset} className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                            <Lock className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-medium text-white">Пароль</p>
                                            <p className="text-xs text-zinc-500">Изменить пароль входа</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-zinc-600" />
                                </button>
                                <button onClick={handlePinChange} className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                            <Shield className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-medium text-white">PIN-код</p>
                                            <p className="text-xs text-zinc-500">Настроить быстрый вход</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-zinc-600" />
                                </button>
                            </div>
                        </div>

                        {/* Notifications */}
                        <div>
                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 ml-1">Уведомления</h4>
                            <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                                <div className="flex items-center justify-between p-4 border-b border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                            <Bell className="w-4 h-4 text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">Push-уведомления</p>
                                        </div>
                                    </div>
                                    <Toggle checked={pushEnabled} onChange={setPushEnabled} />
                                </div>
                                <div className="p-4 flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                                <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.198 2.433a2.242 2.242 0 0 0-1.022.215l-8.609 3.33c-2.068.8-4.133 1.598-5.724 2.21a405.15 405.15 0 0 1-2.849 1.09c-.42.147-.99.332-1.473.901-.728.968.193 1.798.919 2.286 1.61.516 3.275 1.009 3.816 1.177l.176.056c.112.036.214.073.306.11l.002.001c.215.087.647.265.812.58.172.327.28.756.107 1.28l.001.002a7.712 7.712 0 0 1-.378 1.056l-.025.07c.504-.447 1.76-1.572 2.126-1.921l.365-.347c.725-.688 1.62-.843 2.067-.5.352.27.34.846.046 1.59-1.996 5.06-4.226 10.702-4.226 10.702-.194.509.309.845.688.845.26 0 .438-.13.754-.33 1.517-.96 4.67-2.956 6.55-4.168.397-.257.94-.655 1.07-1.189.231-.954 2.308-11.411 2.548-12.87a2.27 2.27 0 0 0-.25-1.583z" fill="currentColor" /></svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">Telegram Бот</p>
                                                {isLinked ? (
                                                    <p className="text-[10px] text-emerald-500 font-medium">Подключено</p>
                                                ) : (
                                                    <p className="text-[10px] text-zinc-500">Не подключено</p>
                                                )}
                                            </div>
                                        </div>
                                        {isLinked && <Toggle checked={tgNotifs} onChange={handleToggleTg} />}
                                    </div>

                                    {!isLinked && (
                                        <button
                                            onClick={handleConnectTg}
                                            className="w-full mt-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-bold py-3 rounded-xl border border-blue-600/20 transition-all flex items-center justify-center gap-2"
                                        >
                                            Подключить Telegram
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* App */}
                        <div>
                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 ml-1">Приложение</h4>
                            <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                                <div className="flex items-center justify-between p-4 border-b border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                            <Globe className="w-4 h-4 text-purple-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">Язык</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-zinc-400">Русский</span>
                                </div>
                                <div className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-zinc-500/10 flex items-center justify-center">
                                            <Moon className="w-4 h-4 text-zinc-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">Тема</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-zinc-400">Тёмная</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const WithdrawModal = ({ isOpen, onClose, balance }) => {
    const [amount, setAmount] = useState('');
    const [card, setCard] = useState('');
    const [step, setStep] = useState(1); // 1: Input, 2: Success

    if (!isOpen) return null;

    const handleWithdraw = () => {
        // Here calls API to create withdrawal request
        setStep(2);
        setTimeout(() => {
            setStep(1);
            setAmount('');
            setCard('');
            onClose();
        }, 2000);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-sm glass-panel bg-[#18181b] rounded-3xl p-6 border border-white/10 shadow-2xl"
                >
                    {step === 1 ? (
                        <>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">Вывод средств</h3>
                                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                    <X className="w-5 h-5 text-zinc-400" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-zinc-400 mb-1.5 block">Сумма (доступно {balance.toLocaleString()} ₽)</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">₽</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm text-zinc-400 mb-1.5 block">Реквизиты (Карта / USDT)</label>
                                    <div className="relative">
                                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                        <input
                                            type="text"
                                            value={card}
                                            onChange={(e) => setCard(e.target.value)}
                                            placeholder="0000 0000 0000 0000"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleWithdraw}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl mt-4 transition-colors shadow-lg shadow-blue-500/20 active:scale-[0.98]"
                                >
                                    Вывести средства
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                                <CheckSquare className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Заявка создана!</h3>
                            <p className="text-zinc-400">Средства поступят в течение 24 часов</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const Profile = ({ onLogout, onResetPin }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Dynamic Data States
    const [xp, setXp] = useState(0);
    const [rank, setRank] = useState(1);
    const [earnings, setEarnings] = useState({ balance: 0, pending: 0 });

    // Telegram Mini Apps Integration
    useBackButton(); // Native back button

    // Settings Button in Telegram header
    useSettingsButton(() => {
        haptic.impact('light');
        setIsSettingsOpen(true);
    });

    const handleLogout = async () => {
        haptic.impact('medium');

        const confirmed = await showDialog({
            title: 'Выйти из аккаунта?',
            message: 'Вы уверены что хотите выйти?',
            okText: 'Выйти',
            cancelText: 'Отмена',
            destructive: true
        });

        if (confirmed) {
            haptic.notification('success');
            onLogout();
        }
    };

    useEffect(() => {
        const fetchProfileData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);

                // 1. Fetch XP & Rank from View
                const { data: leaderboard } = await supabase
                    .from('view_leaderboard')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (leaderboard) {
                    setXp(leaderboard.total_xp || 0);
                    setRank(leaderboard.rank || 1);
                    // Mock earnings based on XP for demo (e.g., 10 RUB per XP)
                    // In real app, this would come from a 'wallets' table
                    setEarnings({
                        balance: (leaderboard.total_xp || 0) * 10,
                        pending: 1250 // Static pending for now
                    });
                }
            }
        };
        fetchProfileData();
    }, []);

    // Derived Level
    const level = Math.floor(xp / 1000) + 1;
    const nextLevelXp = level * 1000;
    const progress = Math.min(100, Math.max(0, ((xp - (level - 1) * 1000) / 1000) * 100));

    const achievements = [
        { id: 1, name: 'Снайпер', icon: Target, color: 'text-red-400', bg: 'bg-red-500/10', unlocked: xp > 500 },
        { id: 2, name: 'Флеш', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/10', unlocked: xp > 1000 },
        { id: 3, name: 'Сова', icon: Moon, color: 'text-purple-400', bg: 'bg-purple-500/10', unlocked: xp > 2000 },
        { id: 4, name: 'Магнат', icon: Trophy, color: 'text-blue-400', bg: 'bg-blue-500/10', unlocked: xp > 5000 },
    ];

    return (
        <div className="min-h-screen pb-20">
            {/* Header */}
            <div className="relative pt-12 pb-6 px-6 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-accent-blue/5 blur-[80px] pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative mb-4 group"
                    >
                        <div className="w-28 h-28 rounded-[2rem] bg-gradient-to-br from-accent-blue via-blue-600 to-indigo-600 flex items-center justify-center p-1 shadow-[0_0_40px_rgba(59,130,246,0.3)] ring-1 ring-white/10 relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <User className="w-12 h-12 text-white drop-shadow-lg" />
                        </div>
                        <div className="absolute -bottom-3 -right-3">
                            <div className="bg-[#09090b] p-1 rounded-full">
                                <div className="bg-accent-green px-3 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-green-500/20">
                                    <span className="text-xs font-bold text-white uppercase tracking-wider">Lvl {level}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.h2
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-2xl font-bold text-white tracking-tight"
                    >
                        {user?.email?.split('@')[0] || 'Сотрудник'}
                    </motion.h2>
                    <motion.p
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-sm text-zinc-400 font-medium mb-4"
                    >
                        {user?.email}
                    </motion.p>

                    {/* XP Progress */}
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: "100%", opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="w-full max-w-xs"
                    >
                        <div className="flex justify-between items-end mb-1.5 px-1">
                            <span className="text-[10px] font-bold text-accent-blue uppercase tracking-wider">XP Progress</span>
                            <span className="text-[10px] font-mono text-zinc-400">{xp} / {nextLevelXp}</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-accent-blue to-accent-purple rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                            />
                        </div>
                    </motion.div>
                </div>

                {/* Quick Actions (Absolute) */}
                <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsSettingsOpen(true)}
                    className="absolute top-6 right-6 p-2.5 glass rounded-xl text-zinc-400 hover:text-white transition-colors"
                >
                    <Settings className="w-5 h-5" />
                </motion.button>

                <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => navigate('/leaderboard')}
                    className="absolute top-6 left-6 p-2.5 glass rounded-xl text-yellow-500 hover:text-yellow-400 transition-colors border-yellow-500/20"
                >
                    <Trophy className="w-5 h-5" />
                </motion.button>
            </div>

            <div className="px-4 space-y-4 relative z-10">
                {/* Achievements */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="glass-card rounded-3xl p-5"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <Award className="w-4 h-4 text-purple-400" />
                            Достижения
                        </h3>
                        <div className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[10px] font-medium text-zinc-400">
                            {achievements.filter(a => a.unlocked).length} / {achievements.length}
                        </div>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x">
                        {achievements.map((ach) => (
                            <div key={ach.id} className={`flex flex-col items-center gap-2 min-w-[72px] snap-center ${!ach.unlocked ? 'opacity-40 grayscale' : ''}`}>
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${ach.bg} border border-white/5 shadow-inner relative group`}>
                                    <ach.icon className={`w-6 h-6 ${ach.color} drop-shadow-md group-hover:scale-110 transition-transform`} />
                                    {ach.unlocked && <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />}
                                </div>
                                <span className="text-[10px] font-medium text-zinc-400">{ach.name}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Earnings Card */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="relative overflow-hidden rounded-3xl p-6 group"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-3xl z-0" />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-0 mix-blend-overlay" />
                    <div className="absolute top-0 right-0 p-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                    <Wallet className="w-4 h-4 text-emerald-400" />
                                </div>
                                <span className="text-sm font-medium text-zinc-300">Баланс</span>
                            </div>
                            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1">
                                <ArrowUpRight className="w-3 h-3" />
                                +{earnings.pending}
                            </span>
                        </div>

                        <div className="mb-6">
                            <span className="text-4xl font-bold text-white tracking-tighter block">
                                {earnings.balance.toLocaleString('ru-RU')} ₽
                            </span>
                            <span className="text-xs text-zinc-500 font-medium mt-1 block">Доступно к выводу</span>
                        </div>

                        <button
                            onClick={() => setIsWithdrawModalOpen(true)}
                            className="w-full bg-white text-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-lg shadow-white/5"
                        >
                            <CreditCard className="w-4 h-4" />
                            Вывести средства
                        </button>
                    </div>
                </motion.div>

                {/* Logout */}
                <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    onClick={handleLogout}
                    className="w-full p-4 rounded-xl border border-red-500/10 bg-red-500/5 hover:bg-red-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                >
                    <LogOut className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-bold text-red-500">Выйти</span>
                </motion.button>

                <div className="h-8" />
            </div>

            <WithdrawModal
                isOpen={isWithdrawModalOpen}
                onClose={() => setIsWithdrawModalOpen(false)}
                balance={earnings.balance}
            />

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                userId={user?.id}
                onResetPin={onResetPin}
            />

            <BottomNav />
        </div>
    );
};

export default Profile;
