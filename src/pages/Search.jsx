import { useState } from 'react';
import { Search as SearchIcon, X, Clock, ArrowRight, User, Package, Hash, LayoutGrid, BookOpen, Command, Filter } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { useNavigate } from 'react-router-dom';

const Search = () => {
    const [query, setQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'orders' | 'wiki'
    const navigate = useNavigate();
    const [recentSearches] = useState(['5317909', 'Возврат', 'PUBG UC']);

    const appPages = [
        { id: 'page-dashboard', type: 'page', title: 'Дашборд', subtitle: 'Главная панель', path: '/' },
        { id: 'page-orders', type: 'page', title: 'Заказы', subtitle: 'Управление заказами', path: '/orders' },
        { id: 'page-accounting', type: 'page', title: 'Бухгалтерия', subtitle: 'Финансы и отчеты', path: '/accounting' },
        { id: 'page-tasks', type: 'page', title: 'Задачи', subtitle: 'Список дел', path: '/tasks' },
        { id: 'page-profile', type: 'page', title: 'Профиль', subtitle: 'Настройки аккаунта', path: '/profile' },
        { id: 'page-calendar', type: 'page', title: 'Календарь', subtitle: 'Расписание', path: '/calendar' },
        { id: 'page-services', type: 'page', title: 'Сервисы', subtitle: 'Все инструменты', path: '/services' },
        { id: 'page-wiki', type: 'page', title: 'База знаний', subtitle: 'Гайды и обучение', path: '/wiki' },
        { id: 'page-leaderboard', type: 'page', title: 'Топ сотрудников', subtitle: 'Рейтинг продуктивности', path: '/leaderboard' },
    ];

    const mockData = [
        { id: '53179099329', type: 'order', title: 'Заказ #53179099329', subtitle: 'Иван И. • PUBG Mobile 660 UC', tags: ['order', 'pubg'] },
        { id: 'u_123', type: 'user', title: 'Иван Иванов', subtitle: 'client@example.com', tags: ['user'] },
        { id: 'p_pubg', type: 'product', title: 'PUBG Mobile 660 UC', subtitle: 'Global • Digital Key', tags: ['product'] },
        { id: 'w_return', type: 'wiki', title: 'Что делать при возврате', subtitle: 'База знаний • Решение проблем', tags: ['wiki', 'return'] },
        { id: 'w_pubg', type: 'wiki', title: 'Гайд по PUBG Mobile UC', subtitle: 'База знаний • Товары', tags: ['wiki', 'pubg'] },
    ];

    const getResults = () => {
        if (query.length === 0) return [];
        const q = query.toLowerCase();

        // 1. Filter Pages
        const matchedPages = appPages.filter(p => (p.title.toLowerCase().includes(q) || p.subtitle.toLowerCase().includes(q)) && activeTab !== 'orders' && activeTab !== 'wiki');

        // 2. Filter Mock Data
        const matchedData = mockData.filter(item => {
            const matchesQuery = item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q);
            const matchesTab =
                activeTab === 'all' ? true :
                    activeTab === 'orders' ? item.type === 'order' :
                        activeTab === 'wiki' ? item.type === 'wiki' : true;

            return matchesQuery && matchesTab;
        });

        return [...matchedPages, ...matchedData];
    };

    const results = getResults();

    const getIcon = (type) => {
        switch (type) {
            case 'order': return Hash;
            case 'user': return User;
            case 'product': return Package;
            case 'page': return LayoutGrid;
            case 'wiki': return BookOpen;
            default: return SearchIcon;
        }
    };

    const handleResultClick = (result) => {
        if (result.type === 'page') {
            navigate(result.path);
        } else if (result.type === 'order') {
            navigate(`/orders/${result.id}`);
        } else if (result.type === 'wiki') {
            navigate('/wiki'); // ideally open specific article
        }
    };

    return (
        <div className="min-h-screen pb-20">
            {/* Search Header */}
            <div className="glass-panel border-b border-white/5 p-4 sticky top-0 z-10 safe-area-inset-top pt-12 backdrop-blur-xl bg-[#09090b]/80">
                <div className="relative mb-3">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Поиск (Cmd+K)..."
                        className="w-full bg-white/5 text-white pl-12 pr-10 py-3.5 rounded-2xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-zinc-600"
                        autoFocus
                    />
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-zinc-500 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Filter Tabs */}
                {query.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                        {['all', 'orders', 'wiki'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                                    }`}
                            >
                                {tab === 'all' ? 'Всё' : tab === 'orders' ? 'Заказы' : 'База знаний'}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-4">
                {/* Results */}
                {query.length > 0 ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                            <h3 className="text-sm font-medium text-zinc-500">Результаты поиска</h3>
                            <span className="text-xs text-zinc-600 flex items-center gap-1"><Command className="w-3 h-3" /> Enter</span>
                        </div>
                        <div className="space-y-2">
                            {results.length > 0 ? results.map((result) => {
                                const Icon = getIcon(result.type);
                                return (
                                    <button
                                        key={result.id}
                                        onClick={() => handleResultClick(result)}
                                        className="w-full fintech-card p-4 rounded-2xl flex items-center gap-4 hover:border-white/20 active:scale-[0.99] transition-all text-left group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors text-zinc-400">
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-white truncate">{result.title}</p>
                                            <p className="text-sm text-zinc-500 truncate">{result.subtitle}</p>
                                        </div>
                                        {result.type === 'page' && <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">Jump to</span>}
                                        <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-white transition-colors" />
                                    </button>
                                );
                            }) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <SearchIcon className="w-8 h-8 text-zinc-600" />
                                    </div>
                                    <p className="text-zinc-500 font-medium">Ничего не найдено</p>
                                    <p className="text-sm text-zinc-600 mt-1">Попробуйте изменить запрос</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Recent Searches & Suggestions */
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-medium text-zinc-500 mb-3 px-1">Недавние</h3>
                            <div className="flex flex-wrap gap-2">
                                {recentSearches.map((search, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setQuery(search)}
                                        className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-zinc-300 active:bg-white/10 transition-colors hover:border-white/10"
                                    >
                                        <Clock className="w-4 h-4 text-zinc-500" />
                                        <span className="text-sm">{search}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-zinc-500 mb-3 px-1">Категории</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => { setQuery('Заказ'); setActiveTab('orders') }} className="p-4 bg-blue-500/10 border border-blue-500/10 hover:border-blue-500/30 rounded-2xl text-left active:scale-[0.98] transition-all">
                                    <Hash className="w-6 h-6 text-blue-400 mb-2" />
                                    <p className="font-medium text-blue-400 mb-1">Заказы</p>
                                    <p className="text-xs text-blue-300/60">По номеру ID</p>
                                </button>
                                <button onClick={() => { setQuery('Гайд'); setActiveTab('wiki') }} className="p-4 bg-cyan-500/10 border border-cyan-500/10 hover:border-cyan-500/30 rounded-2xl text-left active:scale-[0.98] transition-all">
                                    <BookOpen className="w-6 h-6 text-cyan-400 mb-2" />
                                    <p className="font-medium text-cyan-400 mb-1">База знаний</p>
                                    <p className="text-xs text-cyan-300/60">Поиск статей</p>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
};

export default Search;
