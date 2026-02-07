import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

function toUUID(input) {
    const hash = crypto.createHash('md5').update(input).digest('hex');
    return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

function parseYandexDate(dateStr) {
    if (!dateStr) return new Date().toISOString();
    if (dateStr.includes('T')) return dateStr;
    // Handle DD-MM-YYYY HH:mm:ss
    const m = dateStr.match(/(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}T${m[4]}:${m[5]}:${m[6]}Z`;
    return dateStr;
}

// Load .env from root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ynagmhidxfesjqioftbc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Yandex Configuration
const API_KEY = process.env.YANDEX_MARKET_API_KEY || 'ACMA:vJr9yUUaTRND9LGMoBWv4uceyaHJ6eJLtmpNMBzO:106c19a6';
const BUSINESS_ID = '216514292';
const CAMPAIGN_ID = '148917824';
const SYNC_INTERVAL_MS = 60000;

const BASE_URL = 'https://api.partner.market.yandex.ru/v2';
const HEADERS = {
    'Api-Key': API_KEY,
    'Content-Type': 'application/json',
};

// --- Sync Logic ---

async function syncOrders() {
    try {
        const statuses = 'UNPAID,PROCESSING,DELIVERY,PICKUP,DELIVERED,CANCELLED';
        const url = `${BASE_URL}/campaigns/${CAMPAIGN_ID}/orders.json?status=${statuses}&limit=50`;
        const res = await fetch(url, { headers: HEADERS });
        if (!res.ok) return;
        const data = await res.json();
        const orders = data.orders || [];

        for (const yOrder of orders) {
            const orderPayload = {
                id: toUUID(`yandex_${yOrder.id}`),
                external_id: String(yOrder.id),
                platform: 'yandex',
                status: mapYandexStatus(yOrder.status),
                price: yOrder.buyerTotal || 0,
                total_amount: yOrder.buyerTotal || 0,
                created_at: parseYandexDate(yOrder.creationDate),
                metadata: {
                    platform: 'yandex',
                    customer_name: `${yOrder.buyer?.firstName || ''} ${yOrder.buyer?.lastName || ''}`.trim() || 'Гость',
                    yandex_status: yOrder.status
                },
                product_name: yOrder.items?.[0]?.offerName || 'Товар с Яндекс Маркета'
            };
            const { error } = await supabase.from('orders').upsert(orderPayload, { onConflict: 'id' });
            if (error) console.error(`❌ Order Sync Error (ID ${yOrder.id}):`, error.message);
        }
    } catch (e) {
        console.error('Order sync failed:', e.message);
    }
}

async function syncChats() {
    try {
        // 1. Get List of Chats
        const url = `${BASE_URL}/businesses/${BUSINESS_ID}/chats`;
        const res = await fetch(url, { method: 'POST', headers: HEADERS, body: JSON.stringify({}) });
        if (!res.ok) return;

        const data = await res.json();
        const chats = data.result?.chats || [];

        console.log(`💬 Processing ${chats.length} Yandex chats...`);

        for (const yChat of chats) {
            const internalChatId = `yandex_${yChat.chatId}`;

            // 2. Sync Chat Metadata
            const chatPayload = {
                id: internalChatId,
                platform: 'yandex',
                external_id: String(yChat.chatId),
                client_name: yChat.context?.customer?.name || `Client ${yChat.chatId}`,
                last_message: '',
                unread_count: yChat.status === 'WAITING_FOR_PARTNER' ? 1 : 0,
                updated_at: yChat.updatedAt || new Date().toISOString()
            };

            await supabase.from('platform_chats').upsert(chatPayload, { onConflict: 'id' });

            // 3. Sync Message History
            const historyUrl = `${BASE_URL}/businesses/${BUSINESS_ID}/chats/history?chatId=${yChat.chatId}`;
            const historyRes = await fetch(historyUrl, { method: 'POST', headers: HEADERS, body: JSON.stringify({}) });

            if (historyRes.ok) {
                const historyData = await historyRes.json();
                const yMessages = historyData.result?.messages || [];
                let latestText = '';

                for (const yMsg of yMessages) {
                    const msgPayload = {
                        chat_id: internalChatId,
                        external_message_id: String(yMsg.messageId),
                        text: yMsg.message, // Structure from Step 829
                        sender: yMsg.sender === 'PARTNER' ? 'shop' : (yMsg.sender === 'MARKET' ? 'system' : 'client'),
                        created_at: yMsg.createdAt,
                        is_read: true
                    };
                    await supabase.from('platform_messages').upsert(msgPayload, { onConflict: 'chat_id, external_message_id' });
                    latestText = yMsg.message;
                }

                if (latestText) {
                    await supabase.from('platform_chats').update({ last_message: latestText }).eq('id', internalChatId);
                }
            }
        }
    } catch (e) {
        console.error('Chat sync failed:', e.message);
    }
}

async function processOutboundMessages() {
    try {
        const { data: pendingMessages } = await supabase
            .from('platform_messages')
            .select('*')
            .eq('sender', 'shop')
            .is('external_message_id', null)
            .limit(10);

        if (!pendingMessages || pendingMessages.length === 0) return;

        for (const msg of pendingMessages) {
            const { data: chat } = await supabase.from('platform_chats').select('external_id, platform').eq('id', msg.chat_id).single();
            if (!chat || chat.platform !== 'yandex') continue;

            console.log(`📤 Sending reply to chat ${chat.external_id}...`);
            const url = `${BASE_URL}/businesses/${BUSINESS_ID}/chats/message?chatId=${chat.external_id}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: HEADERS,
                body: JSON.stringify({ message: msg.text }) // Verified common structure
            });

            if (res.ok) {
                const resData = await res.json();
                const sentId = resData.result?.messageId || resData.result?.message?.id || 'sent_' + Date.now();
                await supabase.from('platform_messages').update({ external_message_id: String(sentId) }).eq('id', msg.id);
                console.log(`✅ Sent! ID: ${sentId}`);
            } else {
                const err = await res.json();
                console.error(`❌ Send failed:`, JSON.stringify(err));
            }
        }
    } catch (e) {
        console.error('Outbound processing failed:', e.message);
    }
}

function mapYandexStatus(yStatus) {
    const map = {
        'PROCESSING': 'processing', 'DELIVERY': 'processing', 'PICKUP': 'processing',
        'DELIVERED': 'completed', 'CANCELLED': 'cancelled', 'UNPAID': 'new', 'PENDING': 'new'
    };
    return map[yStatus] || 'processing';
}

async function runSync() {
    console.log(`[${new Date().toLocaleTimeString()}] 🔄 Syncing Yandex Market...`);
    await syncOrders();
    await syncChats();
    await processOutboundMessages();
    console.log(`✅ Sync cycle complete.`);
}

console.log('🚀 Yandex Sync Service v2.0 Started');
runSync();
setInterval(runSync, SYNC_INTERVAL_MS);
