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

        const { action, ...payload } = await req.json().catch(() => ({}))

        // 1. Get Credentials
        const { data: integration, error: intError } = await supabaseClient
            .from('integrations')
            .select('config')
            .eq('service', 'dbm')
            .single()

        if (intError || !integration) throw new Error('DBM integration not found')

        const config = integration.config
        const { api_key, base_url } = config
        const BASE_URL = base_url || 'https://desslyhub.com/api/v1'

        const headers = {
            'apikey': api_key,
            'Content-Type': 'application/json'
        }

        let endpoint = '';
        let method = 'GET';
        let body = null;

        switch (action) {
            case 'get_balance':
                endpoint = '/merchants/balance';
                break;
            case 'get_transactions':
                endpoint = `/merchants/transactions?page=${payload.page || 1}`;
                break;
            case 'get_vouchers':
                endpoint = '/service/voucher/products';
                break;
            case 'get_steam_games':
                endpoint = '/service/steamgift/games';
                break;
            case 'buy_voucher':
                endpoint = '/service/voucher/buy';
                method = 'POST';
                body = payload;
                break;
            case 'buy_steam_gift':
                endpoint = '/service/steamgift/gift';
                method = 'POST';
                body = payload;
                break;
            case 'steam_refill':
                endpoint = '/steam/refill';
                method = 'POST';
                body = payload;
                break;
            default:
                throw new Error(`Unknown action: ${action}`);
        }

        console.log(`DBM Request: ${method} ${BASE_URL}${endpoint}`);

        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            console.error('DBM Error', data);
            return new Response(JSON.stringify({ error: data.message || 'DBM API Error' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
