import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from project root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const procedureData = {
    title: 'Воронка продаж: Авито',
    description: 'Скрипты и действия для обработки входящих заявок с Авито. Включает ветки FaceApp, Игры и Telegram Premium.',
    category: 'Sales',
    tags: ['avito', 'sales', 'faceapp', 'games', 'telegram'],
    steps: [
        { text: '1. Приветствие и выявление потребности' },
        { text: '2. Презентация (выбрать ветку товара)' },
        { text: '3. Инструкция и гарантии' },
        { text: '4. Оплата (отправка реквизитов)' },
        { text: '5. Выдача товара или Дожим' }
    ],
    scripts: [
        { label: '👋 Приветствие', text: 'Здравствуйте! Спасибо за интерес к нашим сервисам. 🚀\nСейчас я максимально подробно расскажу о выбранном товаре и помогу с подключением.\n\nВыберите, что вас интересует:\n1. FaceApp Pro (12 мес.)\n2. Общий аккаунт (Игры App Store)\n3. Telegram Premium / Stars', action: 'text' },

        { label: '📸 FaceApp: Инфо', text: 'FaceApp Pro на 12 месяцев — всего за 350₽. Это в разы выгоднее, чем в App Store. Никаких лимитов, полный доступ ко всем нейрофильтрам. Работает стабильно!', action: 'text' },
        { label: '📸 FaceApp: Инструкция', text: 'Установка простая: после оплаты вы получаете логин и пароль. Важно: вводить данные нужно именно в приложении App Store (не в настройки телефона!). Скачиваете приложение, проверяете и возвращаетесь в свой аккаунт. Старую версию приложения перед этим нужно удалить.', action: 'text' },
        { label: '📸 FaceApp: Гарантии', text: 'Поддержка с 09:00 до 22:00. Вы получаете гарантию работы на все 12 месяцев. Обновление приложения доступно раз в месяц — это наша мера безопасности для защиты аккаунта.', action: 'text' },
        { label: '💳 FaceApp: Оплата', text: 'К оплате: 350₽.\nРеквизиты: Т-Банк — 2200 7019 0557 6168 (Вадим Г.)\nПосле оплаты пришлите чек, и я сразу вышлю данные для входа!', action: 'text' },
        { label: '✅ FaceApp: Заказ', action: 'create_order', payload: { product: 'FaceApp Pro 12 мес', amount: 350 } },

        { label: '🎮 Игры: Инфо', text: 'У нас огромная библиотека топовых игр. Это самый удобный и дешевый способ собрать коллекцию на iPhone, не переплачивая в App Store.', action: 'text' },
        { label: '🎮 Игры: Инструкция', text: 'Вход через App Store. Скачиваете нужные игры и выходите. Играете со своего аккаунта. Весь прогресс сохраняется у вас.', action: 'text' },
        { label: '💳 Игры: Оплата', text: 'К оплате: 99₽.\nРеквизиты: Т-Банк — 2200 7019 0557 6168 (Вадим Г.)', action: 'text' },
        { label: '✅ Игры: Заказ', action: 'create_order', payload: { product: 'Общий аккаунт (Игры)', amount: 99 } },

        { label: '⭐️ TG: Premium Инфо', text: 'Подписка выдается подарком по вашему username. Вход в аккаунт не требуется. Доставка практически мгновенная!', action: 'text' },
        { label: '⭐️ TG: Запрос Username', text: 'Напишите, пожалуйста, ваш Username в Telegram (через @).', action: 'text' },
        { label: '✅ TG: Premium Заказ', action: 'create_order', payload: { product: 'Telegram Premium', amount: 0 } },

        { label: '⏳ Дожим (через 24ч)', text: 'Здравствуйте! Уточните, пожалуйста, остались ли у вас какие-то сомнения? Возможно, нашли предложение у другого продавца? Поделитесь вашим мнением — это поможет нам стать лучше. Будем очень признательны за обратную связь! 🙏', action: 'text' }
    ]
};

const run = async () => {
    try {
        // Check if it exists first
        const { data: existing, error: fetchError } = await supabase.from('procedures').select('id').eq('title', procedureData.title).single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error fetching existing:', fetchError);
            return;
        }

        let result;
        if (existing) {
            console.log('Updating existing procedure:', existing.id);
            result = await supabase.from('procedures').update(procedureData).eq('id', existing.id).select();
        } else {
            console.log('Inserting new procedure');
            result = await supabase.from('procedures').insert(procedureData).select();
        }

        if (result.error) {
            console.error('Error performing upsert:', result.error);
        } else {
            console.log('Success:', result.data);
        }
    } catch (e) {
        console.error('Unexpected error:', e);
    }
};

run();
