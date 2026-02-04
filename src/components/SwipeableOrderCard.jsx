import React from 'react';
import {
    SwipeableListItem,
    SwipeAction,
    TrailingActions,
    LeadingActions,
} from 'react-swipeable-list';
import 'react-swipeable-list/dist/styles.css';
import { Clock, CheckCircle, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SwipeableOrderCard = ({ order, onComplete, onTelegram, getStatusConfig }) => {
    const navigate = useNavigate();
    const statusConfig = getStatusConfig(order.status);

    // Свайп влево (Выполнить)
    const trailingActions = () => (
        <TrailingActions>
            <SwipeAction
                destructive={false}
                onClick={() => onComplete(order.id)}
            >
                <div className="flex items-center justify-center bg-emerald-500 w-full h-full rounded-r-2xl">
                    <CheckCircle className="text-white w-6 h-6" />
                </div>
            </SwipeAction>
        </TrailingActions>
    );

    // Свайп вправо (Telegram)
    const leadingActions = () => (
        <LeadingActions>
            <SwipeAction onClick={() => onTelegram(order)}>
                <div className="flex items-center justify-center bg-blue-500 w-full h-full rounded-l-2xl">
                    <MessageCircle className="text-white w-6 h-6" />
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
                className="fintech-card p-4 rounded-2xl cursor-pointer w-full group active:scale-[0.98] transition-all border border-white/5 hover:border-white/10"
            >
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                            {order.total_amount ? `Заказ #${order.id.slice(0, 8)}` : order.customer?.name || `Заказ #${order.id}`}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5 font-mono">ID: {order.id.slice(0, 8)}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                        {statusConfig.label}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <p className="text-sm text-zinc-300 line-clamp-1">
                            {order.items && order.items[0] ? order.items[0].name : 'Товар не указан'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <Clock className="w-3 h-3 text-zinc-500" />
                            <p className="text-xs text-zinc-500 font-medium">
                                {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                    <p className="text-lg font-bold text-white tracking-tight">{order.total_amount?.toLocaleString()} ₽</p>
                </div>
            </div>
        </SwipeableListItem>
    );
};

export default SwipeableOrderCard;
