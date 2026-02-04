import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Rocket, Wallet, Bell } from 'lucide-react';

const slides = [
    {
        id: 1,
        title: 'Добро пожаловать',
        desc: 'Единый центр управления для сотрудников BAZZAR. Все инструменты в одном приложении.',
        icon: Rocket,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10'
    },
    {
        id: 2,
        title: 'Управление заказами',
        desc: 'Получайте заказы мгновенно, меняйте статусы в один клик и общайтесь с клиентами.',
        icon: Bell,
        color: 'text-yellow-500',
        bg: 'bg-yellow-500/10'
    },
    {
        id: 3,
        title: 'Финансы и Рост',
        desc: 'Следите за своим доходом, выполняйте ачивки и поднимайтесь в рейтинге сотрудников.',
        icon: Wallet,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10'
    }
];

const Onboarding = ({ onComplete }) => {
    const [step, setStep] = useState(0);

    const handleNext = () => {
        if (step < slides.length - 1) {
            if (navigator.vibrate) navigator.vibrate(10);
            setStep(step + 1);
        } else {
            if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
            onComplete();
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#09090b] flex flex-col safe-area-inset-bottom">
            <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
                {/* Background Blobs */}
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col items-center text-center z-10"
                    >
                        <div className={`w-32 h-32 rounded-3xl mb-8 flex items-center justify-center ${slides[step].bg} border border-white/5 shadow-2xl skew-y-3`}>
                            {(() => {
                                const Icon = slides[step].icon;
                                return <Icon className={`w-16 h-16 ${slides[step].color}`} />;
                            })()}
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-4 tracking-tight">
                            {slides[step].title}
                        </h2>
                        <p className="text-zinc-400 leading-relaxed max-w-xs">
                            {slides[step].desc}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="p-8">
                {/* Indicators */}
                <div className="flex justify-center gap-2 mb-8">
                    {slides.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-white' : 'w-2 bg-zinc-800'}`}
                        />
                    ))}
                </div>

                <button
                    onClick={handleNext}
                    className="w-full bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-200 active:scale-[0.98] transition-all shadow-lg shadow-white/10"
                >
                    {step === slides.length - 1 ? (
                        <>
                            Начать работу
                            <Check className="w-5 h-5" />
                        </>
                    ) : (
                        <>
                            Далее
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default Onboarding;
