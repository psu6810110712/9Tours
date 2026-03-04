
const { Client } = require('pg');
const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'init',
    password: 'secret',
    database: '9tours_db',
});
client.connect()
    .then(() => {
        console.log('Connected successfully');
        process.exit(0);
    })
    .catch(err => {
        console.error('Connection error', err.stack);
        process.exit(1);
    });
