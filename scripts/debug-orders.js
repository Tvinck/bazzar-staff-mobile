import fetch from 'node-fetch';

const API_KEY = 'ACMA:vJr9yUUaTRND9LGMoBWv4uceyaHJ6eJLtmpNMBzO:106c19a6';
const CAMPAIGN_ID = '148917824';
const HEADERS = {
    'Api-Key': API_KEY,
    'Content-Type': 'application/json',
};

async function checkOrders() {
    const statuses = 'UNPAID,PROCESSING,DELIVERY,PICKUP,DELIVERED,CANCELLED';
    const url = `https://api.partner.market.yandex.ru/v2/campaigns/${CAMPAIGN_ID}/orders.json?status=${statuses}&limit=20`;
    console.log(`🔍 GET ${url}`);
    const res = await fetch(url, { headers: HEADERS });
    console.log(`Status: ${res.status}`);
    const data = await res.json();
    console.log(`Orders found: ${data.orders?.length || 0}`);
    if (data.orders && data.orders.length > 0) {
        console.log('First order ID:', data.orders[0].id);
    } else {
        console.log('Full response:', JSON.stringify(data, null, 2));
    }
}

checkOrders();
