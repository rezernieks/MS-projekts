const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const amqp = require('amqplib/callback_api');

const Minio = require('minio')
const minioClient = new Minio.Client({
    endPoint: '127.0.0.1',
    port: 9000,
    useSSL: false,
    accessKey: 'minio-root',
    secretKey: 'M@k0nsk@it1os@na'});

console.log("initiated");
app.listen(3000, () => {
    console.log("App listening on port 3000")
})
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.post('/get_photo', function(req, res) {
    res.setHeader('Content-Type', 'text/plain')
    res.write('your name:\n')
    console.log(req.body["filename"]);
    minioClient.fGetObject('cars', req.body["filename"], '/tmp/photo.jpg', function(err) {
        if (err) {
            return console.log(err)
        }
        console.log('success')
    })
    res.end(JSON.stringify(req.body.name))
})
app.post('/post_photo', function(req, res) {
    res.setHeader('Content-Type', 'text/plain')
    res.write('your name:\n')
    console.log(req.body["filename"]);
    filename = "Gabriel.webp"
    minioClient.fPutObject('cars', filename, './h786poj.jpg', function (err, etag) {
        if (err) return console.log(err)
        console.log('File uploaded successfully.')
    });

    amqp.connect('amqp://127.0.0.1:15672', function(error0, connection) {
        if (error0) { throw error0; }
        connection.createChannel(function(error1, channel) {
            if (error1) {
                throw error1;
            }
            var queue = 'my-queue';
            var data = {
                "name": "janis",
                "phone": 1234
            };
            var msg = JSON.stringify(data);
            channel.assertQueue(queue, {
                durable: true
            });
            channel.sendToQueue(queue, Buffer.from
            (msg)); console.log(" [x] Sent %s", msg);
        });
    });

    res.end(JSON.stringify(req.body.name))
})
