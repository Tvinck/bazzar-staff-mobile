
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const procedure = {
    title: "Квалификация Клиента (CRM)",
    description: "Сбор данных о консоли и регионе",
    tags: ["crm", "setup"],
    steps: {
        initial_node_id: "node_console",
        nodes: {
            "node_console": {
                id: "node_console",
                title: "Выбор Консоли",
                text: "Узнайте, какая у клиента консоль, чтобы сохранить это в профиль.",
                scripts: [
                    {
                        label: "PlayStation 5",
                        action: "update_profile",
                        payload: { key: "console", value: "ps5", label: "PlayStation 5" },
                        text: "Отлично, PS5."
                    },
                    {
                        label: "PlayStation 4",
                        action: "update_profile",
                        payload: { key: "console", value: "ps4", label: "PlayStation 4" },
                        text: "Понял, PS4."
                    },
                    {
                        label: "Xbox Series",
                        action: "update_profile",
                        payload: { key: "console", value: "xbox_series", label: "Xbox Series" },
                        text: "Супер, Xbox Series."
                    }
                ],
                options: [
                    { label: "Далее: Регион", next_node_id: "node_region" }
                ]
            },
            "node_region": {
                id: "node_region",
                title: "Выбор Региона",
                text: "Уточните регион аккаунта.",
                scripts: [
                    {
                        label: "Турция 🇹🇷",
                        action: "update_profile",
                        payload: { key: "region", value: "tr", label: "Турция" },
                        text: "Регион Турция."
                    },
                    {
                        label: "Индия 🇮🇳",
                        action: "update_profile",
                        payload: { key: "region", value: "in", label: "Индия" },
                        text: "Регион Индия."
                    },
                    {
                        label: "РФ 🇷🇺",
                        action: "update_profile",
                        payload: { key: "region", value: "ru", label: "РФ" },
                        text: "Регион РФ."
                    }
                ],
                options: [
                    { label: "Завершить", next_node_id: "node_finish" }
                ]
            },
            "node_finish": {
                id: "node_finish",
                title: "Готово",
                text: "Данные сохранены в профиле клиента (см. шапку чата).",
                scripts: [],
                options: [] // End
            }
        }
    }
};

async function run() {
    console.log('Inserting Qualification procedure...');

    // 1. Delete existing if any
    await supabase.from('procedures').delete().eq('title', procedure.title);

    // 2. Insert new
    const { data, error } = await supabase
        .from('procedures')
        .insert([procedure])
        .select();

    if (error) {
        console.error('Error inserting procedure:', error);
    } else {
        console.log('Success! Procedure ID:', data[0].id);
    }
}

run();
