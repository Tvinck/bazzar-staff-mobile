import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

function toUUID(input) {
    const hash = crypto.createHash('md5').update(input).digest('hex');
    return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

const s = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const id = toUUID('yandex_53939895937');
    console.log('Target ID:', id);
    const { data, error } = await s.from('orders').select('*').eq('id', id);
    console.log('Result:', data, error);
}
check();
