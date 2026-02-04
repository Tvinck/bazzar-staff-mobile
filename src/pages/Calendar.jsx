import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, DollarSign, Briefcase, MapPin } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { supabase } from '../supabase';

const Calendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [monthlyStats, setMonthlyStats] = useState({ shifts: 14, earnings: 42000 });

    const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date) => {
        const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        return day === 0 ? 6 : day - 1; // Adjust for Monday start
    };

    // Mock upcoming shifts
    const upcomingShifts = [
        { id: 1, date: 'Завтра, 20 янв', time: '09:00 - 21:00', type: 'Дневная', location: 'Удаленно' },
        { id: 2, date: 'Среда, 21 янв', time: '09:00 - 21:00', type: 'Дневная', location: 'Удаленно' },
        { id: 3, date: 'Суббота, 24 янв', time: '21:00 - 09:00', type: 'Ночная', location: 'Удаленно' },
    ];

    return (
        <div className="min-h-screen pb-20">
            {/* Header */}
            <div className="pt-12 pb-6 px-6">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-2xl font-bold text-white tracking-tight">График работы</h1>
                    <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400 font-bold whitespace-nowrap">~{monthlyStats.earnings.toLocaleString()} ₽</span>
                    </div>
                </div>
                <p className="text-zinc-400 text-sm">Ваши смены на этот месяц</p>
            </div>

            {/* Calendar Grid */}
            <div className="px-4 mb-6">
                <div className="fintech-card rounded-3xl p-4 overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
                            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-zinc-400 hover:text-white"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h2 className="text-lg font-bold text-white capitalize tracking-wide">
                            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h2>
                        <button
                            onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
                            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-zinc-400 hover:text-white"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Days Header */}
                    <div className="grid grid-cols-7 mb-4">
                        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
                            <div key={d} className="text-center text-zinc-500 text-xs font-medium py-1">{d}</div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-y-2 gap-x-1">
                        {[...Array(getFirstDayOfMonth(currentDate))].map((_, i) => <div key={`empty-${i}`} className="aspect-square"></div>)}
                        {[...Array(getDaysInMonth(currentDate))].map((_, i) => {
                            const day = i + 1;
                            // Mock shift pattern: 2 work, 2 rest
                            // Just for visualization
                            const isWorkDay = (day % 4 === 1 || day % 4 === 2);
                            const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth();

                            return (
                                <button key={day} className="relative aspect-square flex flex-col items-center justify-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${isToday
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                            : isWorkDay
                                                ? 'text-white'
                                                : 'text-zinc-500'
                                        }`}>
                                        {day}
                                    </div>
                                    {isWorkDay && (
                                        <div className={`w-1.5 h-1.5 rounded-full mt-1 ${isToday ? 'bg-white' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}></div>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Upcoming Shifts */}
            <div className="px-4 pb-4">
                <h3 className="text-lg font-bold text-white mb-4 px-1">Ближайшие смены</h3>
                <div className="space-y-3">
                    {upcomingShifts.map(shift => (
                        <div key={shift.id} className="glass-panel p-4 rounded-2xl flex items-center gap-4 hover:bg-white/5 transition-colors">
                            <div className="flex flex-col items-center justify-center w-12 h-14 bg-white/5 rounded-xl border border-white/5">
                                <span className="text-xs text-zinc-400 font-medium">Янв</span>
                                <span className="text-lg font-bold text-white">{shift.date.split(' ')[1]}</span>
                            </div>

                            <div className="flex-1">
                                <p className="text-white font-medium mb-1">{shift.date.split(',')[0]} • {shift.type}</p>
                                <div className="flex items-center gap-3 text-xs text-zinc-500">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        {shift.time}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {shift.location}
                                    </span>
                                </div>
                            </div>

                            <div className="w-1.5 h-12 bg-emerald-500/50 rounded-full"></div>
                        </div>
                    ))}
                </div>
            </div>

            <BottomNav />
        </div>
    );
};

export default Calendar;
