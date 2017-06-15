const pg = require('pg');
const client = new pg.Client('postgres://localhost/twitterdb');

client.connect((err, client) => {
    if (err) {
        console.log(err);
        process.exit();
    }
});

module.exports = client;