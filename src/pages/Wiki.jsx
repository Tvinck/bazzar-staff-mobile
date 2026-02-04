import { ArrowLeft, Search, BookOpen, GraduationCap, ChevronRight, FileText, CheckCircle, Lock, PlayCircle, AlertCircle, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase';
import { cache } from '../utils/cache';

const Wiki = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('kb'); // 'kb' | 'tests'
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [activeTest, setActiveTest] = useState(null);
    const [articles, setArticles] = useState([]);
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            // 1. Fetch Articles with Cache Strategy (TTL: 24h)
            const articlesResult = await cache.fetchWithCache('wiki_articles', async () => {
                const { data } = await supabase
                    .from('wiki_articles')
                    .select('*')
                    .eq('is_published', true);
                return data;
            }, 60 * 24);

            if (articlesResult && articlesResult.length > 0) {
                setArticles(articlesResult);
            } else {
                // Fallback Mock (Only if cache AND network fail)
                setArticles([
                    { id: 1, title: 'Правила общения с клиентом', category: 'basics', read_time: '5 мин', content: '...' },
                    { id: 2, title: 'Как оформить первый заказ', category: 'basics', read_time: '3 мин', content: '...' },
                    { id: 3, title: 'Что делать при возврате', category: 'troubleshoot', read_time: '7 мин', content: '...' },
                    { id: 5, title: 'Гайд по PUBG Mobile UC', category: 'products', read_time: '10 мин', content: '...' }
                ]);
            }

            // 2. Fetch Tests (Cache: 1h)
            const testsResult = await cache.fetchWithCache('wiki_tests', async () => {
                const { data } = await supabase.from('wiki_tests').select('*');
                return data;
            }, 60);

            if (testsResult && testsResult.length > 0) {
                // 3. Fetch User Results
                let userResults = [];
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data } = await supabase.from('user_test_results').select('test_id, passed').eq('user_id', user.id);
                    if (data) userResults = data;
                }

                setTests(testsResult.map(t => {
                    const passed = userResults.some(r => r.test_id === t.id && r.passed);
                    return {
                        id: t.id,
                        title: t.title,
                        description: t.description,
                        questionsCount: t.questions?.length || 0,
                        time: '10 мин',
                        status: passed ? 'passed' : (t.is_active ? 'available' : 'locked'),
                        questions: t.questions
                    };
                }));
            } else {
                // Fallback Mock Tests
                setTests([
                    { id: 1, title: 'Экзамен новичка', description: 'Базовый тест.', questionsCount: 10, time: '15 мин', status: 'available', questions: [] },
                    { id: 2, title: 'Квалификация: Возвраты', description: 'Продвинутый тест.', questionsCount: 5, time: '10 мин', status: 'locked', questions: [] }
                ]);
            }

            setLoading(false);
        };
        fetchData();
    }, []);

    // Categorize Articles
    const getCategories = () => {
        const cats = {
            'basics': { title: 'Основы работы', icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            'troubleshoot': { title: 'Решение проблем', icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-500/10' },
            'products': { title: 'Товары', icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
        };

        const grouped = {};
        const filtered = articles.filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()));

        filtered.forEach(a => {
            if (!grouped[a.category]) grouped[a.category] = [];
            grouped[a.category].push(a);
        });

        return Object.keys(grouped).map(key => ({
            id: key,
            ...cats[key] || { title: 'Другое', icon: FileText, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
            articles: grouped[key]
        }));
    };

    const categories = getCategories();

    // ... TestModal and ArticleModal components (keep existing logic) ...
    const TestModal = ({ test, onClose }) => {
        // Simple Mock Test Runner
        const [currentQ, setCurrentQ] = useState(0);
        const [score, setScore] = useState(0);
        const [finished, setFinished] = useState(false);
        const questions = test.questions && test.questions.length > 0 ? test.questions : [
            { text: 'Mock Q1', options: ['A', 'B'], correct: 0 },
            { text: 'Mock Q2', options: ['A', 'B'], correct: 1 }
        ];

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
                <div className="bg-[#18181b] w-full max-w-md p-6 rounded-3xl border border-white/10 text-center">
                    {!finished ? (
                        <>
                            <h3 className="text-xl font-bold text-white mb-4">Вопрос {currentQ + 1}</h3>
                            <p className="text-zinc-300 mb-6">{questions[currentQ]?.text}</p>
                            <div className="space-y-2">
                                {questions[currentQ]?.options?.map((opt, i) => (
                                    <button key={i} onClick={async () => {
                                        const newScore = i === questions[currentQ].correct ? score + 1 : score;
                                        setScore(newScore);

                                        if (currentQ < questions.length - 1) {
                                            setCurrentQ(currentQ + 1);
                                        } else {
                                            setFinished(true);
                                            // SAVE RESULT
                                            try {
                                                const { data: { user } } = await supabase.auth.getUser();
                                                if (user) {
                                                    const passed = (newScore / questions.length) >= 0.7; // 70% pass
                                                    await supabase.from('user_test_results').insert({
                                                        user_id: user.id,
                                                        test_id: test.id,
                                                        score: newScore,
                                                        passed: passed
                                                    });
                                                }
                                            } catch (e) {
                                                console.error('Save result error', e);
                                            }
                                        }
                                    }} className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl text-left border border-white/5">{opt}</button>
                                ))}
                            </div>
                            <button onClick={onClose} className="mt-4 text-zinc-500">Отмена</button>
                        </>
                    ) : (
                        <>
                            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-white">Тест завершен</h2>
                            <p className="text-zinc-400 mb-6">Результат: {score}/{questions.length} ({(score / questions.length) * 100}%)</p>
                            <button onClick={() => { onClose(); window.location.reload(); }} className="w-full py-3 bg-white text-black font-bold rounded-xl">Закрыть</button>
                        </>
                    )}
                </div>
            </div>
        );
    };

    const ArticleModal = ({ article, onClose }) => (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-[#18181b] w-full max-w-lg h-[80vh] rounded-3xl p-6 overflow-y-auto border border-white/10" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-white mb-4">{article.title}</h2>
                <div className="text-zinc-300 whitespace-pre-wrap">
                    {article.content || 'Content loading...'}
                </div>
                <button onClick={onClose} className="mt-8 w-full py-4 bg-zinc-800 rounded-xl text-white font-bold sticky bottom-0">Закрыть</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#09090b] pb-24">
            {/* Header */}
            <div className="glass-panel border-b border-white/5 pt-12 pb-4 px-4 sticky top-0 z-20 backdrop-blur-xl bg-[#09090b]/80">
                <div className="flex items-center gap-3 mb-4">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-xl font-bold text-white">База знаний</h1>
                </div>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Поиск по статьям..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
            </div>

            <div className="px-4 mt-4">
                <div className="glass-panel p-1 rounded-xl flex text-sm font-medium">
                    <button onClick={() => setActiveTab('kb')} className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'kb' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500'}`}>
                        <BookOpen className="w-4 h-4" /> Статьи
                    </button>
                    <button onClick={() => setActiveTab('tests')} className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'tests' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500'}`}>
                        <GraduationCap className="w-4 h-4" /> Обучение
                    </button>
                </div>
            </div>

            <div className="p-4 space-y-6">
                {loading ? <div className="text-center text-zinc-500 py-10">Загрузка...</div> : activeTab === 'kb' ? (
                    <div className="space-y-6">
                        {categories.length > 0 ? categories.map(cat => (
                            <div key={cat.id}>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cat.bg} ${cat.color}`}>
                                        <cat.icon className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-white font-bold">{cat.title}</h3>
                                </div>
                                <div className="space-y-2">
                                    {cat.articles.map(article => (
                                        <div key={article.id} onClick={() => setSelectedArticle(article)} className="glass-panel p-4 rounded-xl border border-white/5 active:scale-[0.99] transition-transform cursor-pointer hover:bg-white/5 group">
                                            <div className="flex items-center justify-between">
                                                <span className="text-zinc-300 font-medium group-hover:text-white transition-colors">{article.title}</span>
                                                <div className="flex items-center gap-2 text-zinc-500">
                                                    <span className="text-xs">{article.read_time}</span>
                                                    <ChevronRight className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )) : <div className="text-center text-zinc-500">Ничего не найдено</div>}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tests.map(test => (
                            <div key={test.id} className={`glass-panel p-5 rounded-2xl border ${test.status === 'locked' ? 'border-zinc-800 opacity-60' : 'border-white/5'}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className={`p-2 rounded-xl ${test.status === 'locked' ? 'bg-zinc-800' : 'bg-blue-500/10'}`}>
                                        {test.status === 'locked' ? <Lock className="w-6 h-6 text-zinc-500" /> : <PlayCircle className="w-6 h-6 text-blue-500" />}
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${test.status === 'passed' ? 'bg-emerald-500/10 text-emerald-400' : test.status === 'locked' ? 'bg-zinc-800 text-zinc-500' : 'bg-blue-500/10 text-blue-400'}`}>
                                        {test.status === 'locked' ? 'Закрыт' : 'Доступен'}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-1">{test.title}</h3>
                                <p className="text-sm text-zinc-500 mb-4 leading-relaxed">{test.description}</p>
                                <button
                                    onClick={() => test.status !== 'locked' && setActiveTest(test)}
                                    disabled={test.status === 'locked'}
                                    className={`w-full py-3 rounded-xl font-bold transition-all ${test.status === 'locked' ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-white text-black hover:bg-zinc-200 active:scale-95'
                                        }`}
                                >
                                    {test.status === 'locked' ? 'Недоступен' : 'Начать тест'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {activeTest && <TestModal test={activeTest} onClose={() => setActiveTest(null)} />}
            {selectedArticle && <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />}
        </div>
    );
};

// Helper Icon
const ClockIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);

export default Wiki;
