import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

// Load .env from root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Digiseller Configuration
const SELLER_ID = process.env.DIGISELLER_SELLER_ID || '1140096';
const API_KEY = process.env.DIGISELLER_API_KEY || '61223F5A90844BBEBFAEAB07D162F9F0';
const SYNC_INTERVAL_MS = 60000;
const BASE_URL = 'https://api.digiseller.com/api';

let cachedToken = null;
let tokenExpiry = 0;

function toUUID(input) {
    const hash = crypto.createHash('md5').update(input).digest('hex');
    return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

async function getAccessToken() {
    if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

    const timestamp = Math.floor(Date.now() / 1000);
    const sign = crypto.createHash('sha256').update(API_KEY + timestamp).digest('hex');

    try {
        const res = await fetch(`${BASE_URL}/apilogin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ seller_id: SELLER_ID, timestamp, sign })
        });
        const data = await res.json();
        if (data.retval === 0) {
            cachedToken = data.token;
            tokenExpiry = Date.now() + 3600000; // Assume 1 hour validity
            return cachedToken;
        }
        console.error('❌ Digiseller Auth Error:', data);
    } catch (e) {
        console.error('❌ Digiseller Auth Failed:', e.message);
    }
    return null;
}

async function syncOrders() {
    const token = await getAccessToken();
    if (!token) return;

    try {
        const date_start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').split('.')[0];
        const date_finish = new Date().toISOString().replace('T', ' ').split('.')[0];

        const res = await fetch(`${BASE_URL}/seller-sells/v2?token=${token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date_start, date_finish, page: 1, rows: 100 })
        });
        const data = await res.json();

        const items = data.rows || [];
        console.log(`📦 Found ${items.length} Digiseller orders`);

        for (const item of items) {
            const orderPayload = {
                id: toUUID(`digiseller_${item.id_i}`),
                external_id: String(item.id_i),
                platform: 'digiseller',
                product_name: item.product_name,
                price: item.amount,
                total_amount: item.amount,
                status: 'completed',
                created_at: item.date_pay.replace(' ', 'T') + 'Z',
                metadata: {
                    platform: 'digiseller',
                    customer_name: item.email || 'Клиент Digiseller',
                    email: item.email,
                    payment_method: item.method_pay
                }
            };

            const { error } = await supabase.from('orders').upsert(orderPayload, { onConflict: 'id' });
            if (error) console.error(`❌ Digiseller Order Error (ID ${item.id_i}):`, error.message);
        }
    } catch (e) {
        console.error('❌ Digiseller Order Sync Failed:', e.message);
    }
}

async function syncChats() {
    const token = await getAccessToken();
    if (!token) return;

    try {
        const res = await fetch(`${BASE_URL}/debates/v2/chats?token=${token}&page=1&rows=100`);
        const data = await res.json();
        const items = data.chats || [];
        console.log(`💬 Found ${items.length} Digiseller chats`);

        for (const chat of items) {
            const chatId = toUUID(`digiseller_chat_${chat.id_i}`);

            // Upsert Chat
            const { error: chatErr } = await supabase.from('platform_chats').upsert({
                id: chatId,
                platform: 'digiseller',
                external_id: String(chat.id_i),
                client_name: chat.email || 'Клиент Digiseller',
                last_message: chat.last_msg || '',
                unread_count: chat.cnt_new || 0,
                updated_at: new Date(chat.last_date.replace(' ', 'T') + 'Z').toISOString(),
                metadata: { product_name: chat.product }
            }, { onConflict: 'id' });

            if (chatErr) console.error('❌ Digiseller Chat Error:', chatErr.message);

            // Fetch and Sync Messages for this chat
            const msgRes = await fetch(`${BASE_URL}/debates/v2?token=${token}&id_i=${chat.id_i}`);
            const messages = await msgRes.json(); // Direct array response

            if (Array.isArray(messages)) {
                for (const msg of messages) {
                    const { error: msgErr } = await supabase.from('platform_messages').upsert({
                        chat_id: chatId,
                        external_message_id: String(msg.id),
                        text: msg.message, // Digiseller uses 'message' not 'content'
                        sender: msg.buyer ? 'client' : 'shop', // Digiseller has msg.buyer or msg.seller field
                        created_at: new Date(msg.date_written.replace(' ', 'T') + 'Z').toISOString(),
                        is_read: !!msg.date_seen
                    }, { onConflict: 'chat_id, external_message_id' });

                    if (msgErr) console.error('❌ Digiseller Msg Error:', msgErr.message);
                }
            }
        }
    } catch (e) {
        console.error('❌ Digiseller Chat Sync Failed:', e.message);
    }
}

async function sendOutboundMessages() {
    const token = await getAccessToken();
    if (!token) return;

    try {
        const { data: pendingMessages } = await supabase
            .from('platform_messages')
            .select('*')
            .eq('sender', 'shop')
            .is('external_message_id', null)
            .limit(10);

        console.log(`Debug: Pending messages query result:`, pendingMessages?.length);

        if (!pendingMessages || pendingMessages.length === 0) return;

        for (const msg of pendingMessages) {
            const { data: chat } = await supabase
                .from('platform_chats')
                .select('external_id, platform')
                .eq('id', msg.chat_id)
                .single();

            if (!chat || chat.platform !== 'digiseller') continue;

            console.log(`📤 Sending Digiseller reply to chat ${chat.external_id}...`);
            const res = await fetch(`${BASE_URL}/debates/v2?token=${token}&id_i=${chat.external_id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg.text })
            });

            const text = await res.text();
            console.log(`Debug: Digiseller response status: ${res.status}, body: ${text}`);

            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse JSON:', text);
                continue;
            }
            if (result.retval === 0) {
                await supabase.from('platform_messages').update({
                    external_message_id: String(result.id || Date.now()),
                    platform_data: { sent: true }
                }).eq('id', msg.id);
            } else {
                console.error(`❌ Digiseller Send Error:`, result);
            }
        }
    } catch (e) {
        console.error('❌ Digiseller Outbound Failed:', e.message);
    }
}

async function main() {
    console.log('🚀 Digiseller Sync Service Started');
    while (true) {
        console.log(`[${new Date().toLocaleTimeString()}] 🔄 Syncing Digiseller...`);
        await syncOrders();
        await syncChats();
        await sendOutboundMessages();
        console.log('✅ Digiseller Sync Cycle Complete');
        await new Promise(resolve => setTimeout(resolve, SYNC_INTERVAL_MS));
    }
}

main();
