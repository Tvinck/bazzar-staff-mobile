import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const titlesToDelete = [
    'Выдача заказа (Ручная)',
    'Возврат товара (Digital)'
];

const run = async () => {
    console.log('Deleting procedures:', titlesToDelete);

    const { data, error } = await supabase
        .from('procedures')
        .delete()
        .in('title', titlesToDelete)
        .select();

    if (error) {
        console.error('Error deleting:', error);
    } else {
        console.log(`Deleted ${data.length} procedures.`);
        data.forEach(p => console.log(`- ${p.title}`));
    }
};

run();
