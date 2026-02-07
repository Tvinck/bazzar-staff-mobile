import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Loader2 } from 'lucide-react';
import { supabase } from '../supabase';
import { toast } from 'sonner';

const QuickOrderModal = ({ isOpen, onClose, chat, initialData = {} }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        product: '',
        amount: '',
        platform: 'avito',
        status: 'completed',
        client: ''
    });

    useEffect(() => {
        if (isOpen && chat) {
            setFormData({
                product: initialData.product || '',
                amount: initialData.amount || '',
                platform: chat.platform || 'avito',
                status: 'completed',
                client: chat.clientName || 'Клиент'
            });
        }
    }, [isOpen, chat, initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data, error } = await supabase
                .from('orders')
                .insert([{
                    product_name: formData.product,
                    total_amount: Number(formData.amount),
                    platform: formData.platform,
                    status: formData.status,

                    metadata: {
                        source: 'quick_order_modal',
                        chat_id: chat.id,
                        customer_name: formData.client
                    }
                }])
                .select()
                .single();

            if (error) throw error;

            toast.success('Заказ создан!');
            onClose();
        } catch (err) {
            console.error('Error creating order:', err);
            toast.error('Ошибка создания заказа');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-xl"
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white">Новый заказ</h3>
                    <button onClick={onClose} className="p-2 -mr-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-[10px] uppercase font-bold text-zinc-500 mb-1.5 block">Клиент</label>
                        <input
                            type="text"
                            value={formData.client}
                            onChange={e => setFormData({ ...formData, client: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-blue/50"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] uppercase font-bold text-zinc-500 mb-1.5 block">Товар</label>
                        <input
                            type="text"
                            placeholder="Например: FaceApp Pro 1 год"
                            value={formData.product}
                            onChange={e => setFormData({ ...formData, product: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-blue/50"
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="text-[10px] uppercase font-bold text-zinc-500 mb-1.5 block">Сумма</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-8 py-3 text-sm text-white focus:outline-none focus:border-accent-blue/50"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-bold">₽</span>
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] uppercase font-bold text-zinc-500 mb-1.5 block">Статус</label>
                            <select
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-blue/50 appearance-none"
                            >
                                <option value="pending">В работе</option>
                                <option value="completed">Выполнен</option>
                                <option value="cancelled">Отменен</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !formData.amount || !formData.product}
                        className="w-full bg-accent-blue text-white font-bold py-3.5 rounded-xl mt-2 active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                        Создать заказ
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default QuickOrderModal;
