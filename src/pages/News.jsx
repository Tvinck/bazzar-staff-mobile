import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Tag, ChevronRight, Newspaper, Heart, MessageCircle, Send, ThumbsUp, Flame, Plus, X, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '../supabase';
import { useBackButton } from '../hooks/useBackButton';
import { useMainButton } from '../hooks/useMainButton';
import { haptic } from '../utils/telegram';
import BottomNav from '../components/BottomNav';

const CreateNewsModal = ({ isOpen, onClose, onCreate }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tag, setTag] = useState('Update');
    const [image, setImage] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title || !content) {
            toast.error('Заполните обязательные поля');
            return;
        }
        onCreate({
            title,
            content,
            badge_type: tag,
            image_url: image || null,
            published_at: new Date().toISOString()
        });
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-[#18181b] w-full max-w-md rounded-3xl p-6 border border-white/10"
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Опубликовать новость</h2>
                    <button onClick={onClose}><X className="text-zinc-400" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs text-zinc-500 mb-1 block">Заголовок</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-white/5 rounded-xl p-3 text-white border border-white/10" placeholder="Заголовок новости..." />
                    </div>
                    <div>
                        <label className="text-xs text-zinc-500 mb-1 block">Категория</label>
                        <select value={tag} onChange={e => setTag(e.target.value)} className="w-full bg-white/5 rounded-xl p-3 text-white border border-white/10">
                            <option value="Update">Обновление</option>
                            <option value="Guide">Инструкция</option>
                            <option value="Alert">Важное</option>
                            <option value="Promo">Акция</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-zinc-500 mb-1 block">URL Изображения (необязательно)</label>
                        <input type="text" value={image} onChange={e => setImage(e.target.value)} className="w-full bg-white/5 rounded-xl p-3 text-white border border-white/10" placeholder="https://..." />
                    </div>
                    <div>
                        <label className="text-xs text-zinc-500 mb-1 block">Текст новости</label>
                        <textarea value={content} onChange={e => setContent(e.target.value)} className="w-full bg-white/5 rounded-xl p-3 text-white border border-white/10 h-32" placeholder="О чем новость?" />
                    </div>
                    <button type="submit" className="w-full py-3 bg-blue-600 rounded-xl text-white font-bold mt-2">Опубликовать</button>
                </form>
            </motion.div>
        </div>
    );
};

