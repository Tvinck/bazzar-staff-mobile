
import { ArrowLeft, Search, BookOpen, GraduationCap, ChevronRight, FileText, CheckCircle, Lock, PlayCircle, AlertCircle, Trophy, Zap, Shield, HelpCircle, Activity } from 'lucide-react';
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

    // Hardcoded "Real" Content reflecting recent updates
    const staticArticles = [
        {
            id: 'onboarding-1',
            title: 'Добро пожаловать в BAZZAR Staff',
            category: 'onboarding',
            read_time: '2 мин',
            content: `# Добро пожаловать! 🚀

Ты стал частью команды BAZZAR. Мы — экосистема для геймеров, объединяющая маркетплейс, новости и сервисы.

## Твои первые шаги:
1. **Настрой профиль**: Установи PIN-код для быстрого входа в разделе Профиль.
2. **Изучи сервисы**: В разделе "Сервисы" найдешь Биржу задач и Мониторинг.
3. **Подпишись на уведомления**: Чтобы не пропускать важные заказы и сообщения.

Если возникнут вопросы — пиши в командный чат или старшему менеджеру.`
        },
        {
            id: 'workflow-1',
            title: 'Smart CRM: Квалификация',
            category: 'workflows',
            read_time: '3 мин',
            content: `# Smart CRM 🧠

Мы внедрили систему умных тегов. Теперь ты видишь, на какой консоли играет клиент и из какого он региона.

## Как это работает:
1. В чате нажми на иконку **Книги** (Процедуры).
2. Выбери скрипт "Квалификация Клиента".
3. Следуй скрипту: узнай консоль (PS4/PS5) и регион.
4. Выбирай ответы клиента — система сама обновит профиль и закрепит теги (например, **CONSOLE: PS5**) в шапке чата.

**Важно**: Чем больше мы знаем о клиенте, тем лучше мы можем ему помочь.`
        },
        {
            id: 'workflow-2',
            title: 'Обработка Заказов',
            category: 'workflows',
            read_time: '5 мин',
            content: `# Заказы и Возвраты 📦

## Оформление заказа:
- Все заказы из Avito и Yandex попадают в раздел "Заказы".
- Обязательно сверяй сумму и состав заказа перед выдачей.
- Используй статус заказа для отслеживания прогресса.

## Возвраты:
- Если код не работает: запроси скриншот ошибки и перешли его поставщику.
- Если клиент ошибся регионом: предложи замену или возврат на баланс.
- **Никогда** не груби клиенту. Мы решаем проблемы.`
        },
        {
            id: 'rules-1',
            title: 'Регламент Безопасности',
            category: 'rules',
            read_time: '3 мин',
            content: `# Безопасность 🛡️

1. **PIN-код**: Не сообщай никому свой PIN-код.
2. **Личные данные**: Не передавай данные клиентов (телефон, email) третьим лицам.
3. **Фишинг**: Не переходи по подозрительным ссылкам в чатах.
4. **Доступы**: Используй только рабочие аккаунты для общения.

При любой подозрительной активности сообщай в службу безопасности (Mighty).`
        },
        {
            id: 'faq-1',
            title: 'Как сбросить PIN-код?',
            category: 'faq',
            read_time: '1 мин',
            content: `На экране ввода PIN нажмите "Забыли код?". Это выполнит выход из аккаунта. При следующем входе вы сможете задать новый код.`
        },
        {
            id: 'faq-2',
            title: 'Не приходят уведомления в Telegram',
            category: 'faq',
            read_time: '1 мин',
            content: `1. Убедитесь, что вы запустили бота Bazzar Staff Bot.\n2. Проверьте, что ваш Telegram ID привязан к профилю.\n3. Если проблема сохраняется, обратитесь к администратору.`
        }
    ];

    const [articles, setArticles] = useState(staticArticles);

    // Mock Tests
    const [tests, setTests] = useState([
        { id: 1, title: 'Экзамен: Основы', description: 'Проверка знаний регламента и CRM.', questionsCount: 10, time: '15 мин', status: 'available', questions: [] },
        { id: 2, title: 'Квалификация: Конфликты', description: 'Как решать сложные ситуации.', questionsCount: 5, time: '10 мин', status: 'locked', questions: [] }
    ]);

    // Categories Configuration
    const categoriesConfig = {
        'onboarding': { title: 'Начало работы', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
        'workflows': { title: 'Рабочие процессы', icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        'rules': { title: 'Регламент', icon: Shield, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        'faq': { title: 'FAQ', icon: HelpCircle, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    };

    const getCategories = () => {
        const grouped = {};
        const filtered = articles.filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()));

        filtered.forEach(a => {
            if (!grouped[a.category]) grouped[a.category] = [];
            grouped[a.category].push(a);
        });

        return Object.keys(categoriesConfig).map(key => ({
            id: key,
            ...categoriesConfig[key],
            articles: grouped[key] || []
        })).filter(g => g.articles.length > 0); // Hide empty categories
    };

    const categories = getCategories();

    // Components
    const ArticleModal = ({ article, onClose }) => (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    className="bg-[#18181b] w-full max-w-lg h-[85vh] rounded-3xl overflow-hidden flex flex-col border border-white/10 shadow-2xl relative"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Modal Header */}
                    <div className="p-6 pb-4 border-b border-white/5 flex justify-between items-start bg-[#18181b]">
                        <div>
                            <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 px-2 py-0.5 rounded inline-block ${categoriesConfig[article.category]?.bg} ${categoriesConfig[article.category]?.color}`}>
                                {categoriesConfig[article.category]?.title || article.category}
                            </div>
                            <h2 className="text-xl font-bold text-white leading-tight">{article.title}</h2>
                        </div>
                        <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-zinc-400 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                        {article.content.split('\n').map((line, i) => {
                            if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold text-white mt-4 mb-2 first:mt-0">{line.replace('# ', '')}</h1>;
                            if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold text-zinc-100 mt-6 mb-3 pb-2 border-b border-white/5">{line.replace('## ', '')}</h2>;
                            if (line.trim().startsWith('- ')) return (
                                <div key={i} className="flex gap-2 ml-1 text-zinc-300">
                                    <span className="text-blue-500 mt-1.5">•</span>
                                    <p className="flex-1 leading-relaxed">{line.replace('- ', '')}</p>
                                </div>
                            );
                            if (/^\d+\./.test(line.trim())) return (
                                <div key={i} className="flex gap-3 ml-1 text-zinc-300">
                                    <span className="text-blue-500 font-bold min-w-[1.5rem]">{line.match(/^\d+\./)[0]}</span>
                                    <p className="flex-1 leading-relaxed">{line.replace(/^\d+\.\s/, '')}</p>
                                </div>
                            );
                            if (line.trim() === '') return <div key={i} className="h-2"></div>;
                            return <p key={i} className="text-zinc-300 leading-relaxed text-sm">{line}</p>;
                        })}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-white/5 bg-[#18181b]">
                        <button onClick={onClose} className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors">
                            Понятно
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );

    const TestModal = ({ test, onClose }) => (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-[#18181b] w-full max-w-md p-6 rounded-3xl border border-white/10 text-center" onClick={e => e.stopPropagation()}>
                <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">{test.title}</h3>
                <p className="text-zinc-400 mb-6">{test.description}</p>
                <div className="bg-white/5 p-4 rounded-xl mb-6">
                    <p className="text-sm text-zinc-300">Тесты пока в разработке. Скоро здесь появятся вопросы.</p>
                </div>
                <button onClick={onClose} className="w-full py-3 bg-white text-black font-bold rounded-xl">Закрыть</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#09090b] pb-24 font-sans text-white">
            {/* Header */}
            <div className="pt-safe pb-4 px-6 border-b border-white/5 sticky top-0 z-20 backdrop-blur-xl bg-[#09090b]/80">
                <div className="flex items-center gap-3 mb-4 mt-2">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-white leading-none">База знаний</h1>
                        <p className="text-[11px] text-zinc-500 mt-1">Обучение и регламенты</p>
                    </div>
                </div>

                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Поиск по статьям..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="px-4 mt-4 mb-6">
                <div className="bg-white/5 p-1 rounded-xl flex text-sm font-medium border border-white/5">
                    <button onClick={() => setActiveTab('kb')} className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'kb' ? 'bg-zinc-800 text-white shadow-lg shadow-black/20' : 'text-zinc-500 hover:text-zinc-300'}`}>
                        <BookOpen className="w-4 h-4" /> Статьи
                    </button>
                    <button onClick={() => setActiveTab('tests')} className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'tests' ? 'bg-zinc-800 text-white shadow-lg shadow-black/20' : 'text-zinc-500 hover:text-zinc-300'}`}>
                        <GraduationCap className="w-4 h-4" /> Обучение
                    </button>
                </div>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'kb' ? (
                    <motion.div
                        key="kb"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="px-4 space-y-6"
                    >
                        {categories.map(cat => (
                            <div key={cat.id}>
                                <div className="flex items-center gap-2 mb-3 px-1">
                                    <div className={`p-1.5 rounded-lg ${cat.bg} ${cat.color}`}>
                                        <cat.icon className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">{cat.title}</h3>
                                </div>
                                <div className="space-y-2">
                                    {cat.articles.map((article, idx) => (
                                        <motion.div
                                            key={article.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            onClick={() => setSelectedArticle(article)}
                                            className="glass-card p-4 rounded-xl border border-white/5 active:scale-[0.98] transition-all cursor-pointer hover:bg-white/5 hover:border-white/10 group relative overflow-hidden"
                                        >
                                            <div className="flex items-center justify-between relative z-10">
                                                <div>
                                                    <h4 className="text-white font-medium mb-1 group-hover:text-blue-400 transition-colors">{article.title}</h4>
                                                    <p className="text-xs text-zinc-500 flex items-center gap-1">
                                                        <Activity className="w-3 h-3" /> {article.read_time} чтения
                                                    </p>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
                                                    <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-blue-400" />
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {categories.length === 0 && (
                            <div className="text-center py-20">
                                <Search className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                                <p className="text-zinc-500">Ничего не найдено</p>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="tests"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="px-4 space-y-4"
                    >
                        {tests.map((test, idx) => (
                            <motion.div
                                key={test.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`glass-card p-5 rounded-2xl border ${test.status === 'locked' ? 'border-zinc-800 opacity-60' : 'border-white/5'}`}
                            >
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
                                <div className="flex items-center gap-4 text-xs text-zinc-500 mb-4">
                                    <span className="flex items-center gap-1"><HelpCircle className="w-3 h-3" /> {test.questionsCount} вопросов</span>
                                    <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {test.time}</span>
                                </div>
                                <button
                                    onClick={() => test.status !== 'locked' && setActiveTest(test)}
                                    disabled={test.status === 'locked'}
                                    className={`w-full py-3 rounded-xl font-bold transition-all ${test.status === 'locked' ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-white text-black hover:bg-zinc-200 active:scale-95'
                                        }`}
                                >
                                    {test.status === 'locked' ? 'Недоступен' : 'Начать тест'}
                                </button>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {selectedArticle && <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />}
            {activeTest && <TestModal test={activeTest} onClose={() => setActiveTest(null)} />}
        </div>
    );
};

export default Wiki;
