
// bot-bridge.js
// This script bridges Supabase Notifications -> Telegram Bot
// Run with: node bot-bridge.js

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch'; // Ensure node-fetch is installed or use global fetch in Node 18+

// CONFIG
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'; // Replace or set env
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'YOUR_SERVICE_KEY'; // User must provide or Replace
const BOT_TOKEN = '8512227891:AAHxb4iZ2BRxoeUQWS3SDVrOtybaP5dc-Tg';

// Fallback if env vars not set (User needs to fill this if not using .env)
if (!process.env.VITE_SUPABASE_URL) console.warn("⚠️  WARNING: SUPABASE_URL not set.");
if (!process.env.SUPABASE_SERVICE_KEY) console.warn("⚠️  WARNING: SUPABASE_SERVICE_KEY not set. Realtime might fail.");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('🤖 Bot Bridge Started. Listening for new notifications...');

// Listen for INSERT on 'notifications' table
const channel = supabase
    .channel('public:notifications')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, async (payload) => {
        const notif = payload.new;
        console.log('🔔 New Notification:', notif.title);

        try {
            // 1. Find Telegram Chat ID for the user
            const { data: mapping, error } = await supabase
                .from('bot_users')
                .select('telegram_chat_id')
                .eq('user_id', notif.user_id)
                .single();

            if (error || !mapping) {
                console.log(`⚠️  No Telegram mapping for user ${notif.user_id}`);
                return;
            }

            const chatId = mapping.telegram_chat_id;

            // 2. Format Message
            const text = `<b>${notif.title}</b>\n${notif.message}\n\n<i>${new Date().toLocaleTimeString()}</i>`;

            // 3. Send to Telegram
            const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: text,
                    parse_mode: 'HTML'
                })
            });

            const result = await response.json();
            if (result.ok) {
                console.log(`✅ Sent to TG: ${chatId}`);
            } else {
                console.error('❌ Telegram Error:', result);
            }

        } catch (err) {
            console.error('Bridge Error:', err);
        }
    })
    .subscribe();

// Keep script alive
process.stdin.resume();
