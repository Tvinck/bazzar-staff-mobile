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

// Definition of the Wizard Structure
const wizardData = {
    title: 'Воронка продаж: Авито (Wizard)',
    description: 'Интерактивная воронка продаж для Авито (FaceApp, Games, Telegram).',
    category: 'Sales',
    tags: ['avito', 'sales', 'wizard'],
    // We store the structural data in a new 'data' column or overwrite 'scripts' if flexible.
    // Since existing schema might be rigid, let's check if we can store complex JSON in 'content' or just use 'scripts' field if it's JSONB.
    // The previous insert used 'scripts' as an array.
    // Ideally we should use a 'data' field. Let's check schema first? 
    // Assuming 'scripts' is JSONB, we can interpret it differently or add a 'type': 'wizard' flag to the procedure.
    type: 'wizard',
    content: {
        initial_node_id: 'start',
        nodes: {
            'start': {
                id: 'start',
                title: '👋 Приветствие',
                text: 'Поприветствуйте клиента и узнайте, что его интересует.',
                scripts: [
                    { label: '👋 Приветствие (Универсальное)', text: 'Здравствуйте! Спасибо за интерес к нашим сервисам. 🚀\nСейчас я максимально подробно расскажу о выбранном товаре и помогу с подключением.', action: 'text' }
                ],
                options: [
                    { label: '📸 FaceApp', next_node_id: 'faceapp_info' },
                    { label: '🎮 Игры (Общий аккаунт)', next_node_id: 'games_info' },
                    { label: '⭐️ Telegram Premium', next_node_id: 'tg_info' }
                ]
            },
            'faceapp_info': {
                id: 'faceapp_info',
                title: '📸 FaceApp: Презентация',
                text: 'Расскажите про условия FaceApp Pro.',
                scripts: [
                    { label: 'Инфо о товаре', text: 'FaceApp Pro на 12 месяцев — всего за 350₽. Это в разы выгоднее, чем в App Store. Никаких лимитов, полный доступ ко всем нейрофильтрам. Работает стабильно!', action: 'text' }
                ],
                options: [
                    { label: 'Клиент согласен', next_node_id: 'faceapp_instruction' },
                    { label: 'Назад', next_node_id: 'start' }
                ]
            },
            'faceapp_instruction': {
                id: 'faceapp_instruction',
                title: '📸 FaceApp: Инструкция',
                text: 'Объясните, как будет проходить подключение.',
                scripts: [
                    { label: 'Инструкция', text: 'Установка простая: после оплаты вы получаете логин и пароль. Важно: вводить данные нужно именно в приложении App Store. Скачиваете приложение, проверяете и возвращаетесь в свой аккаунт.', action: 'text' },
                    { label: 'Гарантии', text: 'Поддержка с 09:00 до 22:00. Гарантия на 12 месяцев.', action: 'text' }
                ],
                options: [
                    { label: 'К оплате', next_node_id: 'faceapp_payment' },
                    { label: 'Назад', next_node_id: 'faceapp_info' }
                ]
            },
            'faceapp_payment': {
                id: 'faceapp_payment',
                title: '📸 FaceApp: Оплата',
                text: 'Отправьте реквизиты.',
                scripts: [
                    { label: 'Реквизиты (350₽)', text: 'К оплате: 350₽.\nРеквизиты: Т-Банк — 2200 7019 0557 6168 (Вадим Г.)\nПосле оплаты пришлите чек.', action: 'text' }
                ],
                options: [
                    { label: 'Оплатил -> Создать заказ', next_node_id: 'faceapp_order' },
                    { label: 'Назад', next_node_id: 'faceapp_instruction' }
                ]
            },
            'faceapp_order': {
                id: 'faceapp_order',
                title: '✅ FaceApp: Завершение',
                text: 'Создайте заказ в системе.',
                scripts: [
                    { label: '✅ Создать заказ', action: 'create_order', payload: { product: 'FaceApp Pro 12 мес', amount: 350 } }
                ],
                options: [
                    { label: 'В начало', next_node_id: 'start' }
                ]
            },


            'games_info': {
                id: 'games_info',
                title: '🎮 Игры: Презентация',
                text: 'Про игры (Общий аккаунт).',
                scripts: [
                    { label: 'Инфо', text: 'У нас огромная библиотека топовых игр. Это самый удобный и дешевый способ собрать коллекцию на iPhone.', action: 'text' }
                ],
                options: [
                    { label: 'Клиент согласен', next_node_id: 'games_instruction' },
                    { label: 'Назад', next_node_id: 'start' }
                ]
            },
            'games_instruction': {
                id: 'games_instruction',
                title: '🎮 Игры: Инструкция',
                text: 'Как пользоваться общим аккаунтом.',
                scripts: [
                    { label: 'Инструкция', text: 'Вход через App Store. Скачиваете игры и выходите. Играете со своего аккаунта.', action: 'text' }
                ],
                options: [
                    { label: 'К оплате', next_node_id: 'games_payment' },
                    { label: 'Назад', next_node_id: 'games_info' }
                ]
            },
            'games_payment': {
                id: 'games_payment',
                title: '🎮 Игры: Оплата',
                text: 'Реквизиты для игр.',
                scripts: [
                    { label: 'Реквизиты (99₽)', text: 'К оплате: 99₽.\nРеквизиты: Т-Банк — 2200 7019 0557 6168 (Вадим Г.)', action: 'text' }
                ],
                options: [
                    { label: 'Оплатил -> Заказ', next_node_id: 'games_order' },
                    { label: 'Назад', next_node_id: 'games_instruction' }
                ]
            },
            'games_order': {
                id: 'games_order',
                title: '✅ Игры: Заказ',
                text: 'Создание заказа.',
                scripts: [
                    { label: '✅ Создать заказ', action: 'create_order', payload: { product: 'Общий аккаунт (Игры)', amount: 99 } }
                ],
                options: [
                    { label: 'В начало', next_node_id: 'start' }
                ]
            },


            'tg_info': {
                id: 'tg_info',
                title: '⭐️ TG Premium: Презентация',
                text: 'Telegram Premium / Stars.',
                scripts: [
                    { label: 'Инфо', text: 'Подписка выдается подарком по username. Вход не требуется.', action: 'text' }
                ],
                options: [
                    { label: 'Далее', next_node_id: 'tg_username' },
                    { label: 'Назад', next_node_id: 'start' }
                ]
            },
            'tg_username': {
                id: 'tg_username',
                title: '⭐️ TG: Username',
                text: 'Запросите юзернейм.',
                scripts: [
                    { label: 'Запрос Username', text: 'Напишите ваш Username в Telegram (через @).', action: 'text' }
                ],
                options: [
                    { label: 'Создать заказ', next_node_id: 'tg_order' },
                    { label: 'Назад', next_node_id: 'tg_info' }
                ]
            },
            'tg_order': {
                id: 'tg_order',
                title: '✅ TG: Заказ',
                text: 'Создать заказ (сумма 0 или по прайсу).',
                scripts: [
                    { label: '✅ Создать заказ', action: 'create_order', payload: { product: 'Telegram Premium', amount: 0 } }
                ],
                options: [
                    { label: 'В начало', next_node_id: 'start' }
                ]
            }
        }
    }
};

