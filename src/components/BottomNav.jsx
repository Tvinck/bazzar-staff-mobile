import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ClipboardList, Calendar as CalendarIcon, LayoutGrid, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { haptic } from '../utils/telegram';

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { path: '/', icon: Home, label: 'Главная' },
        { path: '/orders', icon: ClipboardList, label: 'Заказы' },
        { path: '/services', icon: LayoutGrid, label: 'Сервисы' },
        { path: '/calendar', icon: CalendarIcon, label: 'Календарь' },
        { path: '/profile', icon: User, label: 'Профиль' },
    ];

    const handleNavigate = (path) => {
        haptic.impact('light');
        navigate(path);
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-[#1c1c1e]/80 backdrop-blur-xl border-t border-white/5 pb-safe pt-2 px-2 z-50">
            <div className="flex justify-around items-center h-16 max-w-md mx-auto">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));

                    return (
                        <button
                            key={item.path}
                            onClick={() => handleNavigate(item.path)}
                            className={`relative flex flex-col items-center justify-center w-full h-full transition-colors duration-200 outline-none ${isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-400'
                                }`}
                        >
                            <div className={`relative p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-white/10' : ''}`}>
                                <item.icon strokeWidth={isActive ? 2.5 : 2} className={`w-6 h-6 ${isActive ? 'text-[#007aff]' : 'text-zinc-500'}`} />
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-indicator"
                                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#007aff] rounded-full"
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                )}
                            </div>
                            <span className={`text-[10px] font-medium mt-1 ${isActive ? 'text-white' : 'text-zinc-500'}`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default BottomNav;