const News = () => {
    const navigate = useNavigate();
    const [selectedNews, setSelectedNews] = useState(null);
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useBackButton();

    useEffect(() => {
        const loadData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email === 'ukoshelev.04@yandex.ru') setIsAdmin(true);

            const { data, error } = await supabase
                .from('news')
                .select('*')
                .order('published_at', { ascending: false });

            if (data) setNews(data);
            setLoading(false);
        };
        loadData();
    }, []);

    useMainButton(
        'Опубликовать новость',
        () => setIsCreateModalOpen(true),
        { isVisible: isAdmin, color: '#007aff' }
    );

    const handleCreateNews = async (newsData) => {
        try {
            const { data, error } = await supabase.from('news').insert([newsData]).select();
            if (error) throw error;
            toast.success('Новость опубликована!');
            setNews([data[0], ...news]);
            setIsCreateModalOpen(false);
            haptic.notification('success');
        } catch (e) {
            console.error(e);
            toast.error('Ошибка публикации');
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    if (loading) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-500">Загрузка новостей...</div>;

    const mainNews = news[0];

    return (
        <div className="min-h-screen bg-[#09090b] pb-24">
            {/* Header */}
            <div className="glass-panel border-b border-white/5 pt-12 pb-4 px-4 sticky top-0 z-20 backdrop-blur-xl bg-[#09090b]/80">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/services')}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-xl font-bold text-white">Новости компании</h1>
                </div>
            </div>

            <div className="p-4 space-y-6">
                {/* Hero / Featured News */}
                {mainNews && (
                    <div
                        onClick={() => setSelectedNews(mainNews)}
                        className="relative rounded-3xl overflow-hidden aspect-[4/3] group cursor-pointer border border-white/10"
                    >
                        {mainNews.image_url ? (
                            <img
                                src={mainNews.image_url}
                                alt=""
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                        ) : (
                            <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
                                <Newspaper className="w-16 h-16 text-zinc-800" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>

                        <div className="absolute bottom-0 left-0 p-6 w-full">
                            <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider mb-3 inline-block shadow-lg shadow-blue-600/30">
                                {mainNews.badge_type || 'Update'}
                            </span>
                            <h2 className="text-2xl font-bold text-white mb-2 leading-tight">
                                {mainNews.title}
                            </h2>
                            <div className="flex items-center gap-4 text-zinc-300 text-xs">
                                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {formatDate(mainNews.published_at)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* News List */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white px-1">Последние события</h3>
                    {news.slice(1).map((item) => (
                        <div
                            key={item.id}
                            onClick={() => setSelectedNews(item)}
                            className="glass-panel p-4 rounded-2xl border border-white/5 flex gap-4 cursor-pointer active:scale-[0.98] transition-all hover:bg-white/5"
                        >
                            {item.image_url ? (
                                <div className="w-20 h-20 rounded-xl overflow-hidden bg-zinc-800 shrink-0">
                                    <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className={`w-20 h-20 rounded-xl flex items-center justify-center shrink-0 ${item.badge_type === 'Alert' ? 'bg-orange-500/10 text-orange-400' : 'bg-zinc-800 text-zinc-400'
                                    }`}>
                                    <Newspaper className="w-8 h-8" />
                                </div>
                            )}

                            <div className="flex-1 flex flex-col justify-center">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${item.badge_type === 'Guide' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' :
                                        item.badge_type === 'Alert' ? 'text-orange-400 border-orange-500/20 bg-orange-500/10' :
                                            'text-zinc-400 border-zinc-500/20 bg-zinc-500/10'
                                        }`}>
                                        {item.badge_type || 'News'}
                                    </span>
                                    <span className="text-[10px] text-zinc-500">{formatDate(item.published_at)}</span>
                                </div>
                                <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug">
                                    {item.title}
                                </h3>
                            </div>
                            <div className="flex items-center text-zinc-600">
                                <ChevronRight className="w-5 h-5" />
                            </div>
                        </div>
                    ))}
                    {news.length === 0 && <p className="text-center text-zinc-500 py-10">Новостей пока нет</p>}
                </div>
            </div>

            <BottomNav />

            {/* News Detail Modal */}
            <AnimatePresence>
                {selectedNews && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                            onClick={() => setSelectedNews(null)}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="relative w-full h-[90vh] sm:h-[800px] sm:max-w-lg bg-[#18181b] rounded-t-3xl sm:rounded-3xl p-0 overflow-hidden border-t sm:border border-white/10 flex flex-col"
                        >

                            {/* Modal Header Image */}
                            <div className="relative h-64 shrink-0">
                                {selectedNews.image_url ? (
                                    <img src={selectedNews.image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                                        <Newspaper className="w-20 h-20 text-zinc-700" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#18181b] to-transparent"></div>

                                <button
                                    onClick={() => setSelectedNews(null)}
                                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/10"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="px-6 -mt-10 relative z-10 flex-1 overflow-y-auto pb-24 custom-scrollbar">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border ${selectedNews.badge_type === 'Guide' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-950' :
                                        selectedNews.badge_type === 'Alert' ? 'text-orange-400 border-orange-500/20 bg-orange-950' :
                                            'text-blue-400 border-blue-500/20 bg-blue-950'
                                        }`}>
                                        {selectedNews.badge_type || 'News'}
                                    </span>
                                    <span className="text-zinc-400 text-xs flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" /> {formatDate(selectedNews.published_at)}
                                    </span>
                                </div>

                                <h2 className="text-2xl font-bold text-white mb-4 leading-tight">
                                    {selectedNews.title}
                                </h2>

                                <div className="prose prose-invert prose-sm text-zinc-300 leading-relaxed mb-8">
                                    {selectedNews.content.split('\n').map((para, i) => (
                                        <p key={i} className="mb-4">{para}</p>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <CreateNewsModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={handleCreateNews}
            />
        </div>
    );
};

export default News;
