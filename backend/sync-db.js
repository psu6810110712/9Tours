const { Client } = require('pg');

async function sync() {
    const client = new Client({
        user: 'init',
        host: 'localhost',
        database: '9tours_db',
        password: 'mysecretpassword',
        port: 5432,
    });
    await client.connect();
    console.log('Adding special_request column...');
    await client.query('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS special_request text;');
    console.log('Done!');
    await client.end();
}

sync();
