import fetch from 'node-fetch';

const API_KEY = 'ACMA:vJr9yUUaTRND9LGMoBWv4uceyaHJ6eJLtmpNMBzO:106c19a6';
const CAMPAIGN_ID = '148917824';
const CHAT_ID = '11870774';
const HEADERS = {
    'Api-Key': API_KEY,
    'Content-Type': 'application/json',
};

async function exploreMessages() {
    const urls = [
        `https://api.partner.market.yandex.ru/v2/businesses/216514292/chats/${CHAT_ID}/messages.json`,
        `https://api.partner.market.yandex.ru/v2/campaigns/${CAMPAIGN_ID}/chats/${CHAT_ID}/messages.json`,
        `https://api.partner.market.yandex.ru/v2/campaigns/${CAMPAIGN_ID}/chats/${CHAT_ID}/messages`,
    ];

    for (const url of urls) {
        console.log(`🔍 Testing URL: ${url}`);
        const res = await fetch(url, { headers: HEADERS });
        console.log(`   Status: ${res.status}`);
        if (res.ok) {
            const data = await res.json();
            console.log(`   Success! Keys: ${Object.keys(data)}`);
            if (data.result) console.log(`   Result Keys: ${Object.keys(data.result)}`);
        }
    }
}

exploreMessages();
