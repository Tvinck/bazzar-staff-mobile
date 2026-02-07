import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Mail, Lock, ArrowRight, MessageCircle, Loader2, ChevronLeft, ShieldCheck, CheckCircle2, AlertCircle, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { haptic } from '../utils/telegram';
import { motion, AnimatePresence } from 'framer-motion';

const Login = ({ onLogin }) => {
    // Modes: 'login' | 'register'
    const [mode, setMode] = useState('login');
    // Registration Steps: 1=Creds, 2=EmailCode, 3=Telegram, 4=PinSetup
    const [step, setStep] = useState(1);

    // Form Data
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailCode, setEmailCode] = useState('');
    const [telegram, setTelegram] = useState('');
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    // Cooldown timer for resending email
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    // --- LOGIN ---
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            haptic.notification('success');
            toast.success('Успешный вход');
            onLogin();
        } catch (error) {
            haptic.notification('error');
            toast.error('Ошибка входа', { description: 'Проверьте почту и пароль' });
        } finally {
            setLoading(false);
        }
    };

    // --- REGISTRATION ---
    const handleRegisterStep1 = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { telegram: '' } }
            });
            if (error) throw error;

            haptic.notification('success');
            toast.success('Код отправлен!', { description: 'Проверьте папку Спам, если письма нет' });
            setStep(2);
            setResendCooldown(60);
        } catch (error) {
            haptic.notification('error');
            toast.error('Ошибка регистрации', { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (resendCooldown > 0) return;
        setLoading(true);
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email,
            });
            if (error) throw error;
            toast.success('Код отправлен повторно');
            setResendCooldown(60);
        } catch (error) {
            toast.error('Ошибка отправки', { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterStep2 = async (e) => {
        if (e) e.preventDefault();
        const cleanCode = emailCode.replace(/\s/g, '');
        if (cleanCode.length < 6) {
            toast.error('Введите 6 цифр');
            return;
        }

        setLoading(true);
        console.log('Verifying OTP:', { email: email.trim(), code: cleanCode, type: 'signup' });

        try {
            const { data, error } = await supabase.auth.verifyOtp({
                email: email.trim(),
                token: cleanCode,
                type: 'signup'
            });

            if (error) {
                console.error('VerifyOtp detailed error:', error);
                throw error;
            }

            console.log('VerifyOtp success:', data);
            haptic.notification('success');
            toast.success('Почта подтверждена');
            setStep(3);
        } catch (error) {
            console.error('Registration verification failed:', error);
            haptic.notification('error');

            let errorMessage = 'Неверный код';
            if (error.status === 400) {
                errorMessage = 'Срок кода истек или он неверный';
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast.error(errorMessage, {
                description: 'Попробуйте запросить новый код или проверьте почту'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterStep3 = async (e) => {
        e.preventDefault();
        if (!telegram.startsWith('@')) {
            toast.error('Username должен начинаться с @');
            return;
        }
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ data: { telegram } });
            if (error) throw error;

            haptic.notification('success');
            setStep(4);
        } catch (error) {
            haptic.notification('error');
            toast.error('Ошибка сохранения', { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handlePinDigit = async (digit) => {
        if (pin.length < 4) {
            haptic.impact('light');
            const newPin = pin + digit;
            setPin(newPin);

            if (newPin.length === 4) {
                setLoading(true);
                try {
                    localStorage.setItem('bazzar_staff_pin', newPin);
                    const { data: { user } } = await supabase.auth.getUser();

                    if (user) {
                        // Upsert profile with full data
                        const { error: upsertError } = await supabase.from('profiles').upsert({
                            id: user.id,
                            email: user.email,
                            telegram_username: telegram.replace('@', ''),
                            created_at: new Date().toISOString()
                        });
                        if (upsertError) console.error('Profile upsert error:', upsertError);
                    }

                    haptic.notification('success');
                    toast.success('Регистрация завершена!');
                    setTimeout(() => onLogin(), 800);
                } catch (error) {
                    haptic.notification('error');
                    toast.error('Финальная ошибка', { description: error.message });
                    setPin('');
                } finally {
                    setLoading(false);
                }
            }
        }
    };

    // --- UI HELPERS ---
    const StepIndicator = () => (
        <div className="flex gap-2 mb-8 justify-center">
            {[1, 2, 3, 4].map(i => (
                <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-500 ${step >= i ? 'w-8 bg-blue-500' : 'w-4 bg-white/10'
                        }`}
                />
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Design Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px]"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm relative z-10"
            >
                {/* Brand Header */}
                <div className="text-center mb-12">
                    <motion.div
                        animate={step === 4 ? { scale: [1, 1.1, 1] } : {}}
                        className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-[2rem] mx-auto mb-6 flex items-center justify-center border border-white/10 shadow-2xl shadow-blue-500/20"
                    >
                        {step === 4 ? <ShieldCheck className="w-10 h-10 text-emerald-400" /> : <Lock className="w-10 h-10 text-white" />}
                    </motion.div>
                    <h1 className="text-3xl font-black text-white tracking-tight mb-2 uppercase italic">
                        {mode === 'login' ? 'Bazzar Admin' : 'Staff Onboard'}
                    </h1>
                    <p className="text-zinc-500 text-sm font-medium">
                        {mode === 'login' ? 'Панель управления персоналом' :
                            step === 1 ? 'Введите данные для нового аккаунта' :
                                step === 2 ? 'Код подтверждения отправлен на почту' :
                                    step === 3 ? 'Как коллеги смогут найти вас?' : 'Установите код быстрого доступа'}
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {mode === 'login' ? (
                        <motion.form
                            key="login"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            onSubmit={handleLoginSubmit}
                            className="space-y-4"
                        >
                            <div className="space-y-3">
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-700 outline-none focus:border-blue-500/50 transition-all font-medium"
                                        required
                                    />
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        type="password"
                                        placeholder="Пароль"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-700 outline-none focus:border-blue-500/50 transition-all font-medium"
                                        required
                                    />
                                </div>
                            </div>
                            <button type="submit" disabled={loading} className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-zinc-200 transition-all active:scale-[0.98] disabled:opacity-50">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Авторизация'}
                            </button>
                            <button type="button" onClick={() => { setMode('register'); setStep(1); }} className="w-full py-4 text-zinc-500 text-xs font-bold uppercase tracking-widest">
                                Нет аккаунта? <span className="text-blue-500">Регистрация</span>
                            </button>
                        </motion.form>
                    ) : (
                        <motion.div
                            key="register"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <StepIndicator />

                            {step === 1 && (
                                <form onSubmit={handleRegisterStep1} className="space-y-4">
                                    <input
                                        type="email"
                                        placeholder="Рабочая почта"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-blue-500/50 transition-all"
                                        required
                                    />
                                    <input
                                        type="password"
                                        placeholder="Пароль (мин. 6 знаков)"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-blue-500/50 transition-all"
                                        minLength={6}
                                        required
                                    />
                                    <button type="submit" disabled={loading} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm">
                                        {loading ? <Loader2 className="animate-spin mx-auto w-5 h-5" /> : 'Продолжить'}
                                    </button>
                                </form>
                            )}

                            {step === 2 && (
                                <div className="space-y-6">
                                    <div className="flex justify-center flex-col items-center">
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="000 000"
                                            value={emailCode}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/[^0-9]/g, '');
                                                setEmailCode(val);
                                                if (val.length === 6) {
                                                    // Auto-submit when 6 digits are reached
                                                    setTimeout(() => handleRegisterStep2(), 100);
                                                }
                                            }}
                                            className="bg-transparent border-b-2 border-white/20 text-center text-4xl tracking-[0.4em] py-4 text-white focus:border-blue-500 transition-colors font-mono outline-none w-full max-w-[200px]"
                                            maxLength={6}
                                        />
                                        <div className="mt-4 flex flex-col items-center gap-4">
                                            <p className="text-zinc-600 text-[10px] font-bold uppercase text-center">Мы отправили письмо на {email}.<br />Введите 6-значный код из письма.</p>

                                            <div className="flex flex-col gap-2 w-full px-4">
                                                <button
                                                    type="button"
                                                    onClick={handleResendCode}
                                                    disabled={resendCooldown > 0 || loading}
                                                    className="flex items-center justify-center gap-2 text-zinc-400 text-[10px] font-bold uppercase hover:text-white disabled:text-zinc-700 transition-colors"
                                                >
                                                    <RefreshCcw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                                                    {resendCooldown > 0 ? `Повтор через ${resendCooldown}с` : 'Отправить повторно'}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        setLoading(true);
                                                        const { data: { session } } = await supabase.auth.getSession();
                                                        if (session) {
                                                            toast.success('Подтверждено!');
                                                            setStep(3);
                                                        } else {
                                                            toast.error('Почта еще не подтверждена', { description: 'Нажмите на кнопку в письме и попробуйте снова' });
                                                        }
                                                        setLoading(false);
                                                    }}
                                                    className="text-blue-500 text-[10px] font-bold uppercase hover:text-blue-400 transition-colors py-2"
                                                >
                                                    Я уже нажал на ссылку в письме
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={handleRegisterStep2} disabled={loading || emailCode.length < 6} className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-sm disabled:opacity-30">
                                        {loading ? <Loader2 className="animate-spin mx-auto w-5 h-5" /> : 'Подтвердить код'}
                                    </button>
                                </div>
                            )}

                            {step === 3 && (
                                <form onSubmit={handleRegisterStep3} className="space-y-4">
                                    <div className="relative group">
                                        <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                                        <input
                                            type="text"
                                            placeholder="@username"
                                            value={telegram}
                                            onChange={(e) => setTelegram(e.target.value)}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-blue-500/50 transition-all"
                                            required
                                        />
                                    </div>
                                    <button type="submit" disabled={loading} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm">
                                        {loading ? <Loader2 className="animate-spin mx-auto w-5 h-5" /> : 'Сохранить профиль'}
                                    </button>
                                </form>
                            )}

                            {step === 4 && (
                                <div className="text-center">
                                    <div className="flex justify-center gap-4 mb-8">
                                        {[0, 1, 2, 3].map(i => (
                                            <motion.div
                                                key={i}
                                                animate={{
                                                    scale: pin.length > i ? 1.3 : 1,
                                                    backgroundColor: pin.length > i ? "#3b82f6" : "rgba(255,255,255,0.05)"
                                                }}
                                                className="w-3 h-3 rounded-full border border-white/10"
                                            />
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 max-w-[280px] mx-auto">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                            <button
                                                key={num}
                                                onClick={() => handlePinDigit(num)}
                                                className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/5 text-xl font-medium text-white flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all"
                                            >
                                                {num}
                                            </button>
                                        ))}
                                        <div className="col-start-2">
                                            <button onClick={() => handlePinDigit(0)} className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/5 text-xl font-medium text-white flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all">0</button>
                                        </div>
                                        <div className="flex items-center justify-center">
                                            {pin.length > 0 && (
                                                <button onClick={() => setPin(pin.slice(0, -1))} className="w-12 h-12 text-zinc-500 hover:text-white"><ChevronLeft className="w-8 h-8 mx-auto" /></button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step < 4 && (
                                <button type="button" onClick={() => { setMode('login'); setStep(1); }} className="w-full text-center text-xs text-zinc-700 mt-6 font-bold uppercase tracking-widest hover:text-zinc-400">
                                    Вернуться назад
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default Login;
