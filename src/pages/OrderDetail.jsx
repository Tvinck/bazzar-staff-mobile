import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Copy, CheckCircle, XCircle, MessageCircle, CreditCard, Clock, Box, Send, StickyNote } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { toast } from 'sonner';
import { useBackButton } from '../hooks/useBackButton';
import { useMainButton } from '../hooks/useMainButton';
import { showDialog, haptic } from '../utils/telegram';

const OrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [history, setHistory] = useState([]);
    const [comments, setComments] = useState([]); // Internal notes
    const [newComment, setNewComment] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Telegram Mini Apps Integration
    useBackButton(); // Native back button

    // Main Button for quick order completion
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
            // 1. Fetch Order
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select('*')
                .eq('id', id)
                .single();

            if (orderError) {
                console.error(orderError);
                return;
            }

            // 2. Fetch History
            const { data: historyData } = await supabase
                .from('order_history')
                .select('*')
                .eq('order_id', id)
                .order('changed_at', { ascending: false });

            setOrder(orderData);
            setHistory(historyData || []);

            // Mock Comments (Replace with DB fetch later)
            setComments([
                { id: 1, text: 'Клиент просил проверить ID перед отправкой', author: 'Manager', time: '14:30' }
            ]);

            setIsLoading(false);
        };
        fetchOrderData();
    }, [id]);

    const updateStatus = async (newStatus) => {
        const promise = supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', id);

        toast.promise(promise, {
            loading: 'Обновляем статус...',
            success: () => {
                setOrder({ ...order, status: newStatus });
                if (newStatus === 'completed') navigate('/orders');
                return `Статус изменен на ${newStatus}`;
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
    };

    const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(String(text));
        toast.success(`${label} скопирован`, { description: text });
        if (navigator.vibrate) navigator.vibrate(10);
    };

    const getStatusLabel = (s) => {
        const map = { 'new': 'Новый', 'processing': 'В работе', 'completed': 'Выполнен', 'cancelled': 'Отмена' };
        return map[s] || s;
    };

    if (isLoading) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>;
    if (!order) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-500">Заказ не найден</div>;

    const customerData = order.extra_data || {};
    const productItem = order.items?.[0] || {};

    return (
        <div className="min-h-screen bg-[#09090b] pb-20">
            {/* Header */}
            <div className="glass-panel border-b border-white/5 p-4 flex items-center gap-4 sticky top-0 z-10 backdrop-blur-xl bg-[#09090b]/80">
                <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-bold text-white">Заказ #{order.id.slice(0, 8)}</h1>
            </div>

            <div className="p-4 space-y-4">
                {/* Actions Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {order.status !== 'completed' && (
                        <button
                            onClick={() => updateStatus('completed')}
                            className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                        >
                            <CheckCircle className="w-5 h-5" />
                            Выполнить
                        </button>
                    )}
                    {order.status !== 'cancelled' && (
                        <button
                            onClick={() => updateStatus('cancelled')}
                            className="glass-panel border border-white/10 hover:bg-white/5 active:scale-95 text-zinc-300 font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all"
                        >
                            <XCircle className="w-5 h-5" />
                            Отменить
                        </button>
                    )}
                </div>

                {/* Main Info Card */}
                <div className="fintech-card p-5 rounded-3xl relative overflow-hidden border border-white/5">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-bold text-white mb-1 line-clamp-2">{productItem.name || 'Товар'}</h2>
                                <p className="text-sm text-zinc-400">Категория: {productItem.category || 'Общее'}</p>
                            </div>
                            <div className="bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 text-emerald-400 font-bold font-mono whitespace-nowrap">
                                {order.total_amount} ₽
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500 bg-black/20 p-2 rounded-lg w-fit cursor-pointer hover:text-white transition-colors" onClick={() => copyToClipboard(productItem.id, 'ID товара')}>
                            <Box className="w-3.5 h-3.5" />
                            <span className="font-mono">ID: {productItem.id?.slice(0, 8) || 'N/A'}</span>
                            <Copy className="w-3 h-3 ml-1 opacity-50" />
                        </div>
                    </div>
                </div>

                {/* Customer Data */}
                <div className="glass-panel p-5 rounded-3xl border border-white/5">
                    <h3 className="text-sm font-bold text-zinc-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
                        <CreditCard className="w-4 h-4" />
                        Данные для выполнения
                    </h3>

                    <div className="space-y-3">
                        {Object.entries(customerData).map(([key, value]) => (
                            <div
                                key={key}
                                onClick={() => copyToClipboard(value, key)}
                                className="bg-white/5 p-4 rounded-2xl border border-white/5 group active:bg-white/10 transition-colors cursor-pointer"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-xs text-zinc-500 capitalize font-medium">{key.replace(/_/g, ' ')}</p>
                                    <Copy className="w-4 h-4 text-zinc-600 group-hover:text-blue-400 transition-colors" />
                                </div>
                                <p className="text-base font-mono font-medium text-white break-all">
                                    {String(value)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Internal Notes (New Feature) */}
                <div className="glass-panel p-5 rounded-3xl border border-white/5">
                    <h3 className="text-sm font-bold text-zinc-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
                        <StickyNote className="w-4 h-4" />
                        Заметки персонала
                    </h3>

                    <div className="mb-4 space-y-3">
                        {comments.length === 0 && <p className="text-xs text-zinc-600 italic">Нет заметок</p>}
                        {comments.map(c => (
                            <div key={c.id} className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl">
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
                            className="w-full bg-black/20 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-sm text-white focus:border-blue-500 transition-all outline-none placeholder-zinc-600"
                            placeholder="Добавить заметку..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                        />
                        <button
                            onClick={handleAddComment}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-500 rounded-lg text-white active:scale-90 transition-transform"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* History */}
                <div className="glass-panel p-5 rounded-3xl border border-white/5">
                    <h3 className="text-sm font-bold text-zinc-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
                        <Clock className="w-4 h-4" />
                        Хронология
                    </h3>

                    <div className="relative pl-4 border-l-2 border-white/5 space-y-6">
                        <div className="relative">
                            <div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-zinc-800 border-2 border-[#09090b] ring-2 ring-zinc-800"></div>
                            <p className="text-sm text-zinc-400">Заказ создан</p>
                            <p className="text-xs text-zinc-600 font-mono mt-0.5">
                                {new Date(order.created_at).toLocaleString('ru-RU')}
                            </p>
                        </div>
                        {history.map((log) => (
                            <div key={log.id} className="relative">
                                <div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-[#09090b] ring-2 ring-blue-500/20"></div>
                                <p className="text-sm text-white font-medium">
                                    {getStatusLabel(log.old_status)} → <span className="text-emerald-400">{getStatusLabel(log.new_status)}</span>
                                </p>
                                <p className="text-xs text-zinc-500 mt-0.5">
                                    {new Date(log.changed_at).toLocaleString('ru-RU')}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetail;
