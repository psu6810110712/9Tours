const { Client } = require('pg');
const fs = require('fs');

async function test() {
    const client = new Client({
        user: 'init',
        host: 'localhost',
        database: '9tours_db',
        password: 'mysecretpassword',
        port: 5432,
    });
    await client.connect();
    const res = await client.query('SELECT column_name FROM information_schema.columns WHERE table_name = $1', ['bookings']);
    fs.writeFileSync('db-cols.json', JSON.stringify(res.rows.map(r => r.column_name), null, 2));
    await client.end();
}

test();
