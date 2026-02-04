import { ArrowLeft, User, Shield, Mail, Phone, BadgeCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Staff = () => {
    const navigate = useNavigate();

    const staff = [
        { id: 1, name: 'Артём Г.', role: 'Admin', email: 'artem@bazzar.gg', status: 'online' },
        { id: 2, name: 'Иван И.', role: 'Manager', email: 'ivan@bazzar.gg', status: 'online' },
        { id: 3, name: 'Елена С.', role: 'Support', email: 'elena@bazzar.gg', status: 'offline' },
        { id: 4, name: 'Бот (System)', role: 'Bot', email: 'bot@bazzar.gg', status: 'online' },
    ];

    return (
        <div className="min-h-screen pb-20 bg-[#09090b]">
            <div className="glass-panel border-b border-white/5 pt-12 pb-4 px-4 sticky top-0 z-10 backdrop-blur-xl bg-[#09090b]/80">
                <div className="flex items-center gap-3 mb-2">
                    <button
                        onClick={() => navigate('/services')}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-xl font-bold text-white">Сотрудники</h1>
                </div>
            </div>

            <div className="p-4 grid gap-3">
                {staff.map((user) => (
                    <div key={user.id} className="fintech-card p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center border border-white/10">
                                <User className="w-6 h-6 text-zinc-300" />
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#18181b] ${user.status === 'online' ? 'bg-emerald-500' : 'bg-zinc-500'
                                }`}></div>
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                                <h3 className="text-white font-bold">{user.name}</h3>
                                {user.role === 'Admin' && <BadgeCheck className="w-4 h-4 text-blue-400" />}
                            </div>
                            <p className="text-zinc-500 text-xs">{user.email}</p>
                        </div>

                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${user.role === 'Admin' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                user.role === 'Bot' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                    'bg-zinc-800 text-zinc-400 border-zinc-700'
                            }`}>
                            {user.role}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Staff;
