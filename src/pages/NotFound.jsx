import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, Home, RefreshCw } from 'lucide-react';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-tg-bg flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-red/10 rounded-full blur-[100px] animate-pulse-glow"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/noise.png')] opacity-20 pointer-events-none"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 flex flex-col items-center text-center max-w-sm w-full"
            >
                {/* 3D-like Icon Container */}
                <motion.div
                    className="w-32 h-32 mb-8 relative"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                    <div className="absolute inset-0 bg-accent-red/20 blur-2xl rounded-full"></div>
                    <div className="relative w-full h-full glass-card rounded-3xl flex items-center justify-center border border-accent-red/30 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
                        <ShieldAlert className="w-14 h-14 text-accent-red drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                    </div>
                </motion.div>

                <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Ошибка 404</h1>
                <p className="text-zinc-400 mb-8 leading-relaxed text-lg">
                    Страница не найдена или<br />доступ к разделу ограничен.
                </p>

                <div className="w-full space-y-3">
                    <button
                        onClick={() => navigate('/')}
                        className="w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-200 active:scale-[0.98] transition-all shadow-lg shadow-white/10"
                    >
                        <Home className="w-5 h-5" />
                        На Главную
                    </button>

                    <button
                        onClick={() => window.location.reload()}
                        className="w-full glass py-4 rounded-xl text-zinc-300 font-medium flex items-center justify-center gap-2 border border-white/5 hover:bg-white/5 active:scale-[0.98] transition-all"
                    >
                        <RefreshCw className="w-5 h-5" />
                        Обновить страницу
                    </button>
                </div>

                <div className="mt-12 flex flex-col items-center opacity-40">
                    <div className="w-12 h-1 bg-zinc-800 rounded-full mb-2"></div>
                    <span className="text-xs text-zinc-600 font-mono tracking-widest">SYSTEM_ERR_NOT_FOUND</span>
                </div>
            </motion.div>
        </div>
    );
};

export default NotFound;
