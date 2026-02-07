import { useState, useEffect } from 'react';
import { CheckSquare, Plus, Check, Clock, AlertTriangle, ArrowLeft, DollarSign, Briefcase, ChevronRight, X, Calendar, User as UserIcon, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useBackButton } from '../hooks/useBackButton';
import { useMainButton } from '../hooks/useMainButton';
import { showDialog, haptic } from '../utils/telegram';
import { supabase } from '../supabase';

// Modal for Creating Tasks (Admin Only)
const CreateTaskModal = ({ isOpen, onClose, onCreate }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [reward, setReward] = useState('');
    const [deadline, setDeadline] = useState('');
    const [priority, setPriority] = useState('medium');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title || !reward) {
            toast.error('Заполните обязательные поля');
            return;
        }
        onCreate({
            title,
            description,
            reward: parseInt(reward),
            deadline: new Date(deadline).toISOString(), // Use appropriate format
            priority,
            status: 'available'
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-[#18181b] w-full max-w-md rounded-3xl p-6 border border-white/10"
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Новая задача</h2>
                    <button onClick={onClose}><X className="text-zinc-400" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs text-zinc-500 mb-1 block">Название</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-white/5 rounded-xl p-3 text-white border border-white/10" placeholder="Например: Оформить возвраты" />
                    </div>
                    <div>
                        <label className="text-xs text-zinc-500 mb-1 block">Описание</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-white/5 rounded-xl p-3 text-white border border-white/10 h-24" placeholder="Детали задачи..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Оплата (₽)</label>
                            <input type="number" value={reward} onChange={e => setReward(e.target.value)} className="w-full bg-white/5 rounded-xl p-3 text-white border border-white/10" placeholder="500" />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Приоритет</label>
                            <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full bg-white/5 rounded-xl p-3 text-white border border-white/10">
                                <option value="low">Низкий</option>
                                <option value="medium">Обычный</option>
                                <option value="high">Высокий</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-zinc-500 mb-1 block">Дедлайн</label>
                        <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full bg-white/5 rounded-xl p-3 text-white border border-white/10" />
                    </div>
                    <button type="submit" className="w-full py-3 bg-blue-600 rounded-xl text-white font-bold mt-2">Создать задачу</button>
                </form>
            </motion.div>
        </div>
    );
};

const TaskModal = ({ task, isOpen, onClose, onTake }) => {
    if (!isOpen || !task) return null;

    const formattedDeadline = new Date(task.deadline).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center pointer-events-none">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
                />

                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-lg bg-[#18181b] rounded-t-3xl sm:rounded-3xl p-6 border-t sm:border border-white/10 shadow-2xl pointer-events-auto safe-area-inset-bottom"
                >
                    <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mb-6 opacity-50" />

                    <div className="flex justify-between items-start mb-4">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${task.priority === 'high' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                            'bg-blue-500/10 text-blue-500 border-blue-500/20'
                            }`}>
                            {task.priority === 'high' ? 'Высокий приоритет' : 'Обычный'}
                        </div>
                        <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-zinc-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2 leading-tight">{task.title}</h2>
                    <div className="flex items-center gap-4 text-sm text-zinc-400 mb-6">
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {formattedDeadline}
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-400">
                            <DollarSign className="w-4 h-4" />
                            Оплата: {task.reward} ₽
                        </div>
                    </div>

                    <div className="bg-white/5 rounded-2xl p-4 mb-6">
                        <h3 className="text-sm font-medium text-white mb-2">Описание задачи</h3>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                            {task.description || 'Вам необходимо выполнить указанные действия до истечения срока. После выполнения нажмите кнопку "Выполнено" для проверки.'}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-colors"
                        >
                            Отмена
                        </button>
                        <button
                            onClick={() => { onTake(task); onClose(); }}
                            className="flex-[2] py-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors active:scale-[0.98] shadow-lg shadow-blue-600/20"
                        >
                            Взять в работу
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const Tasks = () => {
    const navigate = useNavigate();
    const [view, setView] = useState('market'); // 'market' | 'my'
    const [selectedTask, setSelectedTask] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [myTasks, setMyTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreator, setIsCreator] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [user, setUser] = useState(null);

    useBackButton();

    // Fetch Tasks & User Permission
    useEffect(() => {
        const fetchTasks = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user?.email === 'ukoshelev.04@yandex.ru') {
                setIsCreator(true);
            }

            // 1. Fetch Available Tasks (Market)
            const { data: marketData, error: marketError } = await supabase
                .from('tasks')
                .select('*')
                .eq('status', 'available')
                .order('created_at', { ascending: false });

            if (marketData) setTasks(marketData);

            // 2. Fetch My Tasks
            if (user) {
                const { data: myData, error: myError } = await supabase
                    .from('tasks')
                    .select('*')
                    .eq('assignee_id', user.id)
                    .neq('status', 'available') // anything taken
                    .order('created_at', { ascending: false });

                if (myData) setMyTasks(myData);
            }
            setLoading(false);
        };

        fetchTasks();

        // Subscribe to real-time changes
        const subscription = supabase
            .channel('tasks_channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
                // Determine if insert or update and refresh lists
                // Simplified: just refresh for now or optimistic update
                // implementing optimistic for better UX
                if (payload.eventType === 'INSERT') {
                    if (payload.new.status === 'available') {
                        setTasks(prev => [payload.new, ...prev]);
                    }
                } else if (payload.eventType === 'UPDATE') {
                    // Check if taken by me
                    setTasks(prev => prev.filter(t => t.id !== payload.new.id)); // Remove from market if status changed
                    // Updating my tasks logic more complex, easiest is to let local state handle it or refetch
                }
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    useMainButton(
        'Создать задачу',
        () => setShowCreateModal(true),
        {
            isVisible: isCreator && view === 'market', // Show only on market tab for creator
            color: '#007aff'
        }
    );

    const handleCreateTask = async (taskData) => {
        try {
            const { data, error } = await supabase.from('tasks').insert([{
                ...taskData,
                created_by: user.id
            }]).select();

            if (error) throw error;
            toast.success('Задача создана!');
            haptic.notification('success');
            // Optimistic update happens via subscription or manual append
        } catch (e) {
            console.error(e);
            toast.error('Ошибка создания задачи');
        }
    };

    const handleTakeTask = async (task) => {
        haptic.impact('medium');

        if (!user) return;

        const confirmed = await showDialog({
            title: 'Взять задачу?',
            message: `Вознаграждение: ${task.reward} ₽\nДедлайн: ${new Date(task.deadline).toLocaleDateString()}`,
            okText: 'Взять',
            cancelText: 'Отмена'
        });

        if (confirmed) {
            try {
                const { error } = await supabase
                    .from('tasks')
                    .update({ assignee_id: user.id, status: 'in_progress' })
                    .eq('id', task.id);

                if (error) throw error;

                // Optimistic UI Update
                setTasks(prev => prev.filter(t => t.id !== task.id));
                setMyTasks(prev => [{ ...task, assignee_id: user.id, status: 'in_progress' }, ...prev]);

                toast.success('Задача взята в работу!');
                haptic.notification('success');
            } catch (e) {
                console.error(e);
                toast.error('Не удалось взять задачу');
            }
        }
    };

    const handleCompleteTask = async (taskId) => {
        try {
            const { error } = await supabase
                .from('tasks')
                .update({ status: 'review' })
                .eq('id', taskId);

            if (error) throw error;

            setMyTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'review' } : t));
            toast.info('Отправлено на проверку');
        } catch (e) {
            console.error(e);
            toast.error('Ошибка при завершении');
        }
    };

    return (
        <div className="min-h-screen pb-20 bg-[#09090b]">
            {/* Header */}
            <div className="pt-safe pb-4 px-4 sticky top-0 z-10 glass-panel border-b border-white/5 backdrop-blur-xl bg-[#09090b]/80">
                <div className="flex items-center justify-between mb-4 mt-2">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/services')}
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-2xl font-bold text-white">Биржа задач</h1>
                    </div>
                    {/* Balance Pill */}
                    <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 text-sm font-bold">14 500 ₽</span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-white/5 rounded-xl border border-white/5 mx-2">
                    <button
                        onClick={() => { setView('market'); haptic.impact('light'); }}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all relative ${view === 'market' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                    >
                        Доступные
                        {tasks.length > 0 && view !== 'market' && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        )}
                    </button>
                    <button
                        onClick={() => { setView('my'); haptic.impact('light'); }}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all relative ${view === 'my' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                    >
                        Мои задачи
                        {myTasks.filter(t => t.status === 'in_progress').length > 0 && (
                            <span className="ml-2 px-1.5 py-0.5 bg-blue-500 text-white text-[10px] rounded-full">
                                {myTasks.filter(t => t.status === 'in_progress').length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Quick Stats Block (New) */}
            <div className="px-4 mt-6">
                <div className="glass-card p-4 rounded-2xl flex items-center justify-between border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                            <Trophy className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Твой ранг</p>
                            <p className="text-sm text-white font-bold">Профессионал</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Выполнено</p>
                        <p className="text-sm text-emerald-400 font-bold">{myTasks.filter(t => t.status === 'review').length} задач</p>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-4">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <div className="flex justify-center py-20"><div className="animate-spin text-zinc-500"><Clock /></div></div>
                    ) : view === 'market' ? (
                        <motion.div
                            key="market"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-3"
                        >
                            {/* MARKET VIEW */}
                            {tasks.map((task, index) => (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => setSelectedTask(task)}
                                    className="glass-card p-5 rounded-2xl group active:scale-[0.99] transition-all cursor-pointer border border-white/5 hover:border-white/10 relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="font-bold text-white text-lg leading-snug group-hover:text-blue-400 transition-colors">
                                                {task.title}
                                            </h3>
                                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-xl text-sm font-bold whitespace-nowrap border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                                                {task.reward} ₽
                                            </span>
                                        </div>

                                        <p className="text-sm text-zinc-400 line-clamp-2 mb-4 leading-relaxed">
                                            {task.description}
                                        </p>

                                        <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                            <div className="flex items-center gap-3 text-xs text-zinc-500">
                                                <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-lg">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {new Date(task.deadline).toLocaleDateString()}
                                                </span>
                                                {task.priority === 'high' && (
                                                    <span className="text-red-400 bg-red-500/10 px-2 py-1 rounded-lg flex items-center gap-1.5 border border-red-500/20">
                                                        <AlertTriangle className="w-3.5 h-3.5" />
                                                        Срочно
                                                    </span>
                                                )}
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-lg group-hover:shadow-blue-500/30">
                                                <Plus className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            {tasks.length === 0 && (
                                <div className="text-center py-20">
                                    <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckSquare className="w-8 h-8 text-zinc-500" />
                                    </div>
                                    <p className="text-zinc-500 font-medium">Нет доступных задач</p>
                                    <p className="text-xs text-zinc-600 mt-1">Загляните позже :)</p>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="my"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-3"
                        >
                            {/* MY TASKS VIEW */}
                            {myTasks.map((task, index) => (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="glass-card p-5 rounded-2xl border border-white/5 relative overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500" />

                                    <div className="flex justify-between items-start mb-2 pl-2">
                                        <h3 className="font-bold text-white text-lg">{task.title}</h3>
                                        {task.status === 'review' ? (
                                            <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-1 rounded-lg border border-orange-500/20">На проверке</span>
                                        ) : (
                                            <div className="px-2 py-1 text-[10px] font-bold text-blue-400 bg-blue-500/10 rounded-lg border border-blue-500/20 flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                                В работе
                                            </div>
                                        )}
                                    </div>

                                    <div className="pl-2 flex items-center gap-2 text-xs text-zinc-500 mb-4">
                                        <Clock className="w-3.5 h-3.5" />
                                        Дедлайн: {new Date(task.deadline).toLocaleString()}
                                    </div>

                                    {task.status === 'in_progress' && (
                                        <div className="pl-2">
                                            <button
                                                onClick={() => handleCompleteTask(task.id)}
                                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                                            >
                                                <Check className="w-4 h-4" />
                                                Завершить задачу
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                            {myTasks.length === 0 && (
                                <div className="text-center py-20 text-zinc-500">
                                    <p>У вас нет активных задач</p>
                                    <button onClick={() => setView('market')} className="text-blue-400 text-sm mt-2 font-medium">Найти задачу</button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <CreateTaskModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreate={handleCreateTask}
            />

            <TaskModal
                isOpen={!!selectedTask}
                task={selectedTask}
                onClose={() => setSelectedTask(null)}
                onTake={handleTakeTask}
            />
        </div>
    );
};

export default Tasks;
