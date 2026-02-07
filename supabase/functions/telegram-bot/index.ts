import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '', // Use Service Role if modifying logic requires it, but for now anon + RLS or standard flow. Wait, to update profiles I might need secure access if RLS blocks anon. I'll use service role key for the bot function to ensure it can update profiles.
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // Actually for backend tasks like this, it's better to use the Service Role Key
        // to bypass RLS, especially for checking Integrations and updating Profiles from a bot context.
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Get Bot Config
        const { data: integration, error: intError } = await supabaseAdmin
            .from('integrations')
            .select('config')
            .eq('service', 'telegram_bot')
            .single()

        if (intError || !integration) {
            console.error('Telegram integration not found')
            return new Response(JSON.stringify({ error: 'Telegram integration not found' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500
            })
        }

        const { token, bot_name } = integration.config
        if (!token || token === 'YOUR_BOT_TOKEN') {
            return new Response(JSON.stringify({ error: 'Bot token not configured' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500
            })
        }

        const reqData = await req.json()

        // CASE 1: Webhook from Telegram (Incoming Message)
        if (reqData.update_id && reqData.message) {
            const msg = reqData.message
            const chatId = msg.chat.id
            const text = msg.text || ''

            if (text.startsWith('/start')) {
                const args = text.split(' ')
                if (args.length > 1) {
                    const userId = args[1].trim()

                    // Validate UUID format
                    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
                    if (uuidRegex.test(userId)) {
                        // Update Profile
                        const { error: updateError } = await supabaseAdmin
                            .from('profiles')
                            .update({ telegram_chat_id: String(chatId) })
                            .eq('id', userId)

                        if (!updateError) {
                            await sendTelegramMessage(token, chatId, "✅ Уведомления успешно подключены! Теперь вы будете получать оповещения о новых заказах.")
                        } else {
                            await sendTelegramMessage(token, chatId, "❌ Ошибка при привязке аккаунта. Попробуйте снова.")
                            console.error('Update error:', updateError)
                        }
                    } else {
                        await sendTelegramMessage(token, chatId, "⚠️ Неверная ссылка привязки.")
                    }
                } else {
                    await sendTelegramMessage(token, chatId, "Привет! Для подключения уведомлений используйте кнопку 'Подключить Telegram' в приложении Bazzar Staff.")
                }
            }
            return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // CASE 2: Internal Action (Send Notification)
        if (reqData.action === 'notify_user') {
            const { user_id, message } = reqData
            if (!user_id || !message) throw new Error('Missing user_id or message')

            // Get chat_id
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('telegram_chat_id')
                .eq('id', user_id)
                .single()

            if (profile?.telegram_chat_id) {
                await sendTelegramMessage(token, profile.telegram_chat_id, message)
                return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            } else {
                return new Response(JSON.stringify({ success: false, error: 'User has no telegram_chat_id' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }
        }

        // CASE 3: Notify All Staff
        if (reqData.action === 'notify_all_staff') {
            const { message } = reqData
            if (!message) throw new Error('Missing message')

            // Fetch all users with telegram_chat_id and telegram_notifications != false
            const { data: profiles, error: pError } = await supabaseAdmin
                .from('profiles')
                .select('telegram_chat_id')
                .not('telegram_chat_id', 'is', null)
            // We can check role or notifications preference here. 
            // Assuming all staff with linked telegram want order updates for now.
            // .eq('telegram_notifications', true) 

            if (pError) throw pError

            const results = []
            for (const p of profiles || []) {
                if (p.telegram_chat_id) {
                    // Send in parallel or series? Series is safer for rate limits, but slow.
                    // For few staff, parallel is fine.
                    results.push(sendTelegramMessage(token, p.telegram_chat_id, message))
                }
            }

            await Promise.allSettled(results)

            return new Response(JSON.stringify({ success: true, count: results.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // CASE 4: Get Bot Info
        if (reqData.action === 'get_bot_info') {
            return new Response(JSON.stringify({ bot_name: bot_name || 'YourBot' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // CASE 3: Broadcast (Notify all staff?) or Group Chat
        // For now, keeping it simple.

        return new Response(JSON.stringify({ error: 'Unknown action' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
        })

    } catch (error) {
        console.error(error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})

async function sendTelegramMessage(token: string, chatId: string | number, text: string) {
    const url = `https://api.telegram.org/bot${token}/sendMessage`
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML'
        })
    })
    return res.json()
}
