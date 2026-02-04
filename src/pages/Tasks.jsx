import { useState } from 'react';
import { CheckSquare, Plus, Check, Clock, AlertTriangle, ArrowLeft, DollarSign, Briefcase, ChevronRight, X, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useBackButton } from '../hooks/useBackButton';
import { useMainButton } from '../hooks/useMainButton';
import { showDialog, haptic } from '../utils/telegram';

const TaskModal = ({ task, isOpen, onClose, onTake }) => {
    if (!isOpen || !task) return null;

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
                            {task.deadline}
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

    // Telegram Mini Apps Integration
    useBackButton(); // Native back button

    // Main Button for creating new task (when on "My Tasks" tab)
    useMainButton(
        'Создать задачу',
        async () => {
            haptic.impact('medium');
            toast.info('Функция создания задач скоро будет доступна!');
        },
        {
            isVisible: view === 'my',
            color: '#007aff'
        }
    );

    // Mock Market Tasks
    const [marketTasks, setMarketTasks] = useState([
        { id: 101, title: 'Оформить 10 возвратов', description: 'Обработать заявки на возврат от 18.01. Проверить чеки и статусы в системе.', reward: 500, deadline: 'Сегодня, 18:00', priority: 'high' },
        { id: 102, title: 'Заполнить карточки PUBG', description: 'Внести новые цены и описания для 50 товаров категории PUBG Mobile.', reward: 350, deadline: 'Завтра, 12:00', priority: 'medium' },
        { id: 103, title: 'Модерация отзывов', description: 'Проверить 100 последних отзывов на спам и нецензурную лексику.', reward: 200, deadline: '20 янв, 10:00', priority: 'low' },
    ]);

    // Mock My Tasks
    const [myTasks, setMyTasks] = useState([
        { id: 1, title: 'Подготовить отчет за неделю', reward: 0, deadline: 'Сегодня, 21:00', status: 'active', priority: 'high' }
    ]);

    const handleTakeTask = async (task) => {
        haptic.impact('medium');

        const confirmed = await showDialog({
            title: 'Взять задачу?',
            message: `Вознаграждение: ${task.reward} ₽\nДедлайн: ${task.deadline}`,
            okText: 'Взять',
            cancelText: 'Отмена'
        });

        if (confirmed) {
            setMarketTasks(prev => prev.filter(t => t.id !== task.id));
            setMyTasks(prev => [...prev, { ...task, status: 'active' }]);
            toast.success('Задача взята в работу!');
            haptic.notification('success');
        }
    };

    const handleCompleteTask = (taskId) => {
        setMyTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'review' } : t));
        toast.info('Отправлено на проверку');
    };

    return (
        <div className="min-h-screen pb-20">
            {/* Header */}
            <div className="pt-12 pb-4 px-4 sticky top-0 z-10 glass-panel border-b border-white/5 backdrop-blur-xl bg-[#09090b]/80">
                <div className="flex items-center justify-between mb-4">
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
                <div className="flex p-1 bg-white/5 rounded-xl">
                    <button
                        onClick={() => setView('market')}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${view === 'market' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                    >
                        Доступные
                    </button>
                    <button
                        onClick={() => setView('my')}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${view === 'my' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                    >
                        Мои задачи
                        {myTasks.filter(t => t.status === 'active').length > 0 && (
                            <span className="ml-2 px-1.5 py-0.5 bg-blue-500 text-white text-[10px] rounded-full">
                                {myTasks.filter(t => t.status === 'active').length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {view === 'market' ? (
                    // MARKET VIEW
                    <>
                        {marketTasks.map(task => (
                            <div
                                key={task.id}
                                onClick={() => setSelectedTask(task)}
                                className="fintech-card p-5 rounded-2xl group active:scale-[0.99] transition-all cursor-pointer border border-white/5 hover:border-white/10"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-bold text-white text-lg leading-snug group-hover:text-blue-400 transition-colors">
                                        {task.title}
                                    </h3>
                                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-bold whitespace-nowrap border border-emerald-500/20">
                                        {task.reward} ₽
                                    </span>
                                </div>

                                <p className="text-sm text-zinc-400 line-clamp-2 mb-4">
                                    {task.description}
                                </p>

                                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5" />
                                            {task.deadline}
                                        </span>
                                        {task.priority === 'high' && (
                                            <span className="text-red-400 flex items-center gap-1">
                                                <AlertTriangle className="w-3.5 h-3.5" />
                                                Срочно
                                            </span>
                                        )}
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                        <Plus className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {marketTasks.length === 0 && (
                            <div className="text-center py-12 text-zinc-500">
                                Нет доступных задач :(
                            </div>
                        )}
                    </>
                ) : (
                    // MY TASKS VIEW
                    <>
                        {myTasks.map(task => (
                            <div
                                key={task.id}
                                className="fintech-card p-5 rounded-2xl border border-white/5"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-white text-lg">{task.title}</h3>
                                    {task.status === 'review' ? (
                                        <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-1 rounded-lg border border-orange-500/20">На проверке</span>
                                    ) : (
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mt-2"></div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 text-xs text-zinc-500 mb-4">
                                    <Clock className="w-3.5 h-3.5" />
                                    Дедлайн: {task.deadline}
                                </div>

                                {task.status === 'active' && (
                                    <button
                                        onClick={() => handleCompleteTask(task.id)}
                                        className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-500 active:scale-[0.98] transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                                    >
                                        <Check className="w-4 h-4" />
                                        Выполнено
                                    </button>
                                )}
                            </div>
                        ))}
                    </>
                )}
            </div>

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
