import { useState, useEffect } from 'react';
import { Wallet, ShoppingCart, Gift, Smartphone, TrendingDown, Copy, Check, Loader2, RefreshCw, ExternalLink, ChevronRight, DollarSign, Gamepad2, CreditCard, Info, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import desslyHubAPI from '../../services/desslyHub';
import { haptic } from '../../utils/telegram';
import { useBackButton } from '../../hooks/useBackButton';

const DesslyHub = () => {
    useBackButton();

    // State
    const [balance, setBalance] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [vouchers, setVouchers] = useState([]);
    const [steamGames, setSteamGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Modal states
    const [activeModal, setActiveModal] = useState(null); // 'voucher' | 'steam-gift' | 'steam-refill' | 'mobile'
    const [selectedItem, setSelectedItem] = useState(null);
    const [formData, setFormData] = useState({});
    const [purchasing, setPurchasing] = useState(false);
    const [result, setResult] = useState(null);

    // Transaction detail modal
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    // Load data
    useEffect(() => {
        loadData();

        // Auto-refresh balance every 30 seconds
        const interval = setInterval(() => {
            loadBalance();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadBalance(),
                loadTransactions(),
                loadVouchers(),
                loadSteamGames()
            ]);
        } catch (error) {
            toast.error('Ошибка загрузки данных', { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const loadBalance = async () => {
        try {
            const data = await desslyHubAPI.getBalance();
            if (data && typeof data.balance === 'number') {
                setBalance(data.balance);
            }
        } catch (error) {
            console.error('Balance error:', error);
        }
    };

    const loadTransactions = async () => {
        try {
            const data = await desslyHubAPI.getTransactions(1);
            setTransactions(data.transactions || data.data || []);
        } catch (error) {
            console.error('Transactions error:', error);
        }
    };

    const loadVouchers = async () => {
        try {
            const data = await desslyHubAPI.getVouchers();
            setVouchers(data.products || data.data || []);
        } catch (error) {
            console.error('Vouchers error:', error);
        }
    };

    const loadSteamGames = async () => {
        try {
            const data = await desslyHubAPI.getSteamGames();
            setSteamGames(data.games || data.data || []);
        } catch (error) {
            console.error('Steam games error:', error);
        }
    };

    const handleRefresh = async () => {
        haptic.impact('light');
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
        haptic.notification('success');
    };

    const openModal = (type) => {
        haptic.impact('light');
        setActiveModal(type);
        setSelectedItem(null);
        setFormData({});
        setResult(null);
    };

    const closeModal = () => {
        setActiveModal(null);
        setSelectedItem(null);
        setFormData({});
        setResult(null);
    };

    const handlePurchase = async () => {
        if (!selectedItem) return;

        haptic.impact('medium');
        setPurchasing(true);

        try {
            let response;

            switch (activeModal) {
                case 'voucher':
                    response = await desslyHubAPI.buyVoucher({
                        root_id: selectedItem.root_id || selectedItem.id,
                        variant_id: selectedItem.variant_id || 1,
                        reference: formData.reference || `order_${Date.now()}`
                    });
                    break;

                case 'steam-gift':
                    response = await desslyHubAPI.buySteamGift({
                        appid: selectedItem.appid,
                        friend_url: formData.friend_url
                    });
                    break;

                case 'steam-refill':
                    response = await desslyHubAPI.steamRefill({
                        amount: parseFloat(formData.amount),
                        username: formData.username
                    });
                    break;

                default:
                    throw new Error('Unknown modal type');
            }

            setResult(response);
            haptic.notification('success');
            toast.success('Операция выполнена успешно!');

            // Reload data
            await Promise.all([loadBalance(), loadTransactions()]);
        } catch (error) {
            haptic.notification('error');
            toast.error('Ошибка операции', { description: error.message });
        } finally {
            setPurchasing(false);
        }
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        haptic.impact('light');
        toast.success('Скопировано');
    };

    const getBalanceColor = () => {
        if (!balance) return 'text-zinc-400';
        if (balance > 100) return 'text-emerald-400';
        if (balance > 10) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getStatusBadge = (status) => {
        const config = {
            completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Выполнено' },
            success: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Выполнено' },
            pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', label: 'Ожидание' },
            processing: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Обработка' },
            failed: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Ошибка' },
            error: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Ошибка' }
        };
        return config[status] || config.pending;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#09090b] pb-20">
            {/* Header */}
            <div className="glass-panel border-b border-white/5 px-4 pt-12 pb-4 sticky top-0 z-20 backdrop-blur-xl bg-[#09090b]/80">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold text-white tracking-tight">DesslyHub</h1>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="p-2 rounded-xl bg-white/5 border border-white/10 active:scale-95 transition-all"
                    >
                        <RefreshCw className={`w-5 h-5 text-zinc-400 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Balance Card */}
                <div className="glass-card rounded-2xl p-4 border border-white/10 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-zinc-400 mb-1">Баланс</p>
                            <p className={`text-3xl font-bold ${getBalanceColor()}`}>
                                {balance !== null ? `$${parseFloat(balance).toFixed(2)}` : '—'}
                            </p>
                            {balance !== null && (
                                <p className="text-xs text-zinc-500 mt-1">
                                    ≈ {(parseFloat(balance) * 95).toLocaleString('ru-RU')} ₽
                                </p>
                            )}
                        </div>
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                            <Wallet className="w-7 h-7 text-white" />
                        </div>
                    </div>

                    <a
                        href="https://dbm.desslyhub.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Открыть личный кабинет
                    </a>
                </div>
            </div>

            <div className="p-4 space-y-6">
                {/* Quick Actions */}
                <div>
                    <h2 className="text-lg font-bold text-white mb-3">Быстрые действия</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => openModal('voucher')}
                            className="glass-card rounded-2xl p-4 border border-white/10 active:scale-95 transition-all hover:border-blue-500/30"
                        >
                            <ShoppingCart className="w-6 h-6 text-blue-400 mb-2" />
                            <p className="text-sm font-medium text-white">Выдать ваучер</p>
                            <p className="text-xs text-zinc-500 mt-1">{vouchers.length} доступно</p>
                        </button>

                        <button
                            onClick={() => openModal('steam-gift')}
                            className="glass-card rounded-2xl p-4 border border-white/10 active:scale-95 transition-all hover:border-purple-500/30"
                        >
                            <Gift className="w-6 h-6 text-purple-400 mb-2" />
                            <p className="text-sm font-medium text-white">Steam гифт</p>
                            <p className="text-xs text-zinc-500 mt-1">{steamGames.length} игр</p>
                        </button>

                        <button
                            onClick={() => openModal('steam-refill')}
                            className="glass-card rounded-2xl p-4 border border-white/10 active:scale-95 transition-all hover:border-green-500/30"
                        >
                            <Gamepad2 className="w-6 h-6 text-green-400 mb-2" />
                            <p className="text-sm font-medium text-white">Пополнить Steam</p>
                            <p className="text-xs text-zinc-500 mt-1">Кошелек</p>
                        </button>

                        <button
                            onClick={() => openModal('mobile')}
                            className="glass-card rounded-2xl p-4 border border-white/10 active:scale-95 transition-all hover:border-orange-500/30"
                        >
                            <Smartphone className="w-6 h-6 text-orange-400 mb-2" />
                            <p className="text-sm font-medium text-white">Мобильные игры</p>
                            <p className="text-xs text-zinc-500 mt-1">Пополнение</p>
                        </button>
                    </div>
                </div>

                {/* Transactions */}
                <div>
                    <h2 className="text-lg font-bold text-white mb-3">Последние операции</h2>
                    <div className="space-y-2">
                        {transactions.length === 0 ? (
                            <div className="glass-card rounded-2xl p-8 text-center border border-white/10">
                                <TrendingDown className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                                <p className="text-zinc-500">Нет транзакций</p>
                            </div>
                        ) : (
                            transactions.slice(0, 10).map((tx, index) => {
                                const status = getStatusBadge(tx.status);
                                return (
                                    <button
                                        key={tx.id || `tx-${index}`}
                                        onClick={() => {
                                            haptic.impact('light');
                                            setSelectedTransaction(tx);
                                        }}
                                        className="w-full glass-card rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all text-left"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-white">{tx.product || tx.description || 'Операция'}</p>
                                                <p className="text-xs text-zinc-500 mt-1">ID: {tx.id}</p>
                                            </div>
                                            <div className="text-right flex items-center gap-2">
                                                <div>
                                                    <p className="text-sm font-bold text-red-400">
                                                        -${parseFloat(tx.amount || 0).toFixed(2)}
                                                    </p>
                                                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${status.bg} ${status.text} mt-1`}>
                                                        {status.label}
                                                    </span>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-zinc-600" />
                                            </div>
                                        </div>
                                        <p className="text-xs text-zinc-600">
                                            {tx.created_at ? new Date(tx.created_at).toLocaleString('ru-RU') : 'Дата неизвестна'}
                                        </p>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <PurchaseModal
                isOpen={activeModal !== null}
                type={activeModal}
                items={activeModal === 'voucher' ? vouchers : activeModal === 'steam-gift' ? steamGames : []}
                selectedItem={selectedItem}
                setSelectedItem={setSelectedItem}
                formData={formData}
                setFormData={setFormData}
                purchasing={purchasing}
                result={result}
                onPurchase={handlePurchase}
                onClose={closeModal}
                onCopy={handleCopy}
            />

            {/* Transaction Detail Modal */}
            <TransactionDetailModal
                transaction={selectedTransaction}
                onClose={() => setSelectedTransaction(null)}
                onCopy={handleCopy}
            />
        </div>
    );
};

// Purchase Modal Component
const PurchaseModal = ({ isOpen, type, items, selectedItem, setSelectedItem, formData, setFormData, purchasing, result, onPurchase, onClose, onCopy }) => {
    if (!isOpen) return null;

    const getTitle = () => {
        switch (type) {
            case 'voucher': return 'Выдать ваучер';
            case 'steam-gift': return 'Отправить Steam гифт';
            case 'steam-refill': return 'Пополнить Steam';
            case 'mobile': return 'Пополнить мобильную игру';
            default: return 'Операция';
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25 }}
                    className="glass-panel rounded-3xl p-6 w-full max-w-md border border-white/10 max-h-[80vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-white">{result ? 'Готово!' : getTitle()}</h2>
                        <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                            <X className="w-5 h-5 text-zinc-400" />
                        </button>
                    </div>

                    {result ? (
                        <ResultView result={result} type={type} onCopy={onCopy} onClose={onClose} />
                    ) : (
                        <FormView
                            type={type}
                            items={items}
                            selectedItem={selectedItem}
                            setSelectedItem={setSelectedItem}
                            formData={formData}
                            setFormData={setFormData}
                            purchasing={purchasing}
                            onPurchase={onPurchase}
                        />
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// Form View Component
const FormView = ({ type, items, selectedItem, setSelectedItem, formData, setFormData, purchasing, onPurchase }) => {
    return (
        <div className="space-y-4">
            {/* Item Selection */}
            {(type === 'voucher' || type === 'steam-gift') && (
                <div>
                    <label className="text-sm text-zinc-400 mb-2 block">
                        {type === 'voucher' ? 'Товар' : 'Игра'}
                    </label>
                    <select
                        value={selectedItem?.id || ''}
                        onChange={(e) => {
                            const item = items.find(i => i.id === e.target.value || i.appid === parseInt(e.target.value));
                            setSelectedItem(item);
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors"
                    >
                        <option value="">Выберите {type === 'voucher' ? 'товар' : 'игру'}</option>
                        {items.map((item, index) => (
                            <option key={item.id || item.appid || `item-${index}`} value={item.id || item.appid}>
                                {item.name} {item.price ? `— $${item.price}` : ''}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Type-specific fields */}
            {type === 'voucher' && (
                <div>
                    <label className="text-sm text-zinc-400 mb-2 block">Референс (опционально)</label>
                    <input
                        type="text"
                        value={formData.reference || ''}
                        onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                        placeholder="Email клиента или ID заказа"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
            )}

            {type === 'steam-gift' && (
                <div>
                    <label className="text-sm text-zinc-400 mb-2 block">Ссылка на добавление в друзья</label>
                    <input
                        type="url"
                        value={formData.friend_url || ''}
                        onChange={(e) => setFormData({ ...formData, friend_url: e.target.value })}
                        placeholder="https://s.team/p/..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
            )}

            {type === 'steam-refill' && (
                <>
                    <div>
                        <label className="text-sm text-zinc-400 mb-2 block">Steam логин</label>
                        <input
                            type="text"
                            value={formData.username || ''}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            placeholder="steamusername"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-zinc-400 mb-2 block">Сумма ($)</label>
                        <input
                            type="number"
                            value={formData.amount || ''}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            placeholder="10.00"
                            step="0.01"
                            min="1"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                </>
            )}

            {type === 'mobile' && (
                <div className="text-center py-8">
                    <Smartphone className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                    <p className="text-zinc-500">Функция в разработке</p>
                </div>
            )}

            {/* Purchase Button */}
            {type !== 'mobile' && (
                <button
                    onClick={onPurchase}
                    disabled={!selectedItem || purchasing || (type === 'steam-gift' && !formData.friend_url) || (type === 'steam-refill' && (!formData.username || !formData.amount))}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {purchasing ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Обработка...
                        </>
                    ) : (
                        <>
                            <ShoppingCart className="w-5 h-5" />
                            {type === 'voucher' && selectedItem ? `Купить за $${selectedItem.price}` : 'Выполнить'}
                        </>
                    )}
                </button>
            )}
        </div>
    );
};

// Result View Component
const ResultView = ({ result, type, onCopy, onClose }) => {
    return (
        <div className="space-y-4">
            <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-xl p-4 border border-emerald-500/20">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <Check className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-sm text-emerald-400 font-medium">Операция выполнена</p>
                        <p className="text-xs text-zinc-500">ID: {result.transaction_id || result.id || 'N/A'}</p>
                    </div>
                </div>

                {result.voucher_code && (
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <p className="text-xs text-zinc-400 mb-2">Код активации:</p>
                        <p className="text-xl font-mono font-bold text-white text-center tracking-wider mb-3">
                            {result.voucher_code}
                        </p>
                        <button
                            onClick={() => onCopy(result.voucher_code)}
                            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                        >
                            <Copy className="w-4 h-4" />
                            Скопировать код
                        </button>
                    </div>
                )}

                {result.message && (
                    <p className="text-sm text-zinc-400 mt-3">{result.message}</p>
                )}
            </div>

            <button
                onClick={onClose}
                className="w-full bg-white/5 text-white font-bold py-4 rounded-xl active:scale-95 transition-all"
            >
                Закрыть
            </button>
        </div>
    );
};

// Transaction Detail Modal
const TransactionDetailModal = ({ transaction, onClose, onCopy }) => {
    if (!transaction) return null;

    const status = {
        completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Выполнено', icon: Check },
        success: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Выполнено', icon: Check },
        pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', label: 'Ожидание', icon: Loader2 },
        processing: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Обработка', icon: Loader2 },
        failed: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Ошибка', icon: X },
        error: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Ошибка', icon: X }
    }[transaction.status] || { bg: 'bg-zinc-500/10', text: 'text-zinc-400', label: 'Неизвестно', icon: Info };

    const StatusIcon = status.icon;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25 }}
                    className="glass-panel rounded-3xl p-6 w-full max-w-md border border-white/10"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-white">Детали операции</h2>
                        <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                            <X className="w-5 h-5 text-zinc-400" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Status */}
                        <div className={`${status.bg} rounded-xl p-4 border ${status.text.replace('text-', 'border-')}/20`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full ${status.bg} flex items-center justify-center`}>
                                    <StatusIcon className={`w-6 h-6 ${status.text} ${status.icon === Loader2 ? 'animate-spin' : ''}`} />
                                </div>
                                <div>
                                    <p className={`text-sm ${status.text} font-medium`}>{status.label}</p>
                                    <p className="text-xs text-zinc-500">ID: {transaction.id}</p>
                                </div>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-3">
                            <DetailRow label="Товар" value={transaction.product || transaction.description || 'N/A'} />
                            <DetailRow label="Сумма" value={`-$${parseFloat(transaction.amount || 0).toFixed(2)}`} valueClass="text-red-400 font-bold" />
                            <DetailRow label="Дата" value={transaction.created_at ? new Date(transaction.created_at).toLocaleString('ru-RU') : 'N/A'} />
                            {transaction.reference && <DetailRow label="Референс" value={transaction.reference} />}
                            {transaction.voucher_code && (
                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <p className="text-xs text-zinc-400 mb-2">Код активации:</p>
                                    <p className="text-lg font-mono font-bold text-white text-center tracking-wider mb-3">
                                        {transaction.voucher_code}
                                    </p>
                                    <button
                                        onClick={() => onCopy(transaction.voucher_code)}
                                        className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                                    >
                                        <Copy className="w-4 h-4" />
                                        Скопировать
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

const DetailRow = ({ label, value, valueClass = 'text-white' }) => (
    <div className="flex items-center justify-between py-2 border-b border-white/5">
        <span className="text-sm text-zinc-500">{label}</span>
        <span className={`text-sm ${valueClass}`}>{value}</span>
    </div>
);

export default DesslyHub;
