import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const run = async () => {
    const { data, error } = await supabase.from('platform_chats').select('tags').limit(1);
    if (error) {
        console.error('Error selecting tags:', error.message);
        if (error.message.includes('column "tags" does not exist')) {
            console.log('Column needs to be created.');
        }
    } else {
        console.log('Column "tags" exists.');
    }
};

run();
