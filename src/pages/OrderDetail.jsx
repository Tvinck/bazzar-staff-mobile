import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Copy, CheckCircle, XCircle, MessageCircle, CreditCard, Clock, Box, Send, StickyNote, User, ShoppingBag, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { toast } from 'sonner';
import { useBackButton } from '../hooks/useBackButton';
import { useMainButton } from '../hooks/useMainButton';
import { showDialog, haptic } from '../utils/telegram';
import { motion, AnimatePresence } from 'framer-motion';
import desslyHubAPI from '../services/desslyHub';

const OrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [history, setHistory] = useState([]);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // DBM Integration
    const [isDBMModalOpen, setIsDBMModalOpen] = useState(false);
    const [dbmProducts, setDbmProducts] = useState([]);
    const [isDbmLoading, setIsDbmLoading] = useState(false);
    const [selectedDbmProduct, setSelectedDbmProduct] = useState(null);
    const [isIssuing, setIsIssuing] = useState(false);

    useBackButton();

    useMainButton(
        'Завершить заказ',
        async () => {
            haptic.impact('medium');
            const confirmed = await showDialog({
                title: 'Завершить заказ?',
                message: 'Убедитесь что товар доставлен клиенту',
                okText: 'Завершить',
                cancelText: 'Отмена'
            });

            if (confirmed) {
                await updateStatus('completed');
            }
        },
        {
            isVisible: order?.status === 'processing' || order?.status === 'new',
            color: '#34c759',
            isActive: !isLoading
        }
    );

    useEffect(() => {
        const fetchOrderData = async () => {
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select('*')
                .eq('id', id)
                .single();

            if (orderError) return;

            const { data: historyData } = await supabase
                .from('order_history')
                .select('*')
                .eq('order_id', id)
                .order('changed_at', { ascending: false });

            setOrder(orderData);
            setHistory(historyData || []);
            setComments([
                { id: 1, text: 'Клиент просил проверить ID перед отправкой', author: 'Manager', time: '14:30' }
            ]);
            setIsLoading(false);
        };
        fetchOrderData();
    }, [id]);

    const updateStatus = async (newStatus, extraNote = null) => {
        const oldStatus = order.status;
        const promise = supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', id);

        toast.promise(promise, {
            loading: 'Обновляем статус...',
            success: () => {
                setOrder({ ...order, status: newStatus });

                // Optimistically add to history
                const newLog = {
                    id: Date.now(),
                    old_status: oldStatus,
                    new_status: newStatus,
                    changed_at: new Date().toISOString()
                };
                setHistory([newLog, ...history]);

                if (extraNote) {
                    const comment = {
                        id: Date.now(),
                        text: extraNote,
                        author: 'System',
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    };
                    setComments(prev => [comment, ...prev]);
                }

                if (newStatus === 'completed') {
                    setTimeout(() => navigate('/orders'), 1500);
                }
                return `Статус изменен на ${getStatusLabel(newStatus)}`;
            },
            error: 'Ошибка при обновлении',
        });
    };

    const handleAddComment = () => {
        if (!newComment.trim()) return;
        const comment = {
            id: Date.now(),
            text: newComment,
            author: 'You',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setComments([comment, ...comments]);
        setNewComment('');
        toast.success('Заметка добавлена');
        haptic.impact('light');
    };

    const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(String(text));
        toast.success(`${label} скопирован`, { description: text });
        haptic.impact('light');
    };

    // DBM Functions
    const openDBMModal = async () => {
        setIsDBMModalOpen(true);
        setIsDbmLoading(true);
        try {
            const data = await desslyHubAPI.getVouchers();
            setDbmProducts(data.products || data.data || []);
        } catch (e) {
            toast.error('Ошибка загрузки товаров DBM');
        } finally {
            setIsDbmLoading(false);
        }
    };

    const handleIssueDbm = async () => {
        if (!selectedDbmProduct) return;

        setIsIssuing(true);
        try {
            const response = await desslyHubAPI.buyVoucher({
                root_id: selectedDbmProduct.id,
                variant_id: selectedDbmProduct.variant_id || 1, // Defaulting to 1 for now
                reference: `order_${order.id}`
            });

            if (response.voucher_code) {
                toast.success('Товар выдан успешно!');
                // Auto complete and add note
                await updateStatus('completed', `Выдан товар DBM: ${response.voucher_code}`);
                setIsDBMModalOpen(false);
            } else {
                toast.error('Не удалось получить код');
            }
        } catch (e) {
            console.error(e);
            toast.error('Ошибка выдачи товара', { description: e.message });
        } finally {
            setIsIssuing(false);
        }
    };

    const getStatusLabel = (s) => {
        const map = { 'new': 'Новый', 'processing': 'В работе', 'completed': 'Выполнен', 'cancelled': 'Отмена' };
        return map[s] || s;
    };

    if (isLoading) return (
        <div className="min-h-screen bg-tg-bg flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!order) return <div className="min-h-screen bg-tg-bg flex items-center justify-center text-zinc-500">Заказ не найден</div>;

    const customerData = order.extra_data || {};
    const productItem = order.items?.[0] || {};

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-tg-bg pb-24 relative">
            <div className="fixed top-0 left-0 w-full h-[500px] bg-accent-blue/5 blur-[120px] rounded-b-[100%] pointer-events-none" />

            {/* Header */}
            <div className="glass border-b border-white/5 pt-safe px-4 pb-4 sticky top-0 z-20 backdrop-blur-xl">
                <div className="flex items-center gap-4 mt-2">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">Заказ #{order.id.slice(0, 8)}</h1>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <Clock className="w-3 h-3" />
                            {new Date(order.created_at).toLocaleString('ru-RU')}
                        </div>
                    </div>
                </div>
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="p-4 space-y-4 relative z-10"
            >
                {/* Order Key Info & Actions */}
                <motion.div variants={itemVariants} className="glass-card p-5 rounded-3xl relative overflow-hidden group border border-white/5">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-accent-blue/10 rounded-full blur-[60px] -mr-10 -mt-10 pointer-events-none"></div>

                    {/* Key Fields Grid */}
                    <div className="grid grid-cols-1 gap-4 mb-6 relative z-10">
                        <div>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Наименование</p>
                            <h2 className="text-lg font-bold text-white leading-snug">{productItem.name || order.product_name || 'Товар'}</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Покупатель</p>
                                <p className="text-sm font-medium text-zinc-200">
                                    {order.metadata?.customer_name || order.customer?.name || order.metadata?.buyer?.firstName || 'Гость'}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Дата</p>
                                <p className="text-sm font-medium text-zinc-200">
                                    {new Date(order.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>

                        <div>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Сумма</p>
                            <p className="text-xl font-bold text-white tracking-tight tabular-nums">
                                {(order.total_amount ?? order.price ?? 0).toLocaleString()} ₽
                            </p>
                        </div>
                    </div>

                    {/* Primary Actions */}
                    <div className="space-y-3 relative z-10">
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => {
                                    haptic.impact('light');
                                    navigate(`/chats/${order.id}`, {
                                        state: {
                                            chat: {
                                                clientName: order.metadata?.customer_name || 'Клиент',
                                                platform: 'yandex',
                                                id: order.id
                                            }
                                        }
                                    });
                                }}
                                className="bg-white/5 hover:bg-white/10 active:scale-98 border border-white/10 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all"
                            >
                                <MessageCircle className="w-5 h-5 text-accent-blue" />
                                Чат
                            </button>

                            <button
                                onClick={openDBMModal}
                                disabled={order.status === 'completed'}
                                className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 border border-purple-500/20 text-purple-300 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                            >
                                <ShoppingBag className="w-5 h-5" />
                                Выдать (DBM)
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {order.status !== 'completed' && (
                                <button
                                    onClick={() => updateStatus('completed')}
                                    className="bg-accent-green hover:bg-green-600 active:scale-95 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-500/20"
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    Выполнить
                                </button>
                            )}
                            {order.status !== 'cancelled' && (
                                <button
                                    onClick={() => updateStatus('cancelled')}
                                    className="glass border border-accent-red/20 hover:bg-red-500/10 active:scale-95 text-accent-red font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all"
                                >
                                    <XCircle className="w-5 h-5" />
                                    Отменить
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Customer Data */}
                <motion.div variants={itemVariants} className="glass rounded-3xl p-5 border border-white/5">
                    <h3 className="text-xs font-bold text-zinc-500 mb-4 flex items-center gap-2 uppercase tracking-wider">
                        <User className="w-3.5 h-3.5" />
                        Данные клиента
                    </h3>

                    <div className="space-y-3">
                        {Object.entries(customerData).map(([key, value]) => (
                            <div
                                key={key}
                                onClick={() => copyToClipboard(value, key)}
                                className="bg-white/5 p-3 rounded-2xl border border-white/5 active:bg-white/10 transition-colors cursor-pointer group"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">{key.replace(/_/g, ' ')}</p>
                                    <Copy className="w-3.5 h-3.5 text-zinc-600 group-hover:text-accent-blue transition-colors" />
                                </div>
                                <p className="text-sm font-mono font-medium text-white break-all">
                                    {String(value)}
                                </p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Internal Notes */}
                <motion.div variants={itemVariants} className="glass rounded-3xl p-5 border border-white/5">
                    <h3 className="text-xs font-bold text-zinc-500 mb-4 flex items-center gap-2 uppercase tracking-wider">
                        <StickyNote className="w-3.5 h-3.5" />
                        Заметки
                    </h3>

                    <div className="mb-4 space-y-3 max-h-40 overflow-y-auto pr-1 scrollbar-hide">
                        {comments.length === 0 && <p className="text-xs text-zinc-600 italic text-center py-2">Нет заметок</p>}
                        {comments.map(c => (
                            <div key={c.id} className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/10 p-3 rounded-xl">
                                <p className="text-sm text-zinc-200 mb-1">{c.text}</p>
                                <div className="flex justify-between items-center text-[10px] text-zinc-500">
                                    <span className="font-bold text-amber-500/80">{c.author}</span>
                                    <span>{c.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="relative">
                        <input
                            type="text"
                            className="w-full bg-black/20 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-sm text-white focus:border-accent-blue/50 transition-all outline-none placeholder-zinc-600 focus:bg-black/40"
                            placeholder="Добавить заметку..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                        />
                        <button
                            onClick={handleAddComment}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-accent-blue rounded-lg text-white active:scale-90 transition-transform shadow-lg shadow-blue-500/20"
                        >
                            <Send className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </motion.div>

                {/* History */}
                <motion.div variants={itemVariants} className="glass rounded-3xl p-5 border border-white/5">
                    <h3 className="text-xs font-bold text-zinc-500 mb-4 flex items-center gap-2 uppercase tracking-wider">
                        <Clock className="w-3.5 h-3.5" />
                        Хронология
                    </h3>

                    <div className="relative pl-4 border-l border-white/10 space-y-6 ml-1">
                        {/* Newest updates first */}
                        {history.map((log) => {
                            const isPositive = log.new_status === 'completed' || log.new_status === 'delivered';
                            const isNegative = log.new_status === 'cancelled';
                            const dotColor = isPositive ? 'bg-accent-green shadow-[0_0_10px_rgba(34,197,94,0.5)]' :
                                isNegative ? 'bg-accent-red shadow-[0_0_10px_rgba(239,68,68,0.5)]' :
                                    'bg-accent-blue shadow-[0_0_10px_rgba(59,130,246,0.5)]';

                            return (
                                <div key={log.id} className="relative">
                                    <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border border-[#09090b] ring-4 ring-[#09090b] ${dotColor}`}></div>
                                    <p className="text-sm text-white font-medium">
                                        <span className="text-zinc-500">{getStatusLabel(log.old_status)}</span>
                                        <span className="mx-2 text-zinc-600">→</span>
                                        <span className={isPositive ? 'text-accent-green' : isNegative ? 'text-accent-red' : 'text-accent-blue'}>
                                            {getStatusLabel(log.new_status)}
                                        </span>
                                    </p>
                                    <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">
                                        {new Date(log.changed_at).toLocaleString('ru-RU')}
                                    </p>
                                </div>
                            );
                        })}

                        {/* Order Created (Oldest event at bottom) */}
                        <div className="relative">
                            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-zinc-700 border border-[#09090b] ring-4 ring-[#09090b]"></div>
                            <p className="text-sm text-zinc-400">Заказ создан</p>
                            <p className="text-[10px] text-zinc-600 font-mono mt-0.5">
                                {new Date(order.created_at).toLocaleString('ru-RU')}
                            </p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* DBM Selection Modal */}
            <AnimatePresence>
                {isDBMModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsDBMModalOpen(false)}
                        className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6"
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-[#18181b] w-full max-w-md rounded-3xl border border-white/10 overflow-hidden max-h-[85vh] flex flex-col"
                        >
                            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                                <h3 className="font-bold text-white">Выбор товара DBM</h3>
                                <button onClick={() => setIsDBMModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full">
                                    <XCircle className="w-5 h-5 text-zinc-400" />
                                </button>
                            </div>

                            <div className="p-4 overflow-y-auto flex-1">
                                {isDbmLoading ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {dbmProducts.map(product => (
                                            <button
                                                key={product.id}
                                                onClick={() => setSelectedDbmProduct(product)}
                                                className={`w-full p-3 rounded-xl border text-left transition-all ${selectedDbmProduct?.id === product.id
                                                        ? 'bg-purple-500/20 border-purple-500/50'
                                                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <span className="text-sm font-medium text-white line-clamp-2">{product.name}</span>
                                                    <span className="text-xs font-bold text-purple-300 whitespace-nowrap ml-2">${product.price}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border-t border-white/5 bg-[#18181b]">
                                <button
                                    disabled={!selectedDbmProduct || isIssuing}
                                    onClick={handleIssueDbm}
                                    className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all"
                                >
                                    {isIssuing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Выдача...
                                        </>
                                    ) : (
                                        <>
                                            <ShoppingBag className="w-5 h-5" />
                                            Выдать и завершить
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default OrderDetail;

