import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const body = await req.json().catch(() => ({}))
        const { action, chatId, text } = body
        const { type, payload } = body

        // 1. Get Credentials
        const { data: integration, error: intError } = await supabaseClient
            .from('integrations')
            .select('config')
            .eq('service', 'avito')
            .single()

        if (intError || !integration) throw new Error('Avito integration not found')

        const config = integration.config
        const { client_id, client_secret, user_id } = config

        // 2. Auth Helper
        const getAccessToken = async () => {
            const authParams = new URLSearchParams({
                grant_type: 'client_credentials',
                client_id,
                client_secret,
            })

            const authRes = await fetch('https://api.avito.ru/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: authParams,
            })

            if (!authRes.ok) {
                const err = await authRes.text()
                throw new Error(`Avito Auth Failed: ${err}`)
            }

            const data = await authRes.json()
            return data.access_token
        }

        // Action: Register Webhook
        if (action === 'register_webhook') {
            const token = await getAccessToken();
            const webhookUrl = 'https://ynagmhidxfesjqioftbc.supabase.co/functions/v1/avito-io';

            const regRes = await fetch('https://api.avito.ru/messenger/v3/webhook', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: webhookUrl
                })
            });

            const result = await regRes.json();

            return new Response(JSON.stringify({ success: true, result }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // Action: Sync Chats
        if (action === 'sync_chats') {
            const token = await getAccessToken();

            // 0. Get Real User ID
            const meRes = await fetch('https://api.avito.ru/core/v1/accounts/self', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            let finalUserId = user_id;
            if (meRes.ok) {
                const meData = await meRes.json();
                finalUserId = String(meData.id);
                console.log(`Resolved User ID: ${finalUserId} (Config: ${user_id})`);

                // Persistence: Update Config if changed
                if (finalUserId !== user_id) {
                    const newConfig = { ...config, user_id: finalUserId };
                    await supabaseClient.from('integrations').update({ config: newConfig }).eq('service', 'avito');
                    console.log('Updated Avito config with numeric user_id');
                }
            } else {
                console.warn("Failed to fetch /core/v1/accounts/self", await meRes.text());
            }

            // 1. Fetch Chats
            const url = `https://api.avito.ru/messenger/v2/accounts/${finalUserId}/chats?limit=20`;
            console.log("Fetching URL:", url);

            const chatsRes = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!chatsRes.ok) {
                const errText = await chatsRes.text();
                const status = chatsRes.status;
                console.error("Avito Chats Error:", status, errText);
                throw new Error(`Failed to fetch chats: ${status}. Url: ${url}. Err: ${errText}`);
            }
            const chatsData = await chatsRes.json();
            const chats = chatsData.chats || [];

            console.log(`Syncing ${chats.length} chats...`);
            let syncedCount = 0;

            for (const c of chats) {
                // Extract Info
                const externalChatId = c.id;
                // Client Name: Find user who is NOT me
                const clientUser = c.users.find(u => String(u.id) !== finalUserId) || c.users[0];
                const clientName = clientUser?.name || 'Avito User';

                // Item Title (Context)
                const itemTitle = c.context?.value?.title;
                const displayName = itemTitle ? `${clientName} (${itemTitle})` : clientName;

                const lastMsgText = c.last_message?.content?.text || 'Вложение';
                const updatedTime = new Date(c.updated * 1000).toISOString();

                // UPSERT Chat
                const { data: chatParams, error: chatErr } = await supabaseClient
                    .from('platform_chats')
                    .upsert({
                        platform: 'avito',
                        external_id: String(externalChatId),
                        client_name: displayName,
                        last_message: lastMsgText,
                        updated_at: updatedTime,
                        unread_count: 0
                    }, { onConflict: 'platform, external_id' })
                    .select()
                    .single();

                if (chatErr) {
                    console.error('Chat Upsert Error', chatErr);
                    continue;
                }

                syncedCount++;

                // 2. Fetch Messages for this Chat (limit 20)
                const msgRes = await fetch(`https://api.avito.ru/messenger/v3/accounts/${finalUserId}/chats/${externalChatId}/messages?limit=20`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (msgRes.ok) {
                    const msgData = await msgRes.json();
                    const messages = msgData.messages || [];

                    const messagesToInsert = messages.map(m => {
                        const isMe = String(m.author_id) === finalUserId;
                        return {
                            chat_id: chatParams.id, // UUID
                            external_id: String(m.id),
                            text: m.content?.type === 'text' ? m.content.text : '[Вложение]',
                            sender: isMe ? 'shop' : 'client',
                            is_read: true,
                            created_at: new Date(m.created * 1000).toISOString()
                        };
                    });

                    if (messagesToInsert.length > 0) {
                        const { error: msgErr } = await supabaseClient
                            .from('platform_messages')
                            .upsert(messagesToInsert, { onConflict: 'chat_id, external_id' });

                        if (msgErr) console.error('Msg Sync Error', msgErr);
                    }
                }
            }

            return new Response(JSON.stringify({ success: true, synced: syncedCount }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // Action: Send Message
        if (action === 'send_message') {
            if (!chatId || !text) throw new Error('Missing chatId or text')

            // Resolving internal chat_id to external_id (Avito Chat ID)
            const { data: chatData, error: chatError } = await supabaseClient
                .from('platform_chats')
                .select('external_id')
                .eq('id', chatId)
                .single()

            if (chatError || !chatData) throw new Error('Chat not found in DB')
            const avitoChatId = chatData.external_id;

            const token = await getAccessToken();

            // Real API Call
            const sendRes = await fetch(`https://api.avito.ru/messenger/v1/accounts/${user_id}/chats/${avitoChatId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: { text },
                    type: 'text'
                })
            });

            if (!sendRes.ok) {
                const errText = await sendRes.text()
                throw new Error(`Avito Send Failed: ${errText}`)
            }

            const sendData = await sendRes.json();

            // Save to DB
            const { data: msg, error: msgError } = await supabaseClient
                .from('platform_messages')
                .insert({
                    chat_id: chatId,
                    text: text,
                    sender: 'shop',
                    is_read: true,
                    // external_id: sendData.id, // If Avito returns ID, utilize it.
                    created_at: new Date().toISOString()
                })
                .select()
                .single()

            return new Response(JSON.stringify({ success: true, message: msg, avito_response: sendData }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // Action: Webhook (Incoming Message)
        if (type === 'message' && payload?.value) {
            const msgData = payload.value;
            const content = msgData.content;

            if (content.type === 'text') {
                const externalChatId = msgData.chatId;
                const externalMsgId = msgData.id;
                const text = content.text;
                const authorId = msgData.authorId;
                const created = msgData.created; // timestamp

                // Check if message from ME (shop) or Client?
                // Avito webhook includes 'authorId'. We should check if authorId == user_id (our config user_id).
                // But for now, user_id is in DB, let's just assume if it comes to webhook and we didn't send it via API just now, it's a new message.
                // Better: Check if authorId is NOT our user_id.

                // Hack: We need user_id to compare. 
                // We'll fetch config again inside webhook path, strictly speaking not efficient but safe.
                const { data: integration } = await supabaseClient
                    .from('integrations')
                    .select('config')
                    .eq('service', 'avito')
                    .single()
                const myUserId = integration?.config?.user_id;
                const isMe = String(authorId) === String(myUserId);

                // 1. Find or Create Chat
                let { data: chat } = await supabaseClient
                    .from('platform_chats')
                    .select('id')
                    .eq('external_id', String(externalChatId))
                    .eq('platform', 'avito')
                    .single();

                if (!chat) {
                    // Create new chat
                    const { data: newChat } = await supabaseClient
                        .from('platform_chats')
                        .insert({
                            platform: 'avito',
                            external_id: String(externalChatId),
                            client_name: `Avito User ${authorId}`,
                            last_message: text,
                            updated_at: new Date().toISOString()
                        })
                        .select()
                        .single();
                    chat = newChat;
                } else {
                    // Update last message
                    await supabaseClient
                        .from('platform_chats')
                        .update({ last_message: text, updated_at: new Date().toISOString() })
                        .eq('id', chat.id);
                }

                if (chat) {
                    // 2. Insert Message
                    // Check deduplication by external_id
                    const { count } = await supabaseClient.from('platform_messages').select('id', { count: 'exact', head: true }).eq('external_id', String(externalMsgId));

                    if (count === 0) {
                        const { error: insertError } = await supabaseClient
                            .from('platform_messages')
                            .insert({
                                chat_id: chat.id,
                                text: text,
                                sender: isMe ? 'shop' : 'client',
                                is_read: false,
                                external_id: String(externalMsgId),
                                created_at: new Date(created * 1000).toISOString()
                            });

                        if (insertError) console.error("Msg Insert Error:", insertError);
                    }
                }
            }
            return new Response('ok', { headers: corsHeaders });
        }

        return new Response(JSON.stringify({ error: 'Unknown action' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })

    } catch (error) {
        console.error("Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
