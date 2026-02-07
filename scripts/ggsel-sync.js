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

// GGSel Configuration
const API_KEY = process.env.GGSEL_API_KEY;
const SELLER_ID = process.env.GGSEL_SELLER_ID === '14747' ? '1140096' : process.env.GGSEL_SELLER_ID; // Use 1140096 for login if 14747 fails
const BASE_URL = 'https://seller.ggsel.com/api_sellers/api';
const SYNC_INTERVAL_MS = 60000;

let currentToken = null;

async function getAuthToken() {
    try {
        console.log(`🔑 Refreshing GGSel token for ID: ${SELLER_ID}...`);
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const sign = crypto.createHash('sha256').update(API_KEY + timestamp).digest('hex');

        const res = await fetch(`${BASE_URL}/apilogin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                seller_id: parseInt(SELLER_ID),
                timestamp: timestamp,
                sign: sign
            })
        });

        const data = await res.json();
        if (data.token) {
            console.log('✅ GGSel Token Refreshed');
            currentToken = data.token;
            return currentToken;
        }
        console.error('❌ GGSel Login Failed:', data);
        return null;
    } catch (e) {
        console.error('❌ GGSel Auth Error:', e.message);
        return null;
    }
}

function toUUID(input) {
    const hash = crypto.createHash('md5').update(String(input)).digest('hex');
    return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

function getProductName(product) {
    if (!product || !product.name) return 'Товар GGSel';
    if (Array.isArray(product.name)) {
        const ru = product.name.find(n => n.locale === 'ru-RU');
        return ru ? ru.value : (product.name[0]?.value || 'Товар GGSel');
    }
    return product.name;
}

async function syncOrders() {
    if (!currentToken && !(await getAuthToken())) return;

    try {
        console.log('📦 Syncing GGSel sales...');
        // seller-last-sales returns a list of recent orders with invoice_id
        const res = await fetch(`${BASE_URL}/seller-last-sales?token=${currentToken}&top=50`);
        const data = await res.json();

        if (data.retval !== 0) {
            if (data.retval === 401) {
                await getAuthToken();
                return syncOrders();
            }
            console.error('❌ GGSel Sales Error:', data);
            return;
        }

        const items = data.sales || [];
        console.log(`📦 Found ${items.length} GGSel sales`);

        for (const item of items) {
            const orderPayload = {
                id: toUUID(`ggsel_${item.invoice_id}`),
                external_id: String(item.invoice_id),
                platform: 'ggsel',
                product_name: getProductName(item.product),
                price: item.product?.price_rub || item.amount || 0,
                total_amount: item.amount || 0,
                status: 'completed', // sales usually mean paid
                created_at: item.date || new Date().toISOString(),
                metadata: {
                    platform: 'ggsel',
                    item_id: item.product?.id,
                    buyer_email: item.buyer_email,
                    payment_method: item.payment_method,
                    invoice_id: item.invoice_id
                }
            };

            const { error } = await supabase.from('orders').upsert(orderPayload, { onConflict: 'id' });
            if (error) console.error(`❌ GGSel Order Error (ID ${item.invoice_id}):`, error.message);
        }
    } catch (e) {
        console.error('❌ GGSel Sales Sync Failed:', e.message);
    }
}

async function syncChats() {
    if (!currentToken && !(await getAuthToken())) return;

    try {
        console.log('💬 Syncing GGSel chats...');
        const res = await fetch(`${BASE_URL}/debates/v2/chats?token=${currentToken}&page=1&pagesize=50`);
        const data = await res.json();

        if (data.retval === 401) {
            await getAuthToken();
            return syncChats();
        }

        const items = data.items || [];
        console.log(`💬 Found ${items.length} GGSel chats`);

        for (const chat of items) {
            const chatId = toUUID(`ggsel_chat_${chat.id_i}`);

            // Upsert Chat
            const { error: chatErr } = await supabase.from('platform_chats').upsert({
                id: chatId,
                platform: 'ggsel',
                external_id: String(chat.id_i),
                client_name: chat.email || 'Клиент GGSel',
                last_message: chat.last_message || '',
                unread_count: chat.cnt_new || 0,
                updated_at: chat.date_last || new Date().toISOString(),
                metadata: { product_id: chat.product }
            }, { onConflict: 'id' });

            if (chatErr) console.error('❌ GGSel Chat Error:', chatErr.message);

            // Sync Messages
            const msgRes = await fetch(`${BASE_URL}/debates/v2?token=${currentToken}&id_i=${chat.id_i}`);
            const messages = await msgRes.json();

            if (Array.isArray(messages)) {
                for (const msg of messages) {
                    const { error: msgErr } = await supabase.from('platform_messages').upsert({
                        chat_id: chatId,
                        external_message_id: String(msg.id),
                        text: msg.message,
                        sender: parseInt(msg.buyer) === 1 ? 'client' : 'shop',
                        created_at: msg.date_written,
                        is_read: true
                    }, { onConflict: 'chat_id, external_message_id' });

                    if (msgErr) console.error('❌ GGSel Msg Error:', msgErr.message);
                }
            }
        }
    } catch (e) {
        console.error('❌ GGSel Chat Sync Failed:', e.message);
    }
}

async function sendOutboundMessages() {
    if (!currentToken && !(await getAuthToken())) return;

    try {
        const { data: pendingMessages } = await supabase
            .from('platform_messages')
            .select('*')
            .eq('sender', 'shop')
            .is('external_message_id', null)
            .limit(10);

        if (!pendingMessages || pendingMessages.length === 0) return;

        for (const msg of pendingMessages) {
            const { data: chat } = await supabase
                .from('platform_chats')
                .select('external_id, platform')
                .eq('id', msg.chat_id)
                .single();

            if (!chat || chat.platform !== 'ggsel') continue;

            console.log(`📤 Sending GGSel reply to chat ${chat.external_id}...`);
            const res = await fetch(`${BASE_URL}/debates/v2?token=${currentToken}&id_i=${chat.external_id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg.text })
            });

            const result = await res.json();
            if (result && result.id) {
                await supabase.from('platform_messages').update({
                    external_message_id: String(result.id),
                    platform_data: { sent: true }
                }).eq('id', msg.id);
            } else if (result.retval === 401) {
                await getAuthToken();
                // Will try again next cycle
            } else {
                console.error(`❌ GGSel Send Error:`, result);
                if (result.retdesc) {
                    await supabase.from('platform_messages').update({
                        platform_data: { error: result.retdesc, failed: true }
                    }).eq('id', msg.id);
                }
            }
        }
    } catch (e) {
        console.error('❌ GGSel Outbound Failed:', e.message);
    }
}

async function main() {
    console.log('🚀 GGSel Sync Service Started');
    while (true) {
        console.log(`[${new Date().toLocaleTimeString()}] 🔄 Syncing GGSel...`);
        await syncOrders();
        await syncChats();
        await sendOutboundMessages();
        console.log('✅ GGSel Sync Cycle Complete');
        await new Promise(resolve => setTimeout(resolve, SYNC_INTERVAL_MS));
    }
}

main();
