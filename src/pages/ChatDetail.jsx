import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, MoreVertical, Send, Paperclip, Smile, ShoppingBag, Check, CheckCheck, X, BookOpen, Copy, Zap } from 'lucide-react';
import QuickOrderModal from '../components/QuickOrderModal';
import { motion, AnimatePresence } from 'framer-motion';
import { haptic } from '../utils/telegram';
import { supabase } from '../supabase';
import { toast } from 'sonner';

const ChatDetail = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    // Initialize with partial data if available, but usually we need to fetch fresh to get metadata.
    const locationChat = location.state?.chat;
    const [chat, setChat] = useState(locationChat || { id: id, clientName: 'Loading...', platform: 'default' });

    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef(null);

    // Orders Drawer State
    const [orders, setOrders] = useState([]);
    const [isOrdersOpen, setIsOrdersOpen] = useState(false);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);

    // Procedures Drawer State
    const [procedures, setProcedures] = useState([]);
    const [isProceduresOpen, setIsProceduresOpen] = useState(false);
    const [isLoadingProcedures, setIsLoadingProcedures] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Wizard State
    const [wizardState, setWizardState] = useState({
        activeProcedure: null,
        currentStepId: null,
        history: [] // Array of step IDs to handle 'Back'
    });

    // Analytics Logger
    const logEvent = async (eventType, stepId = null, payload = {}) => {
        try {
            await supabase.from('procedure_events').insert({
                chat_id: id,
                procedure_id: wizardState.activeProcedure?.id,
                step_id: stepId || wizardState.currentStepId,
                action_type: eventType,
                payload: payload
            });
        } catch (err) {
            console.error('Analytics log error:', err);
        }
    };

    // Log Step Views
    useEffect(() => {
        if (wizardState.activeProcedure && wizardState.currentStepId) {
            logEvent('view', wizardState.currentStepId);
        }
    }, [wizardState.currentStepId, wizardState.activeProcedure]);

    const startWizard = (procedure) => {
        // Check if procedure is wizard-compatible (has 'initial_node_id' in steps)
        if (procedure.steps && procedure.steps.initial_node_id && procedure.steps.nodes) {
            setWizardState({
                activeProcedure: procedure,
                currentStepId: procedure.steps.initial_node_id,
                history: []
            });
        } else {
            // Legacy / Standard list view - do nothing special, just expand? 
            // Currently the UI expands everything. We want to Enter the procedure view.
            // We can use the same state but activeProcedure acting as "Selected".
            setWizardState({ activeProcedure: procedure, currentStepId: null, history: [] });
        }
    };

    const navigateWizard = (nextNodeId) => {
        setWizardState(prev => ({
            ...prev,
            currentStepId: nextNodeId,
            history: [...prev.history, prev.currentStepId]
        }));
        logEvent('option_click', wizardState.currentStepId, { next_node: nextNodeId });
    };

    const backWizard = () => {
        setWizardState(prev => {
            const newHistory = [...prev.history];
            const prevStep = newHistory.pop();
            return {
                ...prev,
                currentStepId: prevStep || prev.activeProcedure.steps.initial_node_id,
                history: newHistory
            };
        });
    };

    const closeWizard = () => {
        setWizardState({ activeProcedure: null, currentStepId: null, history: [] });
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Fetch Chat Details (Metadata, etc.)
    useEffect(() => {
        // If we don't have full chat data or want fresh metadata
        const fetchChatDetails = async () => {
            const { data, error } = await supabase
                .from('platform_chats')
                .select('*')
                .eq('id', id)
                .single();

            if (data) {
                // Map DB fields to UI fields if necessary
                const mappedChat = {
                    ...data,
                    clientName: data.client_name || 'Unknown',
                    platform: data.platform || 'default',
                    avatarColor: 'bg-zinc-700' // Default or derive from name
                };
                setChat(mappedChat);
            }
        };
        fetchChatDetails();
    }, [id]);

    // Fetch Messages & Subscribe
    useEffect(() => {
        let isMounted = true;
        const fetchMessages = async () => {
            try {
                const { data, error } = await supabase
                    .from('platform_messages')
                    .select('*')
                    .eq('chat_id', id)
                    .order('created_at', { ascending: true });

                if (error) throw error;

                if (isMounted && data) {
                    setMessages(data.map(m => ({
                        id: m.id,
                        text: m.text,
                        isMe: m.sender === 'shop',
                        createdAt: new Date(m.created_at),
                        time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        status: m.is_read ? 'read' : 'sent'
                    })));
                }
            } catch (err) {
                console.error('Error fetching messages:', err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchMessages();

        const channel = supabase
            .channel(`chat:${id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'platform_messages',
                filter: `chat_id=eq.${id}`
            }, (payload) => {
                const m = payload.new;
                setMessages(prev => {
                    if (prev.some(msg => msg.id === m.id)) return prev;
                    return [...prev, {
                        id: m.id,
                        text: m.text,
                        isMe: m.sender === 'shop',
                        createdAt: new Date(m.created_at),
                        time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        status: 'sent' // Default to sent for new real-time messages
                    }];
                });
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'platform_messages',
                filter: `chat_id=eq.${id}`
            }, (payload) => {
                setMessages(prev => prev.map(m =>
                    m.id === payload.new.id
                        ? { ...m, status: payload.new.is_read ? 'read' : 'sent' }
                        : m
                ));
            })
            .subscribe();

        return () => {
            isMounted = false;
            supabase.removeChannel(channel);
        };
    }, [id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Fetch Orders
    useEffect(() => {
        if (isOrdersOpen && chat.externalId) {
            const fetchOrders = async () => {
                setIsLoadingOrders(true);
                try {
                    const { data, error } = await supabase
                        .from('orders')
                        .select('*')
                        .or(`external_id.eq.${chat.externalId},metadata->>external_id.eq.${chat.externalId}`)
                        .order('created_at', { ascending: false });

                    if (error) throw error;
                    setOrders(data || []);
                } catch (err) {
                    console.error('Error fetching orders:', err);
                } finally {
                    setIsLoadingOrders(false);
                }
            };
            fetchOrders();
        }
    }, [isOrdersOpen, chat.externalId]);

    // Fetch Procedures
    useEffect(() => {
        if (isProceduresOpen && procedures.length === 0) {
            const fetchProcedures = async () => {
                setIsLoadingProcedures(true);
                try {
                    const { data, error } = await supabase
                        .from('procedures')
                        .select('*')
                        .order('title');

                    if (error) throw error;
                    setProcedures(data || []);
                } catch (err) {
                    console.error('Error fetching procedures:', err);
                } finally {
                    setIsLoadingProcedures(false);
                }
            };
            fetchProcedures();
        }
    }, [isProceduresOpen]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;
        haptic.impact('light');

        const text = inputValue;
        setInputValue('');

        // Optimistic update
        const tempId = Date.now();
        const optimisticMsg = {
            id: tempId,
            text: text,
            isMe: true,
            createdAt: new Date(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'sending'
        };
        setMessages(prev => [...prev, optimisticMsg]);

        scrollToBottom();

        let data, error;

        if (chat.platform === 'avito') {
            const { data: funcData, error: funcError } = await supabase.functions.invoke('avito-io', {
                body: {
                    action: 'send_message',
                    chatId: chat.id, // passing the internal ID, edge function handles mapping if needed or uses it directly
                    text: text
                }
            });

            if (funcError) {
                error = funcError;
            } else {
                data = funcData.message; // Edge function returns { success: true, message: dbRecord }
            }
        } else {
            // Standard Insert
            const response = await supabase
                .from('platform_messages')
                .insert({
                    chat_id: id,
                    text: text,
                    sender: 'shop',
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            data = response.data;
            error = response.error;
        }

        if (error) {
            console.error('Failed to send message:', error);
            toast.error('Ошибка отправки');
            setMessages(prev => prev.filter(m => m.id !== tempId)); // Rollback
        } else {
            // Replace temp message with real one
            setMessages(prev => prev.map(m => m.id === tempId ? {
                ...m,
                id: data.id,
                status: 'sent'
            } : m));
        }
    };

    const [isQuickOrderOpen, setIsQuickOrderOpen] = useState(false);
    const [quickOrderInitial, setQuickOrderInitial] = useState({});

    const handleScriptAction = async (script) => {
        if (script.action === 'create_order') {
            setQuickOrderInitial(script.payload || {});
            setIsQuickOrderOpen(true);
            setIsProceduresOpen(false);
            haptic.impact('medium');
            logEvent('script_use', null, { action: 'create_order' });
        } else if (script.action === 'update_profile') {
            const { key, value, label } = script.payload;

            // 1. Update DB
            const currentMetadata = chat.metadata || {};
            const newMetadata = { ...currentMetadata, [key]: { value, label } };

            toast.promise(
                async () => {
                    const { error } = await supabase
                        .from('platform_chats')
                        .update({ metadata: newMetadata })
                        .eq('id', chat.id);
                    if (error) throw error;

                    // 2. Update Local State
                    setChat(prev => ({ ...prev, metadata: newMetadata }));
                },
                {
                    loading: 'Обновляю профиль...',
                    success: `${label || value} сохранено в профиль`,
                    error: 'Ошибка обновления профиля'
                }
            );

            logEvent('script_use', null, { action: 'update_profile', key, value });
            // Don't close wizard, just notify success
            haptic.notification('success');
        } else if (script.action === 'add_tag') {
            const { tag } = script.payload;
            if (!tag) return;

            // Optimistic / Fire-and-forget tag addition
            // We need an endpoint or logic to add tag to PROFILES or PLATFORM_CHATS.
            // Since `chat` object has `clientId` (internal profile id) or we use `chat.id` to find the record.
            // Let's assume we tag the internal profile.

            toast.promise(
                async () => {
                    // Logic to add tag.
                    // 1. Get current tags from chat/profile
                    // For now, let's just log it or update a 'tags' column in 'platform_chats' if it exists.
                    // Or 'profiles'. Let's assume platform_chats has tags or we just use metadata.

                    const { data: currentChat, error: fetchError } = await supabase
                        .from('platform_chats')
                        .select('tags')
                        .eq('id', chat.id)
                        .single();

                    if (fetchError) throw fetchError;

                    const existingTags = currentChat.tags || [];
                    if (!existingTags.includes(tag)) {
                        const { error: updateError } = await supabase
                            .from('platform_chats')
                            .update({ tags: [...existingTags, tag] })
                            .eq('id', chat.id);
                        if (updateError) throw updateError;
                    }
                },
                {
                    loading: 'Добавляю тег...',
                    success: `Тег "${tag}" добавлен`,
                    error: 'Ошибка добавления тега'
                }
            );
            setIsProceduresOpen(false);
            haptic.notification('success');
        } else {
            setInputValue(script.text);
            setIsProceduresOpen(false);
            haptic.notification('success');
            logEvent('script_use', null, { action: 'send_text' });
        }
    };

    // Date Grouping Helper
    const groupMessagesByDate = (msgs) => {
        const groups = {};
        msgs.forEach(msg => {
            const date = msg.createdAt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
            if (!groups[date]) groups[date] = [];
            groups[date].push(msg);
        });
        return groups;
    };

    const groupedMessages = groupMessagesByDate(messages);

    const filteredProcedures = procedures.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="flex flex-col h-[100dvh] bg-tg-bg relative overflow-hidden">
            {/* Background Effects */}
            <div className="fixed top-0 left-0 w-full h-[300px] bg-accent-blue/5 blur-[100px] pointer-events-none" />

            {/* Header */}
            <div className="glass border-b border-white/5 pt-safe px-4 pb-3 z-20 backdrop-blur-xl flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${chat.avatarColor || 'bg-zinc-700'} flex items-center justify-center text-white font-bold text-sm shadow-inner shrink-0`}>
                            {chat.clientName?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-white font-bold text-sm leading-tight truncate">{chat.clientName}</h2>
                            <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wide opacity-80 flex items-center gap-1 overflow-x-auto scrollbar-hide">
                                {chat.platform === 'yandex' && <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0"></span>}
                                {chat.platform === 'digiseller' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>}
                                {chat.platform === 'ggsel' && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>}
                                {chat.platform === 'avito' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></span>}
                                <span className="shrink-0">{chat.platform}</span>

                                {/* Metadata Tags */}
                                {chat.metadata && Object.entries(chat.metadata).map(([key, data]) => (
                                    <span key={key} className="ml-2 px-1.5 py-0.5 rounded-md bg-white/10 text-[9px] text-white flex items-center gap-1 whitespace-nowrap">
                                        <span className="opacity-50">{key}:</span>
                                        {data.label || data.value}
                                    </span>
                                ))}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsProceduresOpen(true)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-purple-400 hover:bg-white/5 active:bg-white/10 transition-colors"
                    >
                        <BookOpen className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setIsOrdersOpen(true)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-accent-blue hover:bg-white/5 active:bg-white/10 transition-colors relative"
                    >
                        <ShoppingBag className="w-5 h-5" />
                        {orders.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent-blue" />}
                    </button>
                </div>
            </div>

            {/* Orders Drawer */}
            <AnimatePresence>
                {isOrdersOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsOrdersOpen(false)}
                            className="fixed inset-0 bg-black/60 z-30 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed top-0 right-0 h-full w-[85%] max-w-sm bg-[#18181b] z-40 border-l border-white/10 shadow-2xl flex flex-col pt-safe pb-safe"
                        >
                            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white">Товары клиента</h2>
                                <button onClick={() => setIsOrdersOpen(false)} className="p-2 rounded-lg hover:bg-white/5 text-zinc-400">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {isLoadingOrders ? (
                                    <div className="text-center py-10 text-zinc-500 text-sm">Загрузка товаров...</div>
                                ) : orders.length === 0 ? (
                                    <div className="text-center py-10 text-zinc-500 text-sm">Нет заказов</div>
                                ) : (
                                    orders.map(order => (
                                        <div key={order.id} className="glass-card p-3 rounded-xl border border-white/5" onClick={() => navigate(`/orders/${order.id}`)}>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                                                    {order.status}
                                                </span>
                                                <span className="text-xs font-bold text-white">{(order.total_amount ?? 0).toLocaleString()} ₽</span>
                                            </div>
                                            <p className="text-sm text-zinc-200 line-clamp-2">{order.product_name ?? 'Товар'}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Procedures Drawer */}
            <AnimatePresence>
                {isProceduresOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsProceduresOpen(false)}
                            className="fixed inset-0 bg-black/60 z-30 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed top-0 right-0 h-full w-[85%] max-w-sm bg-[#18181b] z-40 border-l border-white/10 shadow-2xl flex flex-col pt-safe pb-safe"
                        >
                            {/* Wizard Header */}
                            {wizardState.activeProcedure ? (
                                <div className="p-4 border-b border-white/5 flex items-center gap-3">
                                    <button onClick={wizardState.history.length > 0 ? backWizard : closeWizard} className="p-2 -ml-2 rounded-lg hover:bg-white/5 text-zinc-400">
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-base font-bold text-white truncate">{wizardState.activeProcedure.title}</h2>
                                        {wizardState.currentStepId && (
                                            <p className="text-[10px] text-zinc-500 uppercase font-medium">
                                                {wizardState.activeProcedure.steps.nodes[wizardState.currentStepId]?.title}
                                            </p>
                                        )}
                                    </div>
                                    <button onClick={() => { setIsProceduresOpen(false); closeWizard(); }} className="p-2 -mr-2 rounded-lg hover:bg-white/5 text-zinc-400">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="p-4 border-b border-white/5 flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-bold text-white">База знаний</h2>
                                        <button onClick={() => setIsProceduresOpen(false)} className="p-2 rounded-lg hover:bg-white/5 text-zinc-400">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Поиск скриптов..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
                                    />
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {isLoadingProcedures ? (
                                    <div className="text-center py-10 text-zinc-500 text-sm">Загрузка...</div>
                                ) : wizardState.activeProcedure ? (
                                    // Wizard View
                                    (() => {
                                        const node = wizardState.activeProcedure.steps.nodes?.[wizardState.currentStepId];
                                        if (!node) return <div className="text-zinc-500 text-center">Ошибка шага</div>;

                                        return (
                                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                                {/* Text Description */}
                                                {node.text && (
                                                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                                        <p className="text-sm text-zinc-200 leading-relaxed">{node.text}</p>
                                                    </div>
                                                )}

                                                {/* Scripts */}
                                                {node.scripts?.length > 0 && (
                                                    <div className="space-y-2">
                                                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Скрипты</h3>
                                                        {node.scripts.map((script, idx) => (
                                                            <button
                                                                key={idx}
                                                                onClick={() => handleScriptAction(script)}
                                                                className={`w-full text-left p-3 rounded-xl transition-all active:scale-[0.98] group relative overflow-hidden ${script.action === 'create_order' ? 'bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 hover:border-blue-500/40' : 'bg-zinc-800/50 hover:bg-zinc-800 border border-white/5 hover:border-white/10'}`}
                                                            >
                                                                <div className="flex justify-between items-center mb-1.5">
                                                                    <span className={`text-[11px] font-bold uppercase tracking-wide ${script.action === 'create_order' ? 'text-blue-400' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                                                                        {script.action === 'create_order' && <Zap className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}
                                                                        {script.label}
                                                                    </span>
                                                                    {script.action !== 'create_order' && <Copy className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400" />}
                                                                </div>
                                                                <p className={`text-sm leading-relaxed ${script.action === 'create_order' ? 'text-blue-100' : 'text-zinc-300'}`}>
                                                                    {script.text || 'Действие системы'}
                                                                </p>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Navigation Options */}
                                                {node.options?.length > 0 && (
                                                    <div className="space-y-2 pt-2">
                                                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Действия</h3>
                                                        <div className="grid grid-cols-1 gap-2">
                                                            {node.options.map((opt, idx) => (
                                                                <button
                                                                    key={idx}
                                                                    onClick={() => navigateWizard(opt.next_node_id)}
                                                                    className="w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all text-sm font-medium text-white flex justify-between items-center group active:scale-[0.98]"
                                                                >
                                                                    {opt.label}
                                                                    {/* Simple chevron logic: if going 'back' or 'start' maybe left arrow? But usually forward. */}
                                                                    <ArrowLeft className="w-4 h-4 rotate-180 text-zinc-500 group-hover:text-white transition-colors" />
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()
                                ) : (
                                    // List View (Legacy / Selection)
                                    filteredProcedures.length === 0 ? (
                                        <div className="text-center py-10 text-zinc-500 text-sm">Ничего не найдено</div>
                                    ) : (
                                        filteredProcedures.map(proc => (
                                            <div
                                                key={proc.id}
                                                onClick={() => startWizard(proc)}
                                                className="glass-card p-4 rounded-xl border border-white/5 hover:bg-white/5 transition-colors cursor-pointer group active:scale-[0.98]"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="text-sm font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">{proc.title}</h3>
                                                        <p className="text-xs text-zinc-500 line-clamp-2">{proc.description}</p>
                                                    </div>
                                                    <ArrowLeft className="w-4 h-4 rotate-180 text-zinc-600 group-hover:text-zinc-400 mt-1 transition-colors" />
                                                </div>
                                            </div>
                                        ))
                                    )
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 relative z-10 scrollbar-hide">
                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <div className="w-6 h-6 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    Object.entries(groupedMessages).map(([date, msgs]) => (
                        <div key={date}>
                            <div className="flex justify-center mb-4 sticky top-0 z-10">
                                <span className="bg-zinc-800/80 backdrop-blur-sm text-zinc-400 text-[10px] font-medium px-3 py-1 rounded-full shadow-sm border border-white/5">
                                    {date}
                                </span>
                            </div>
                            <div className="space-y-2">
                                {msgs.map((msg) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm relative shadow-sm ${msg.isMe
                                                ? 'bg-accent-blue text-white rounded-tr-sm'
                                                : 'glass-card border border-white/10 text-zinc-200 rounded-tl-sm'
                                                }`}
                                        >
                                            <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                            <div className={`text-[9px] mt-1 flex items-center gap-1 justify-end ${msg.isMe ? 'text-blue-200' : 'text-zinc-50'}`}>
                                                {msg.time}
                                                {msg.isMe && (
                                                    msg.status === 'read' ? <CheckCheck className="w-3 h-3 text-blue-200" /> : <Check className="w-3 h-3 text-blue-200/50" />
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-2 pb-safe glass border-t border-white/5 shrink-0 z-20">
                <div className="flex items-end gap-2 p-2 relative">
                    <button className="p-3 text-zinc-400 hover:text-white transition-colors">
                        <Paperclip className="w-5 h-5" />
                    </button>

                    <div className="flex-1 bg-zinc-800/50 border border-white/10 rounded-2xl flex items-center min-h-[44px]">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Сообщение..."
                            className="w-full bg-transparent border-none outline-none text-white text-sm px-4 py-2 placeholder-zinc-500 resize-none"
                        />
                        <button className="p-2 mr-1 text-zinc-500 hover:text-accent-blue transition-colors">
                            <Smile className="w-5 h-5" />
                        </button>
                    </div>

                    <button
                        onClick={handleSend}
                        className={`p-3 rounded-full transition-all duration-300 ${inputValue.trim()
                            ? 'bg-accent-blue text-white shadow-lg shadow-blue-500/20 scale-100'
                            : 'bg-zinc-800 text-zinc-500 scale-90 opacity-80'
                            }`}
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
            {/* Quick Order Modal */}
            <QuickOrderModal
                isOpen={isQuickOrderOpen}
                onClose={() => setIsQuickOrderOpen(false)}
                chat={chat}
                initialData={quickOrderInitial}
            />
        </div>
    );
};

export default ChatDetail;
