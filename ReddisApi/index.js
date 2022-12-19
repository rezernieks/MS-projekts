const redis = require('redis');
const express = require('express');
//const client = redis.createClient();
const app = express();
const bodyParser = require('body-parser');
const PORT = 6379;

const getClient = async () => {
    const client = redis.createClient()
    client.on("error", function(error) {
        console.error(error);
    })
    client.on('connect', () => {
        console.log('redis connected', new Date().toISOString());
    });
    await client.connect()
    return client
}

/*client.on("error", function(error) {
    console.error(error);
})
client.connect();*/
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.get('/redis/get/:key', function (req, res) {
    client.get(req.params.key, function(err, reply) {
        res.status(200).send({
            message: reply
        });
    });
    client.del(req.params.key);
})

app.post('/redis/set', async function (req, res) {
    const client = await getClient()
    await client.set(req.body.key, req.body.value)
    res.end("OK");
})

app.listen(PORT, () => {
    console.log("App listening on port 6379");
})


