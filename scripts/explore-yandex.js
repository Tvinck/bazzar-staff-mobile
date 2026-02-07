import fetch from 'node-fetch';

const API_KEY = 'ACMA:vJr9yUUaTRND9LGMoBWv4uceyaHJ6eJLtmpNMBzO:106c19a6';
const HEADERS = {
    'Api-Key': API_KEY,
    'Content-Type': 'application/json',
};

async function explore() {
    console.log('🔍 Exploring Yandex API...');

    // 1. Get campaigns
    const campRes = await fetch('https://api.partner.market.yandex.ru/v2/campaigns.json', { headers: HEADERS });
    const camps = await campRes.json();
    console.log('📋 Campaigns:', JSON.stringify(camps, null, 2));

    if (camps.campaigns) {
        for (const c of camps.campaigns) {
            console.log(`\n--- Store: ${c.domain} (ID: ${c.id}, Business: ${c.business?.id}) ---`);

            // Try get chats for this business
            if (c.business?.id) {
                console.log(`💬 Fetching chats for Business ${c.business.id}...`);
                const chatRes = await fetch(`https://api.partner.market.yandex.ru/v2/businesses/${c.business.id}/chats`, {
                    method: 'POST',
                    headers: HEADERS,
                    body: JSON.stringify({}) // Empty filter
                });
                const chats = await chatRes.json();
                console.log(`   Found: ${chats.result?.chats?.length || 0} chats`);
                console.log(JSON.stringify(chats, null, 2));
            }
        }
    }
}

explore();
