const redis = require('redis');
const express = require('express');
const client = redis.createClient();
const app = express();

const PORT = 6379;
const HOST = '127.0.0.1';
client.on("error", function(error) {
    console.error(error);
})

app.get('/redis/get/:key', function (req, res) {
    client.get(req.params.key, function(err, reply) {
        res.status(200).send({
            message: "Value from redis:" + reply
        });
    });
    app.delete('/redis/get/:key');
})

app.post('/redis/set', function (req, res) {
    client.set(req.body.key, req.body.value, redis.print);
    res.end("OK");
})

app.listen(PORT, HOST,() => {
    console.log("App listening on port 6379");
})


