import { motion } from 'framer-motion';

const LoadingScreen = () => {
    return (
        <div className="fixed inset-0 z-50 bg-[#09090b] flex flex-col items-center justify-center">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent-blue/20 rounded-full blur-3xl animate-pulse-glow"></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 flex flex-col items-center"
            >
                {/* Animated Logo Container */}
                <div className="relative w-20 h-20 mb-8">
                    {/* Ring 1 */}
                    <motion.div
                        className="absolute inset-0 rounded-2xl border-2 border-accent-blue/30"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    />
                    {/* Ring 2 */}
                    <motion.div
                        className="absolute inset-2 rounded-xl border-2 border-accent-purple/30"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                    />

                    {/* Center Icon (Lock/Shield) */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                        >
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                    </div>
                </div>

                {/* Text */}
                <motion.h1
                    className="text-2xl font-bold text-white tracking-widest mb-2"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    BAZZAR
                </motion.h1>
                <p className="text-zinc-500 text-sm tracking-wide font-medium">STAFF PANEL</p>

                {/* Loading Bar */}
                <div className="mt-12 w-48 h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-accent-blue to-accent-purple"
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    />
                </div>
            </motion.div>
        </div>
    );
};

export default LoadingScreen;
