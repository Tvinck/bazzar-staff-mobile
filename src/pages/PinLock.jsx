import { useState, useEffect } from 'react';
import { Delete, ShieldCheck, Lock, ScanFace } from 'lucide-react';
import { motion } from 'framer-motion';
import { useBiometric } from '../hooks/useBiometric';
import { haptic } from '../utils/telegram';

const PinLock = ({ onSuccess, onForgot, mode: propMode }) => {
    const [pin, setPin] = useState('');
    const [mode, setMode] = useState(propMode || 'check'); // 'check' | 'create' | 'confirm'
    const [tempPin, setTempPin] = useState('');
    const [error, setError] = useState(false);
    const [message, setMessage] = useState('');
    const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);

    useEffect(() => {
        const savedPin = localStorage.getItem('bazzar_staff_pin');

        if (propMode) {
            setMode(propMode);
            if (propMode === 'create') setMessage('Придумайте код доступа');
            else setMessage('Введите код доступа');
        } else {
            if (!savedPin) {
                setMode('create');
                setMessage('Придумайте код доступа');
            } else {
                setMode('check');
                setMessage('Введите код доступа');
                checkBiometrics();
            }
        }
    }, [propMode]);

    const checkBiometrics = () => {
        const tg = window.Telegram?.WebApp;
        if (tg?.BiometricManager) {
            tg.BiometricManager.init(() => {
                if (tg.BiometricManager.isBiometricAvailable) {
                    setIsBiometricAvailable(true);
                    // Auto request if access granted
                    if (tg.BiometricManager.isAccessGranted) {
                        // Optional: Auto trigger? Maybe too intrusive. 
                    }
                }
            });
        }
    };

    const handleBiometricAuth = () => {
        const tg = window.Telegram?.WebApp;
        if (!tg?.BiometricManager) return;

        const bm = tg.BiometricManager;
        if (!bm.isAccessGranted) {
            bm.requestAccess({ reason: 'Вход в BAZZAR Staff' }, (granted) => {
                if (granted) authenticate();
            });
        } else {
            authenticate();
        }

        function authenticate() {
            bm.authenticate({ reason: 'Подтвердите личность' }, (success) => {
                if (success) {
                    if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
                    if (onSuccess) onSuccess();
                }
            });
        }
    };

    const handlePress = (num) => {
        haptic.impact('light');
        if (pin.length < 4) {
            const newPin = pin + num;
            setPin(newPin);

            if (newPin.length === 4) {
                handleComplete(newPin);
            }
        }
    };

    const handleDelete = () => {
        haptic.impact('light');
        setPin(pin.slice(0, -1));
        setError(false);
    };

    const handleComplete = (completedPin) => {
        setTimeout(() => {
            if (mode === 'check') {
                const savedPin = localStorage.getItem('bazzar_staff_pin');
                if (completedPin === savedPin) {
                    if (navigator.vibrate) navigator.vibrate([10, 30, 10]); // Success pattern
                    if (onSuccess) onSuccess();
                } else {
                    if (navigator.vibrate) navigator.vibrate([50, 50, 50]); // Error pattern
                    setError(true);
                    setPin('');
                }
            } else if (mode === 'create') {
                setTempPin(completedPin);
                setMode('confirm');
                setPin('');
                setMessage('Повторите код доступа');
            } else if (mode === 'confirm') {
                if (completedPin === tempPin) {
                    localStorage.setItem('bazzar_staff_pin', completedPin);
                    if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
                    if (onSuccess) onSuccess();
                } else {
                    if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
                    setError(true);
                    setPin('');
                    setMessage('Коды не совпадают. Попробуйте снова');
                    setMode('create');
                    setTempPin('');
                }
            }
        }, 300);
    };

    return (
        <div className="fixed inset-0 bg-tg-bg z-50 flex flex-col items-center justify-center p-6 text-white safe-area-inset-bottom overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-accent-blue/10 rounded-full blur-[100px] animate-pulse-glow"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-accent-purple/10 rounded-full blur-[100px] animate-float"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-[80px]"></div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm relative z-10">
                {/* Icon & Message */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="mb-12 text-center"
                >
                    <div className="w-20 h-20 glass rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(0,0,0,0.3)] border border-white/10">
                        {mode === 'check' ? (
                            <div className="relative">
                                <Lock className="w-8 h-8 text-white relative z-10" />
                                <div className="absolute inset-0 bg-accent-blue/50 blur-lg rounded-full"></div>
                            </div>
                        ) : (
                            <div className="relative">
                                <ShieldCheck className="w-8 h-8 text-accent-green relative z-10" />
                                <div className="absolute inset-0 bg-accent-green/50 blur-lg rounded-full"></div>
                            </div>
                        )}
                    </div>
                    <motion.h2
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-2xl font-bold mb-2 tracking-tight"
                    >
                        BAZZAR Staff
                    </motion.h2>
                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className={`text-sm ${error ? 'text-accent-red' : 'text-zinc-400'} transition-colors duration-300 font-medium`}
                    >
                        {error ? 'Неверный код доступа' : message}
                    </motion.p>
                </motion.div>

                {/* Dots */}
                <motion.div
                    className="flex gap-6 mb-16"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    {[...Array(4)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={false}
                            animate={{
                                scale: i < pin.length ? 1.2 : 1,
                                height: i < pin.length ? 16 : 12,
                                width: i < pin.length ? 16 : 12,
                                backgroundColor: error
                                    ? '#ef4444' // Red-500
                                    : i < pin.length
                                        ? '#3b82f6' // Blue-500
                                        : 'rgba(255, 255, 255, 0.15)',
                                boxShadow: i < pin.length ? '0 0 10px rgba(59, 130, 246, 0.5)' : 'none'
                            }}
                            className="rounded-full transition-all duration-300"
                        />
                    ))}
                </motion.div>

                {/* Keypad */}
                <motion.div
                    className="grid grid-cols-3 gap-x-8 gap-y-6 w-full px-4"
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <motion.button
                            key={num}
                            whileTap={{ scale: 0.9, backgroundColor: "rgba(255,255,255,0.2)" }}
                            onClick={() => handlePress(num)}
                            className="w-20 h-20 rounded-full glass border border-white/5 flex items-center justify-center text-3xl font-light text-white transition-colors shadow-lg active:shadow-inner"
                        >
                            {num}
                        </motion.button>
                    ))}

                    {/* FaceID Button or Spacer */}
                    <div className="flex items-center justify-center">
                        {isBiometricAvailable ? (
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={handleBiometricAuth}
                                className="w-20 h-20 rounded-full flex items-center justify-center text-accent-blue hover:text-white transition-all mx-auto"
                            >
                                <ScanFace className="w-8 h-8" />
                            </motion.button>
                        ) : (
                            <div className="w-20 h-20"></div>
                        )}
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.9, backgroundColor: "rgba(255,255,255,0.2)" }}
                        onClick={() => handlePress(0)}
                        className="w-20 h-20 rounded-full glass border border-white/5 flex items-center justify-center text-3xl font-light text-white transition-colors shadow-lg active:shadow-inner"
                    >
                        0
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleDelete}
                        className="w-20 h-20 rounded-full flex items-center justify-center text-zinc-500 hover:text-white transition-all mx-auto"
                    >
                        <Delete className="w-8 h-8" />
                    </motion.button>
                </motion.div>
            </div>

            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                onClick={onForgot}
                className="mt-8 text-sm text-zinc-500 font-medium hover:text-white transition-colors active:scale-95 py-2 px-4 rounded-lg hover:bg-white/5"
            >
                Забыли код? Войти через пароль
            </motion.button>
        </div>
    );
};

export default PinLock;