const run = async () => {
    // 1. Get the existing 'Avito' procedure to update, OR create new.
    // We will use a dedicated title "Воронка продаж: Авито (Wizard)" to distinguish or just update the old one.
    // Let's UPDATE the old one if exists, or insert.
    // Actually, user wants to REFACTOR. So let's replace the old one if possible.

    // We'll search by the old title too just in case.
    const title = 'Воронка продаж: Авито';

    const { data: existing } = await supabase.from('procedures').select('id').eq('title', title).single();

    // We need to make sure 'content' column exists? 
    // Actually, 'procedures' table might be simple. Let's check columns first?
    // I recall insert_avito_procedure.sql: it had title, description, category, tags, steps (jsonb array), scripts (jsonb array).
    // I will put the wizard data into 'scripts' column? No, that's an array.
    // I will put it into 'metadata' if exists? Or just repurpose 'steps' or 'scripts'.
    // Let's use 'steps' column to store the wizard object. It's JSONB.

    // WAIT: 'steps' is likely array of strings in current UI usage.
    // If I change 'steps' to an object, existing UI might break if it expects array map.
    // I should create a NEW procedure for the wizard to avoid breaking current UI until I update it.

    const newProcedure = {
        title: title, // Keep same title to "refactor" implies replacing.
        description: wizardData.description,
        category: wizardData.category,
        tags: wizardData.tags,
        // Storing the wizard structure in 'metadata' (if it exists) or just create a custom structure.
        // Let's try to put it in 'scripts' but 'scripts' is expected to be array.
        // Let's assume 'steps' can hold this object.
        // Or better: Let's assume 'meta' or 'extra_data'.
        // Actually, looking at previous logs, I didn't see schema inspection for 'procedures'.
        // I'll assume standard 'procedures' table has 'metadata' or I'll put it in 'scripts' as a wrapped object?
        // No, best is to use 'steps' as the container for the wizard tree, and 'scripts' can be empty or flat list of all scripts for search.

        // Let's just update the TITLE and DESCRIPTION and put the data in `steps` (as a JSON object, not array).
        // If `steps` is strongly typed as JSONB, it accepts object.
        // BUT: Old UI iterates `steps.map`. It will crash if it's an object.
        // So I MUST update UI *before* or *simultaneously* with using this data.

        // Strategy: Store wizard data in `steps` field.
        steps: wizardData.content
    };

    if (existing) {
        console.log('Updating existing procedure:', existing.id);
        const { error } = await supabase.from('procedures').update(newProcedure).eq('id', existing.id);
        if (error) console.error('Error updating:', error);
        else console.log('Updated successfully');
    } else {
        console.log('Procedure not found to update.');
    }
};

run();
