import fetch from 'node-fetch';

const API_KEY = 'ACMA:vJr9yUUaTRND9LGMoBWv4uceyaHJ6eJLtmpNMBzO:106c19a6';
const BUSINESS_ID = '216514292';
const CHAT_ID = '11870774';
const HEADERS = {
    'Api-Key': API_KEY,
    'Content-Type': 'application/json',
};

async function exploreMessages() {
    console.log(`💬 Fetching messages for Chat ${CHAT_ID}...`);
    const url = `https://api.partner.market.yandex.ru/v2/businesses/${BUSINESS_ID}/chats/${CHAT_ID}/messages`;
    const res = await fetch(url, { headers: HEADERS });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
}

exploreMessages();
