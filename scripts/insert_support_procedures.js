import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const procedures = [
    {
        title: '💸 Возврат: Протокол',
        description: 'Чеклист для оформления возвратов (Брак, Ошибка, Нет в наличии).',
        category: 'Support',
        tags: ['refund', 'support', 'wizard'],
        content: {
            initial_node_id: 'start',
            nodes: {
                'start': {
                    id: 'start',
                    title: 'Причина возврата',
                    text: 'Выберите причину обращения клиента.',
                    scripts: [],
                    options: [
                        { label: 'Ошибка клиента (передумал/не то купил)', next_node_id: 'client_error' },
                        { label: 'Брак / Не работает', next_node_id: 'defect' },
                        { label: 'Нет в наличии', next_node_id: 'out_of_stock' }
                    ]
                },
                'client_error': {
                    id: 'client_error',
                    title: 'Ошибка клиента',
                    text: 'Отказ в возврате (цифровые товары).',
                    scripts: [
                        { label: 'Отказ (Политика)', text: 'К сожалению, цифровые товары надлежащего качества возврату не подлежат, так как коды уникальны и мы не можем их перепродать. Можем предложить скидку на следующую покупку.', action: 'text' }
                    ],
                    options: [
                        { label: 'В начало', next_node_id: 'start' }
                    ]
                },
                'defect': {
                    id: 'defect',
                    title: 'Брак / Проблема',
                    text: 'Запросите доказательства.',
                    scripts: [
                        { label: 'Запрос доказательств', text: 'Пожалуйста, пришлите видео с момента покупки (или ввода данных), где видно ошибку. Это нужно для замены у поставщика.', action: 'text' }
                    ],
                    options: [
                        { label: 'Доказательства получены -> Возврат', next_node_id: 'process_refund' },
                        { label: 'Нет доказательств -> Отказ', next_node_id: 'client_error' },
                        { label: 'Назад', next_node_id: 'start' }
                    ]
                },
                'process_refund': {
                    id: 'process_refund',
                    title: 'Оформление возврата',
                    text: 'Выполните возврат средств.',
                    scripts: [
                        // Future: action 'create_refund_transaction'
                        { label: 'Оформить возврат (Ручной)', text: 'Ваша заявка на возврат принята. Средства вернутся в течение 24 часов.', action: 'text' }
                    ],
                    options: [
                        { label: 'Завершить', next_node_id: 'start' }
                    ]
                },
                'out_of_stock': {
                    id: 'out_of_stock',
                    title: 'Нет в наличии',
                    text: 'Извинения и варианты.',
                    scripts: [
                        { label: 'Извинение + Предложение', text: 'К сожалению, этот товар закончился прямо перед вашим заказом. Мы можем вернуть деньги или выдать аналогичный товар с бонусом.', action: 'text' }
                    ],
                    options: [
                        { label: 'Клиент выбрал Возврат', next_node_id: 'process_refund' },
                        { label: 'Клиент ждет (Лист ожидания)', next_node_id: 'start' } // Or link to Waitlist
                    ]
                }
            }
        }
    },
    {
        title: '📦 Лист ожидания',
        description: 'Если товара нет в наличии.',
        category: 'Sales',
        tags: ['waitlist', 'sales', 'wizard'],
        content: {
            initial_node_id: 'start',
            nodes: {
                'start': {
                    id: 'start',
                    title: 'Товара нет',
                    text: 'Товара нет в наличии. Предложите записаться.',
                    scripts: [
                        { label: 'Предложение записаться', text: 'Товара пока нет, но мы ожидаем поставку. Я могу записать вас и написать лично, как только он появится.', action: 'text' }
                    ],
                    options: [
                        { label: 'Клиент согласен', next_node_id: 'record' },
                        { label: 'Отказ', next_node_id: 'end' }
                    ]
                },
                'record': {
                    id: 'record',
                    title: 'Запись в лист',
                    text: 'Добавьте тег клиенту.',
                    scripts: [
                        { label: '⚡️ Добавить тег "Ждет Steam"', action: 'add_tag', payload: { tag: 'Waitlist_Steam' } },
                        { label: 'Подтверждение', text: 'Отлично, я записал. Напишу вам сразу при поступлении! 🤝', action: 'text' }
                    ],
                    options: [
                        { label: 'В начало', next_node_id: 'start' }
                    ]
                },
                'end': {
                    id: 'end',
                    title: 'Завершение',
                    text: 'Клиент отказался.',
                    scripts: [
                        { label: 'Хорошего дня', text: 'Понял, извините за неудобства. Хорошего дня!', action: 'text' }
                    ],
                    options: [
                        { label: 'В начало', next_node_id: 'start' }
                    ]
                }
            }
        }
    },
    {
        title: '🛠 Техподдержка (Troubleshooting)',
        description: 'Решение проблем с входом, кодами и 2FA.',
        category: 'Support',
        tags: ['support', 'troubleshooting', 'wizard'],
        content: {
            initial_node_id: 'start',
            nodes: {
                'start': {
                    id: 'start',
                    title: 'Тип проблемы',
                    text: 'Что случилось у клиента?',
                    scripts: [],
                    options: [
                        { label: 'Неверный логин/пароль', next_node_id: 'bad_login' },
                        { label: 'Код активирован / Не работает', next_node_id: 'bad_code' },
                        { label: 'Не приходит 2FA код', next_node_id: 'no_2fa' }
                    ]
                },
                'bad_login': {
                    id: 'bad_login',
                    title: 'Неверный логин/пароль',
                    text: 'Частая ошибка: пробелы, регистр или не то приложение.',
                    scripts: [
                        { label: 'Инструкция по вводу', text: 'Пожалуйста, убедитесь, что вы копируете данные без лишних пробелов. И вводите их именно в официальном приложении.', action: 'text' },
                        { label: 'Запрос скрина', text: 'Пришлите, пожалуйста, скриншот ввода данных (пароль можно скрыть), чтобы я проверил, нет ли ошибки.', action: 'text' }
                    ],
                    options: [
                        { label: 'Проверить валидность', next_node_id: 'check_validity' },
                        { label: 'Назад', next_node_id: 'start' }
                    ]
                },
                'bad_code': {
                    id: 'bad_code',
                    title: 'Код не работает',
                    text: 'Проверьте регион и статус кода.',
                    scripts: [
                        { label: 'Вопросы', text: 'Уточните, какой регион у вашего аккаунта? Появляется ли какая-то ошибка при вводе?', action: 'text' }
                    ],
                    options: [
                        { label: 'Ошибка региона', next_node_id: 'region_error' },
                        { label: 'Код погашен', next_node_id: 'code_redeemed' },
                        { label: 'Назад', next_node_id: 'start' }
                    ]
                },
                'no_2fa': {
                    id: 'no_2fa',
                    title: 'Нет 2FA кода',
                    text: 'Почта mail.ru часто задерживает письма.',
                    scripts: [
                        { label: 'Ждем 2-3 мин', text: 'Коды иногда приходят с задержкой до 5-10 минут. Проверьте папку Спам.', action: 'text' },
                        { label: 'Запросить новый', text: 'Попробуйте нажать "Отправить код повторно".', action: 'text' }
                    ],
                    options: [
                        { label: 'Назад', next_node_id: 'start' }
                    ]
                },
                'check_validity': {
                    id: 'check_validity',
                    title: 'Проверка валидности',
                    text: 'Тут будет интеграция с DBM checker.',
                    scripts: [
                        { label: 'Проверяю...', text: 'Минуту, проверяю данные в системе.', action: 'text' }
                    ],
                    options: [
                        { label: 'Данные верны -> Клиент ошибается', next_node_id: 'bad_login' },
                        { label: 'Данные не верны -> Замена', next_node_id: 'issue_replacement' }
                    ]
                },
                'issue_replacement': {
                    id: 'issue_replacement',
                    title: 'Выдача замены',
                    text: 'Выдайте замену.',
                    scripts: [
                        { label: '⚡️ Выдать замену', action: 'create_order', payload: { product: 'Замена товара', amount: 0 } }
                    ],
                    options: [
                        { label: 'Завершить', next_node_id: 'start' }
                    ]
                },
                'region_error': {
                    id: 'region_error',
                    text: 'Объясните про регионы.',
                    scripts: [
                        { label: 'Не тот регион', text: 'Этот код предназначен только для региона [Регион]. На вашем аккаунте другой регион, поэтому он не активируется. Вам нужно создать новый аккаунт нужного региона.', action: 'text' }
                    ],
                    options: [
                        { label: 'Назад', next_node_id: 'start' }
                    ]
                },
                'code_redeemed': {
                    id: 'code_redeemed',
                    text: 'Если код уже погашен.',
                    scripts: [
                        { label: 'Запрос времени активации', text: 'Пришлите скриншот истории покупок/активаций, где видно время активации кода.', action: 'text' }
                    ],
                    options: [
                        { label: 'Назад', next_node_id: 'start' }
                    ]
                }
            }
        }
    }
];

const run = async () => {
    for (const proc of procedures) {
        console.log(`Processing: ${proc.title}`);

        // Upsert based on title
        const { data: existing } = await supabase.from('procedures').select('id').eq('title', proc.title).single();

        const payload = {
            title: proc.title,
            description: proc.description,
            category: proc.category,
            tags: proc.tags,
            steps: proc.content // Storing wizard content in 'steps' column
        };

        if (existing) {
            const { error } = await supabase.from('procedures').update(payload).eq('id', existing.id);
            if (error) console.error('Error updating:', error);
            else console.log('Updated.');
        } else {
            const { error } = await supabase.from('procedures').insert(payload);
            if (error) console.error('Error inserting:', error);
            else console.log('Inserted.');
        }
    }
};

run();
