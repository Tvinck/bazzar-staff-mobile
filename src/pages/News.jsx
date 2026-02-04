import { ArrowLeft, Calendar, Tag, ChevronRight, Newspaper, Heart, MessageCircle, Send, ThumbsUp, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import BottomNav from '../components/BottomNav';

const News = () => {
    const navigate = useNavigate();
    const [selectedNews, setSelectedNews] = useState(null);

    // Mock Data with Reactions/Comments
    const [news, setNews] = useState([
        {
            id: 1,
            title: 'Масштабное обновление BAZZAR 2.0',
            date: '19 Янв 2026',
            tag: 'Update',
            color: 'blue',
            image: 'https://images.unsplash.com/photo-1639322537228-ad7117a7a6bb?auto=format&fit=crop&q=80&w=1000',
            content: 'Мы рады представить нашу новую систему управления задачами. Теперь каждый сотрудник может брать задачи с биржи и получать моментальные выплаты...',
            reactions: { like: 145, heart: 89, fire: 230 },
            comments: [
                { id: 1, author: 'Артём Г.', text: 'Наконец-то! Ждали полгода 🔥', time: '10:00' },
                { id: 2, author: 'Иван М.', text: 'Крутой дизайн, спасибо команде', time: '10:15' }
            ]
        },
        {
            id: 2,
            title: 'Новые правила обработки возвратов',
            date: '18 Янв 2026',
            tag: 'Guide',
            color: 'emerald',
            image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=1000',
            content: 'С 20 января вступают в силу новые правила по возвратам средств. Ознакомьтесь с обновленной инструкцией в базе знаний...',
            reactions: { like: 45, heart: 12, fire: 5 },
            comments: []
        },
        {
            id: 3,
            title: 'Технические работы на сервере',
            date: '15 Янв 2026',
            tag: 'Alert',
            color: 'orange',
            content: 'В ночь с пятницы на субботу будут проводиться плановые работы. Возможны перебои в работе Telegram бота...',
            reactions: { like: 20, heart: 2, fire: 1 },
            comments: []
        }
    ]);

    const [newComment, setNewComment] = useState('');

    const handleReaction = (newsId, type) => {
        setNews(news.map(n => {
            if (n.id === newsId) {
                return {
                    ...n,
                    reactions: { ...n.reactions, [type]: n.reactions[type] + 1 }
                };
            }
            return n;
        }));
    };

    const handleAddComment = (newsId) => {
        if (!newComment.trim()) return;
        setNews(news.map(n => {
            if (n.id === newsId) {
                return {
                    ...n,
                    comments: [...n.comments, {
                        id: Date.now(),
                        author: 'Вы', // Mock Logged in User
                        text: newComment,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }]
                };
            }
            return n;
        }));
        setNewComment('');
    };

    const currentNewsItem = selectedNews ? news.find(n => n.id === selectedNews.id) : null;

    return (
        <div className="min-h-screen bg-[#09090b] pb-24">
            {/* Header */}
            <div className="glass-panel border-b border-white/5 pt-12 pb-4 px-4 sticky top-0 z-20 backdrop-blur-xl bg-[#09090b]/80">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-xl font-bold text-white">Новости компании</h1>
                </div>
            </div>

            <div className="p-4 space-y-6">
                {/* Hero / Featured News */}
                <div
                    onClick={() => setSelectedNews(news[0])}
                    className="relative rounded-3xl overflow-hidden aspect-[4/3] group cursor-pointer border border-white/10"
                >
                    <img
                        src={news[0].image}
                        alt="Hero News"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>

                    <div className="absolute bottom-0 left-0 p-6 w-full">
                        <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider mb-3 inline-block shadow-lg shadow-blue-600/30">
                            {news[0].tag}
                        </span>
                        <h2 className="text-2xl font-bold text-white mb-2 leading-tight">
                            {news[0].title}
                        </h2>
                        <div className="flex items-center gap-4 text-zinc-300 text-xs">
                            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {news[0].date}</span>
                            <span className="flex items-center gap-1.5 text-blue-400 font-bold"><Flame className="w-3.5 h-3.5" /> {news[0].reactions.fire}</span>
                        </div>
                    </div>
                </div>

                {/* News List */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white px-1">Последние события</h3>
                    {news.slice(1).map((item) => (
                        <div
                            key={item.id}
                            onClick={() => setSelectedNews(item)}
                            className="glass-panel p-4 rounded-2xl border border-white/5 flex gap-4 cursor-pointer active:scale-[0.98] transition-all hover:bg-white/5"
                        >
                            {item.image ? (
                                <div className="w-20 h-20 rounded-xl overflow-hidden bg-zinc-800 shrink-0">
                                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className={`w-20 h-20 rounded-xl flex items-center justify-center shrink-0 ${item.color === 'orange' ? 'bg-orange-500/10 text-orange-400' : 'bg-zinc-800 text-zinc-400'
                                    }`}>
                                    <Newspaper className="w-8 h-8" />
                                </div>
                            )}

                            <div className="flex-1 flex flex-col justify-center">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${item.tag === 'Guide' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' :
                                            item.tag === 'Alert' ? 'text-orange-400 border-orange-500/20 bg-orange-500/10' :
                                                'text-zinc-400 border-zinc-500/20 bg-zinc-500/10'
                                        }`}>
                                        {item.tag}
                                    </span>
                                    <span className="text-[10px] text-zinc-500">{item.date}</span>
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
                </div>
            </div>

            <BottomNav />

            {/* News Detail Modal */}
            {currentNewsItem && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setSelectedNews(null)}></div>
                    <div className="relative w-full h-[90vh] sm:h-[800px] sm:max-w-lg bg-[#18181b] rounded-t-3xl sm:rounded-3xl p-0 overflow-y-auto animate-slide-up border-t sm:border border-white/10 flex flex-col">

                        {/* Modal Header Image */}
                        <div className="relative h-64 shrink-0">
                            {currentNewsItem.image ? (
                                <img src={currentNewsItem.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                                    <Newspaper className="w-20 h-20 text-zinc-700" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#18181b] to-transparent"></div>

                            <button
                                onClick={() => setSelectedNews(null)}
                                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/10"
                            >
                                <ChevronRight className="w-5 h-5 rotate-90" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="px-6 -mt-10 relative z-10 flex-1 overflow-y-auto pb-24">
                            <div className="flex items-center gap-3 mb-4">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border ${currentNewsItem.tag === 'Guide' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-950' :
                                        currentNewsItem.tag === 'Alert' ? 'text-orange-400 border-orange-500/20 bg-orange-950' :
                                            'text-blue-400 border-blue-500/20 bg-blue-950'
                                    }`}>
                                    {currentNewsItem.tag}
                                </span>
                                <span className="text-zinc-400 text-xs flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" /> {currentNewsItem.date}
                                </span>
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-4 leading-tight">
                                {currentNewsItem.title}
                            </h2>

                            <div className="prose prose-invert prose-sm text-zinc-300 leading-relaxed mb-8">
                                <p>{currentNewsItem.content}</p>
                                <p>Подробности обновления также доступны в технической документации. Мы учли все отзывы сотрудников при разработке новой версии.</p>
                            </div>

                            {/* Reactions */}
                            <div className="mb-8">
                                <p className="text-xs text-zinc-500 font-bold uppercase mb-3">Реакции</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleReaction(currentNewsItem.id, 'like')}
                                        className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 hover:bg-white/10 active:scale-95 transition-all"
                                    >
                                        <ThumbsUp className="w-4 h-4 text-blue-400" />
                                        <span className="text-sm font-bold text-white">{currentNewsItem.reactions.like}</span>
                                    </button>
                                    <button
                                        onClick={() => handleReaction(currentNewsItem.id, 'fire')}
                                        className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 hover:bg-white/10 active:scale-95 transition-all"
                                    >
                                        <Flame className="w-4 h-4 text-orange-400" />
                                        <span className="text-sm font-bold text-white">{currentNewsItem.reactions.fire}</span>
                                    </button>
                                    <button
                                        onClick={() => handleReaction(currentNewsItem.id, 'heart')}
                                        className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 hover:bg-white/10 active:scale-95 transition-all"
                                    >
                                        <Heart className="w-4 h-4 text-pink-400" />
                                        <span className="text-sm font-bold text-white">{currentNewsItem.reactions.heart}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Comments */}
                            <div className="mb-6">
                                <p className="text-xs text-zinc-500 font-bold uppercase mb-3 flex items-center gap-2">
                                    Комментарии <span className="bg-white/10 px-1.5 rounded text-white">{currentNewsItem.comments.length}</span>
                                </p>

                                {currentNewsItem.comments.length === 0 ? (
                                    <div className="text-center py-8 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                                        <p className="text-zinc-500 text-sm">Будьте первым, кто оставит комментарий</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {currentNewsItem.comments.map(comment => (
                                            <div key={comment.id} className="flex gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center shrink-0 border border-white/10 font-bold text-xs text-zinc-300">
                                                    {comment.author[0]}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-baseline justify-between mb-1">
                                                        <span className="text-sm font-bold text-white">{comment.author}</span>
                                                        <span className="text-[10px] text-zinc-600">{comment.time}</span>
                                                    </div>
                                                    <div className="text-sm text-zinc-300 bg-white/5 rounded-xl rounded-tl-none p-3 border border-white/5">
                                                        {comment.text}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Comment Input */}
                        <div className="absolute bottom-0 left-0 w-full p-4 bg-[#18181b] border-t border-white/10 backdrop-blur-xl z-20">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Написать комментарий..."
                                    className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors placeholder-zinc-600"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment(currentNewsItem.id)}
                                />
                                <button
                                    onClick={() => handleAddComment(currentNewsItem.id)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 rounded-lg text-white hover:bg-blue-500 active:scale-95 transition-all"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default News;
