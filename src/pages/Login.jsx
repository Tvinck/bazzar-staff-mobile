import { useState } from 'react';
import { supabase } from '../supabase';
import { Mail, Lock, ArrowRight, MessageCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { haptic } from '../utils/telegram';

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

    // --- LOGIN ---
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            haptic.notification('success');
            toast.success('Успешный вход');
            onLogin();
        } catch (error) {
            haptic.notification('error');
            toast.error('Ошибка входа', { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    // --- REGISTRATION STEP 1: Create Account ---
    const handleRegisterStep1 = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        telegram: '',
                    }
                }
            });

            if (error) throw error;

            haptic.notification('success');
            toast.success('Код подтверждения отправлен на почту');
            setStep(2);
        } catch (error) {
            haptic.notification('error');
            toast.error('Ошибка регистрации', { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    // --- REGISTRATION STEP 2: Verify Email ---
    const handleRegisterStep2 = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data, error } = await supabase.auth.verifyOtp({
                email,
                token: emailCode,
                type: 'signup'
            });

            if (error) throw error;

            haptic.notification('success');
            toast.success('Почта подтверждена');
            setStep(3);
        } catch (error) {
            haptic.notification('error');
            toast.error('Неверный код', { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    // --- REGISTRATION STEP 3: Add Telegram ---
    const handleRegisterStep3 = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error('User not found');

            const { error } = await supabase.auth.updateUser({
                data: { telegram }
            });

            if (error) throw error;

            haptic.notification('success');
            toast.success('Telegram сохранен');
            setStep(4);
        } catch (error) {
            haptic.notification('error');
            toast.error('Ошибка', { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    // --- REGISTRATION STEP 4: Setup PIN ---
    const handleRegisterStep4 = async (digit) => {
        if (pin.length < 4) {
            haptic.impact('light');
            const newPin = pin + digit;
            setPin(newPin);

            if (newPin.length === 4) {
                setLoading(true);

                try {
                    // Save PIN to localStorage
                    localStorage.setItem('bazzar_staff_pin', newPin);

                    // Create profile in database
                    const { data: { user } } = await supabase.auth.getUser();

                    if (user) {
                        const { error: profileError } = await supabase
                            .from('profiles')
                            .upsert({
                                id: user.id,
                                email: user.email,
                                telegram: telegram || null,
                                created_at: new Date().toISOString()
                            });

                        if (profileError) {
                            console.error('Profile creation error:', profileError);
                        }
                    }

                    haptic.notification('success');
                    toast.success('Регистрация завершена!');

                    // Auto login
                    setTimeout(() => {
                        onLogin();
                    }, 500);
                } catch (error) {
                    haptic.notification('error');
                    toast.error('Ошибка завершения регистрации', { description: error.message });
                } finally {
                    setLoading(false);
                }
            }
        }
    };

    const renderPinPad = () => {
        return (
            <div className="grid grid-cols-3 gap-4 max-w-[240px] mx-auto mt-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                        key={num}
                        onClick={() => handleRegisterStep4(num)}
                        className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 text-xl font-bold text-white flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
                    >
                        {num}
                    </button>
                ))}
                <div className="col-start-2">
                    <button
                        onClick={() => handleRegisterStep4(0)}
                        className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 text-xl font-bold text-white flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
                    >
                        0
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px]"></div>
            </div>

            <div className="w-full max-w-sm relative z-10">
                {/* Logo / Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-xl shadow-blue-500/20">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                        {mode === 'login' ? 'Вход в систему' : 'Регистрация'}
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">
                        {mode === 'login' ? 'Введите ваши данные для доступа' :
                            step === 1 ? 'Шаг 1: Создание аккаунта' :
                                step === 2 ? 'Шаг 2: Проверка почты' :
                                    step === 3 ? 'Шаг 3: Telegram' :
                                        'Шаг 4: Установка PIN'}
                    </p>
                </div>

                {/* --- LOGIN FORM --- */}
                {mode === 'login' && (
                    <form onSubmit={handleLoginSubmit} className="space-y-4 animate-fade-in">
                        <div className="glass-panel p-1 rounded-2xl bg-white/5 border border-white/10">
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-transparent border-none text-white px-4 py-3 focus:ring-0 placeholder-zinc-500 outline-none"
                                required
                            />
                            <div className="h-px bg-white/5 mx-2"></div>
                            <input
                                type="password"
                                placeholder="Пароль"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-transparent border-none text-white px-4 py-3 focus:ring-0 placeholder-zinc-500 outline-none"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Войти'}
                        </button>
                        <p className="text-center text-sm text-zinc-500 mt-4">
                            Нет аккаунта?{' '}
                            <button type="button" onClick={() => setMode('register')} className="text-blue-400 font-bold hover:underline">
                                Создать
                            </button>
                        </p>
                    </form>
                )}

                {/* --- REGISTER WIZARD --- */}
                {mode === 'register' && (
                    <div className="animate-fade-in">
                        {/* Step 1: Creds */}
                        {step === 1 && (
                            <form onSubmit={handleRegisterStep1} className="space-y-4">
                                <div className="space-y-3">
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                        <input
                                            type="email"
                                            placeholder="Ваша почта"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-blue-500 transition-colors outline-none"
                                            required
                                        />
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                        <input
                                            type="password"
                                            placeholder="Придумайте пароль (мин. 6 символов)"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-blue-500 transition-colors outline-none"
                                            minLength={6}
                                            required
                                        />
                                    </div>
                                </div>
                                <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all">
                                    {loading ? <Loader2 className="animate-spin" /> : <>Далее <ArrowRight className="w-4 h-4" /></>}
                                </button>
                            </form>
                        )}

                        {/* Step 2: Email Code */}
                        {step === 2 && (
                            <form onSubmit={handleRegisterStep2} className="space-y-4">
                                <div className="text-center mb-4">
                                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <Mail className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <p className="text-sm text-zinc-400">Мы отправили код на <span className="text-white">{email}</span></p>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Введите код из почты"
                                    value={emailCode}
                                    onChange={(e) => setEmailCode(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl text-center text-2xl tracking-widest py-3.5 text-white focus:border-blue-500 transition-colors font-mono outline-none"
                                    maxLength={6}
                                    required
                                />
                                <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all">
                                    {loading ? <Loader2 className="animate-spin" /> : 'Подтвердить'}
                                </button>
                            </form>
                        )}

                        {/* Step 3: Telegram Input */}
                        {step === 3 && (
                            <form onSubmit={handleRegisterStep3} className="space-y-4">
                                <div className="space-y-3">
                                    <label className="text-sm text-zinc-400 ml-1">Введите ваш Telegram username</label>
                                    <div className="relative">
                                        <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                                        <input
                                            type="text"
                                            placeholder="@username"
                                            value={telegram}
                                            onChange={(e) => setTelegram(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-blue-500 transition-colors outline-none"
                                            required
                                        />
                                    </div>
                                </div>
                                <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all">
                                    {loading ? <Loader2 className="animate-spin" /> : <>Далее <ArrowRight className="w-4 h-4" /></>}
                                </button>
                            </form>
                        )}

                        {/* Step 4: PIN Setup */}
                        {step === 4 && (
                            <div className="text-center">
                                <p className="text-sm text-zinc-400 mb-6">Придумайте код доступа для быстрого входа</p>
                                <div className="flex justify-center gap-4 mb-6">
                                    {[0, 1, 2, 3].map(i => (
                                        <div key={i} className={`w-4 h-4 rounded-full transition-all ${pin.length > i ? 'bg-blue-500 scale-110' : 'bg-white/10'
                                            }`} />
                                    ))}
                                </div>
                                {renderPinPad()}
                            </div>
                        )}

                        {step < 4 && (
                            <button
                                type="button"
                                onClick={() => { setMode('login'); setStep(1); }}
                                className="w-full text-center text-sm text-zinc-500 mt-6 hover:text-white transition-colors"
                            >
                                Вернуться ко входу
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;
