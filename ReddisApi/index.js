const redis = require('redis');
const client = redis.createClient({ url: 'redis://redis:6379' });
client.on("error", (error) => console.error(error));
client.on('connect', () => console.log('redis connected', new Date().toISOString()));
client.connect();

const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/redis/get/:key', async function (req, res) {
    console.log(`GET ${req.params.key}`);
    const value = await client.get(req.params.key);
    res.status(200).send({
        message: value
    });
    await client.del(req.params.key);
})

app.post('/redis/set', async function (req, res) {
    console.log(`POST ${req.body.key} : ${req.body.value}`);
    await client.set(req.body.key, req.body.value)
    res.end("OK");
})

app.listen(3003, () => {
    console.log("App listening on port 6379");
})


