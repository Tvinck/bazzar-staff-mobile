import React from 'react';
import {
    SwipeableListItem,
    SwipeAction,
    TrailingActions,
    LeadingActions,
} from 'react-swipeable-list';
import 'react-swipeable-list/dist/styles.css';
import { Clock, CheckCircle, MessageCircle, ShoppingBag, Globe, Zap, Circle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SwipeableOrderCard = ({ order, onComplete, onChat, getStatusConfig }) => {
    const navigate = useNavigate();
    const statusConfig = getStatusConfig(order.status);

    // Robust data fallback
    const price = order.total_amount ?? order.price ?? 0;
    const productName = order.items?.[0]?.name ?? order.product_name ?? 'Товар без названия';
    const customerName = order.metadata?.customer_name ?? order.customer?.name ?? `Заказ #${order.id.slice(0, 8)}`;

    // Свайп влево (Выполнить)
    const trailingActions = () => (
        <TrailingActions>
            <SwipeAction
                destructive={false}
                onClick={() => onComplete(order.id)}
            >
                <div className="flex items-center justify-center bg-accent-green/20 backdrop-blur-md w-full h-full rounded-r-2xl border-y border-r border-accent-green/20">
                    <CheckCircle className="text-accent-green w-6 h-6" />
                </div>
            </SwipeAction>
        </TrailingActions>
    );

    // Свайп вправо (Чат)
    const leadingActions = () => (
        <LeadingActions>
            <SwipeAction onClick={() => onChat(order)}>
                <div className="flex items-center justify-center bg-accent-blue/20 backdrop-blur-md w-full h-full rounded-l-2xl border-y border-l border-accent-blue/20">
                    <MessageCircle className="text-accent-blue w-6 h-6" />
                </div>
            </SwipeAction>
        </LeadingActions>
    );

    return (
        <SwipeableListItem
            leadingActions={leadingActions()}
            trailingActions={trailingActions()}
            maxSwipe={0.5}
            threshold={0.2}
        >
            <div
                onClick={() => navigate(`/orders/${order.id}`)}
                className="glass-card p-4 rounded-2xl cursor-pointer w-full group active:scale-[0.98] border border-white/5"
            >
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-bold text-white group-hover:text-accent-blue transition-colors truncate">
                                {customerName}
                            </p>
                            {order.platform === 'yandex' && (
                                <div className="p-0.5 bg-yellow-500/10 text-yellow-500 rounded">
                                    <ShoppingBag className="w-2.5 h-2.5" />
                                </div>
                            )}
                            {order.platform === 'digiseller' && (
                                <div className="p-0.5 bg-blue-500/10 text-blue-500 rounded">
                                    <Globe className="w-2.5 h-2.5" />
                                </div>
                            )}
                            {order.platform === 'ggsel' && (
                                <div className="p-0.5 bg-orange-500/10 text-orange-500 rounded">
                                    <Zap className="w-2.5 h-2.5" />
                                </div>
                            )}
                            {order.platform === 'avito' && (
                                <div className="p-0.5 bg-green-500/10 text-green-500 rounded">
                                    <Circle className="w-2.5 h-2.5" />
                                </div>
                            )}
                        </div>
                        <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
                            ID: {order.id.slice(0, 8)}
                        </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-wide ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                        {statusConfig.label}
                    </span>
                </div>

                <div className="flex items-end justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-zinc-500 font-medium mb-0.5 uppercase tracking-wide">Товар</p>
                        <p className="text-sm text-zinc-200 line-clamp-2 font-medium leading-relaxed">
                            {productName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2">
                            <Clock className="w-3 h-3 text-zinc-600" />
                            <p className="text-[10px] text-zinc-500 font-medium">
                                {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-[10px] text-zinc-500 font-medium mb-0.5 uppercase tracking-wide">Сумма</p>
                        <p className="text-lg font-bold text-white tracking-tight tabular-nums">
                            {price.toLocaleString()} ₽
                        </p>
                    </div>
                </div>
            </div>
        </SwipeableListItem>
    );
};

export default SwipeableOrderCard;
