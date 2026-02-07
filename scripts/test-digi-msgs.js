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

    if (data.token) {
        const id_i = '276082864';
        console.log(`Checking messages for chat ${id_i}...`);
        const msgRes = await fetch(`https://api.digiseller.com/api/debates/v2?token=${data.token}&id_i=${id_i}`);
        const msgData = await msgRes.json();
        console.log('Messages response:', JSON.stringify(msgData));
    }
}

test();
