import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-red-500/10 rounded-full blur-[100px]"></div>

            <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">
                <div className="w-24 h-24 bg-red-500/10 rounded-3xl flex items-center justify-center mb-8 border border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
                    <Lock className="w-10 h-10 text-red-500" />
                </div>

                <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Доступ запрещен</h1>
                <p className="text-zinc-400 mb-8 leading-relaxed">
                    У вас нет прав для просмотра этой страницы или она не существует (404).
                </p>

                <button
                    onClick={() => navigate('/')}
                    className="w-full glass-panel py-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 border border-white/10 hover:bg-white/5 active:scale-[0.98] transition-all"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Вернуться на главную
                </button>

                <div className="mt-12 text-xs text-zinc-600 font-mono">
                    ERROR_CODE: ACCESS_DENIED_OR_NOT_FOUND
                </div>
            </div>
        </div>
    );
};

export default NotFound;
