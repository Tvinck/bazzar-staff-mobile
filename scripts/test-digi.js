import fetch from 'node-fetch';
import crypto from 'crypto';

async function test() {
    const API_KEY = '61223F5A90844BBEBFAEAB07D162F9F0';
    const SELLER_ID = '1140096';
    const timestamp = Math.floor(Date.now() / 1000);
    const sign = crypto.createHash('sha256').update(API_KEY + timestamp).digest('hex');

    console.log('Testing Digiseller Auth...');
    const res = await fetch('https://api.digiseller.com/api/apilogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ seller_id: SELLER_ID, timestamp, sign })
    });
    const data = await res.json();
    console.log('Auth result:', data);

    if (data.token) {
        // Test sales with longer range (30 days)
        const date_start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').split('.')[0];
        const date_finish = new Date().toISOString().replace('T', ' ').split('.')[0];

        console.log(`Checking sales from ${date_start} to ${date_finish}...`);
        const sres = await fetch(`https://api.digiseller.com/api/seller-sells/v2?token=${data.token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date_start, date_finish, page: 1, rows: 5 })
        });
        const sdata = await sres.json();
        console.log('Sales raw response:', JSON.stringify(sdata));

        console.log('Checking chats...');
        const cres = await fetch(`https://api.digiseller.com/api/debates/v2/chats?token=${data.token}&page=1&rows=5`);
        const cdata = await cres.json();
        console.log('Chats raw response:', JSON.stringify(cdata).slice(0, 500));
    }
}

test();
