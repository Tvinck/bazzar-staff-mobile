import fetch from 'node-fetch';

const API_KEY = 'ACMA:vJr9yUUaTRND9LGMoBWv4uceyaHJ6eJLtmpNMBzO:106c19a6';
const BUSINESS_ID = '216514292';
const CHAT_ID = '11870774';
const HEADERS = {
    'Api-Key': API_KEY,
    'Content-Type': 'application/json',
};

async function exploreChat() {
    const url = `https://api.partner.market.yandex.ru/v2/businesses/${BUSINESS_ID}/chats/${CHAT_ID}`;
    console.log(`🔍 GET ${url}`);
    const res = await fetch(url, { headers: HEADERS });
    console.log(`Status: ${res.status}`);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
}

exploreChat();
