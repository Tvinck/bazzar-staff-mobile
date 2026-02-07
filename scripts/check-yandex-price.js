import fetch from 'node-fetch';

const API_KEY = 'ACMA:vJr9yUUaTRND9LGMoBWv4uceyaHJ6eJLtmpNMBzO:106c19a6';
const CAMPAIGN_ID = '148917824';
const HEADERS = {
    'Api-Key': API_KEY,
    'Content-Type': 'application/json',
};

async function checkOrderFields() {
    const url = `https://api.partner.market.yandex.ru/v2/campaigns/${CAMPAIGN_ID}/orders.json?status=DELIVERED&limit=1`;
    const res = await fetch(url, { headers: HEADERS });
    const data = await res.json();
    if (data.orders && data.orders.length > 0) {
        const order = data.orders[0];
        console.log('Order keys:', Object.keys(order));
        console.log('Total:', order.total);
        console.log('Buyer Total:', order.buyerTotal);
        console.log('Items Total:', order.itemsTotal);
        console.log('Sample Order:', JSON.stringify(order, null, 2));
    }
}

checkOrderFields();
