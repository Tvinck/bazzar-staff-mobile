import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, FileText, CheckCircle, Copy, ChevronRight, BookOpen, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase';
import { toast } from 'sonner';
import { haptic } from '../utils/telegram';

const Procedures = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [procedures, setProcedures] = useState([]);
    const [selectedProcedure, setSelectedProcedure] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProcedures();
    }, []);

    const fetchProcedures = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('procedures')
                .select('*')
                .order('title');

            if (error) throw error;
            setProcedures(data || []);
        } catch (err) {
            console.error('Error fetching procedures:', err);
            toast.error('Не удалось загрузить процедуры');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyScript = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Скрипт скопирован');
        haptic.notification('success');
    };

    const filteredProcedures = procedures.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const categories = [...new Set(procedures.map(p => p.category || 'General'))];

    return (
        <div className="min-h-screen bg-tg-bg pb-24 relative">
            {/* Header */}
            <div className="glass border-b border-white/5 pt-safe px-4 pb-4 sticky top-0 z-20 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-4">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-xl font-bold text-white">Процедуры</h1>
                </div>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Поиск процедур..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-accent-blue/50 transition-colors"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-6">
                {loading ? (
                    <div className="text-center text-zinc-500 py-10">Загрузка...</div>
                ) : filteredProcedures.length === 0 ? (
                    <div className="text-center text-zinc-500 py-10">Ничего не найдено</div>
                ) : (
                    categories.map(cat => {
                        const catProcedures = filteredProcedures.filter(p => (p.category || 'General') === cat);
                        if (catProcedures.length === 0) return null;

                        return (
                            <div key={cat}>
                                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-3 px-1">{cat}</h3>
                                <div className="space-y-2">
                                    {catProcedures.map(proc => (
                                        <div
                                            key={proc.id}
                                            onClick={() => { setSelectedProcedure(proc); haptic.impact('light'); }}
                                            className="glass-card p-4 rounded-xl border border-white/5 active:scale-[0.99] transition-transform cursor-pointer hover:bg-white/5"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="text-white font-semibold mb-1">{proc.title}</h4>
                                                    <p className="text-xs text-zinc-400 line-clamp-2">{proc.description}</p>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-zinc-600" />
                                            </div>
                                            {proc.tags && proc.tags.length > 0 && (
                                                <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
                                                    {proc.tags.map(tag => (
                                                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 whitespace-nowrap">
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Procedure Detail Modal */}
            <AnimatePresence>
                {selectedProcedure && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedProcedure(null)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="absolute bottom-0 left-0 right-0 h-[85vh] bg-[#18181b] rounded-t-3xl border-t border-white/10 flex flex-col overflow-hidden"
                        >
                            <div className="p-6 border-b border-white/5 flex items-start justify-between shrink-0">
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-1">{selectedProcedure.title}</h2>
                                    <p className="text-sm text-zinc-400">{selectedProcedure.description}</p>
                                </div>
                                <button onClick={() => setSelectedProcedure(null)} className="p-2 -mr-2 text-zinc-500 hover:text-white">
                                    <ArrowLeft className="w-6 h-6 rotate-[-90deg]" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-safe">
                                {/* Steps */}
                                {selectedProcedure.steps && selectedProcedure.steps.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold text-accent-blue uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4" /> Шаги действия
                                        </h3>
                                        <div className="space-y-4 pl-2 border-l-2 border-white/5">
                                            {selectedProcedure.steps.map((step, idx) => (
                                                <div key={idx} className="pl-4 relative">
                                                    <span className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-zinc-800 border-2 border-zinc-600" />
                                                    <p className="text-zinc-200 text-sm leading-relaxed">{step.text}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Scripts */}
                                {selectedProcedure.scripts && selectedProcedure.scripts.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <MessageSquare className="w-4 h-4" /> Скрипты ответов
                                        </h3>
                                        <div className="space-y-3">
                                            {selectedProcedure.scripts.map((script, idx) => (
                                                <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/5">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-xs font-bold text-zinc-400 bg-white/5 px-2 py-0.5 rounded">{script.label}</span>
                                                        <button
                                                            onClick={() => handleCopyScript(script.text)}
                                                            className="flex items-center gap-1.5 text-xs text-accent-blue font-medium hover:text-blue-300 transition-colors"
                                                        >
                                                            <Copy className="w-3 h-3" /> Копировать
                                                        </button>
                                                    </div>
                                                    <p className="text-sm text-zinc-300 italic">"{script.text}"</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Procedures;
