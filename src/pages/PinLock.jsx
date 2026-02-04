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
        <div className="fixed inset-0 bg-[#09090b] z-50 flex flex-col items-center justify-center p-6 text-white safe-area-inset-bottom">
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">
                {/* Icon & Message */}
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mb-8 text-center"
                >
                    <div className="w-16 h-16 glass-panel rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-black/40">
                        {mode === 'check' ? <Lock className="w-8 h-8 text-blue-500" /> : <ShieldCheck className="w-8 h-8 text-emerald-500" />}
                    </div>
                    <h2 className="text-xl font-bold mb-2 tracking-wide">BAZZAR Staff</h2>
                    <p className={`text-sm ${error ? 'text-red-400' : 'text-zinc-400'} transition-colors duration-300 font-medium`}>
                        {error ? 'Неверный код' : message}
                    </p>
                </motion.div>

                {/* Dots */}
                <div className="flex gap-4 mb-12">
                    {[...Array(4)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={false}
                            animate={{
                                scale: i < pin.length ? 1.2 : 1,
                                backgroundColor: error
                                    ? '#ef4444'
                                    : i < pin.length
                                        ? '#3b82f6'
                                        : 'rgba(255, 255, 255, 0.1)'
                            }}
                            className="w-4 h-4 rounded-full transition-colors duration-200"
                        />
                    ))}
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-6 w-full">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            onClick={() => handlePress(num)}
                            className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-3xl font-light border border-white/5 active:bg-blue-600 active:border-blue-500 active:text-white transition-all mx-auto shadow-lg backdrop-blur-md"
                        >
                            {num}
                        </button>
                    ))}

                    {/* FaceID Button or Spacer */}
                    <div className="flex items-center justify-center">
                        {isBiometricAvailable ? (
                            <button
                                onClick={handleBiometricAuth}
                                className="w-20 h-20 rounded-full flex items-center justify-center text-blue-400 active:text-white active:bg-blue-600/20 transition-all mx-auto"
                            >
                                <ScanFace className="w-8 h-8" />
                            </button>
                        ) : (
                            <div className="w-20 h-20"></div>
                        )}
                    </div>

                    <button
                        onClick={() => handlePress(0)}
                        className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-3xl font-light border border-white/5 active:bg-blue-600 active:border-blue-500 active:text-white transition-all mx-auto shadow-lg backdrop-blur-md"
                    >
                        0
                    </button>
                    <button
                        onClick={handleDelete}
                        className="w-20 h-20 rounded-full flex items-center justify-center text-zinc-500 active:text-white active:bg-white/10 transition-all mx-auto"
                    >
                        <Delete className="w-8 h-8" />
                    </button>
                </div>
            </div>

            <button
                onClick={onForgot}
                className="mt-8 text-sm text-zinc-500 font-medium active:text-white transition-colors"
            >
                Забыли код? Войти через пароль
            </button>
        </div>
    );
};

export default PinLock;
