import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('🔍 Checking platform_chats table...');
    const { data: chats, error } = await supabase.from('platform_chats').select('*');
    if (error) {
        console.error('❌ Error selecting from platform_chats:', error.message);
    } else {
        console.log('✅ Found platform_chats table, count:', chats.length);
        if (chats.length > 0) {
            console.log('First chat:', chats[0].client_name);
        }
    }

    const { data: messages, error: msgError } = await supabase.from('platform_messages').select('*');
    if (msgError) {
        console.error('❌ Error selecting from platform_messages:', msgError.message);
    } else {
        console.log('✅ Found platform_messages table, count:', messages.length);
    }
}

check();
