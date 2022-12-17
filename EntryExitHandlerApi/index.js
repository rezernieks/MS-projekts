const express = require('express')
const fileUpload = require('express-fileupload');
const app = express()
const bodyParser = require('body-parser');
const amqp = require('amqplib/callback_api');

const rabbitmq_username = 'rabbit-bunny';
const rabbitmq_password = 'M@k0nsk@it1os@na';
const rabbitmq_url = '127.0.0.1:5672';

const Minio = require('minio')
const minioClient = new Minio.Client({
    endPoint: '127.0.0.1',
    port: 9000,
    useSSL: false,
    accessKey: 'minio-root',
    secretKey: 'M@k0nsk@it1os@na'});

function rabbitsender(data){
    amqp.connect(`amqp://${rabbitmq_username}:${rabbitmq_password}@${rabbitmq_url}`, function(error0, connection) {
        if (error0) { throw error0; }
        connection.createChannel(function(error1, channel) {
            if (error1) {
                throw error1;
            }
            let queue = 'car-queue';

            let msg = JSON.stringify(data);
            channel.assertQueue(queue, {
                durable: true
            });
            channel.sendToQueue(queue, Buffer.from
            (msg)); console.log(" [x] Sent %s", msg);
        });
    });
}

function rabbitreceiver(){
    amqp.connect(`amqp://${rabbitmq_username}:${rabbitmq_password}@${rabbitmq_url}`, function(error0, connection) {
        if (error0) {
            throw error0;
        }
        connection.createChannel(function(error1, channel) {
            if (error1) {
                throw error1;
            }
            let queue = 'car-queue';
            channel.assertQueue(queue, {
                durable: true
            });
            console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);
            channel.consume(queue, function(msg) {
                console.log(" [x] Received %s", msg.content.toString());
                let json_data = JSON.parse(msg.content);
                console.log("name is " +json_data.name);
            }, {
                noAck: true
            });
        });
    });
}

function minioget(filename, path){
    minioClient.fGetObject('cars', filename, path, function(err) {
        if (err) {
            return console.log(err)
        }
        console.log('success')
    })
}

function minioput(filename, path){
    minioClient.fPutObject('cars', filename, path, function (err, etag) {
        if (err) return console.log(err)
        console.log('File uploaded successfully.')
    });
}

app.listen(3000, () => {
    console.log("App listening on port 3000")
})
app.use(
    fileUpload({
        limits: {
            fileSize: 10000000,
        },
        abortOnLimit: true,
    })
);
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.post('/get_photo', function(req, res) {
    res.setHeader('Content-Type', 'text/plain')
    console.log(req.body["filename"]);
    minioget(req.body["filename"], '/tmp/photo.jpg')

    res.end(JSON.stringify(req.body.name))
})


app.post('/post_incoming', function(req, res) {
    res.setHeader('Content-Type', 'text/plain')
    res.write('your name:\n')
    console.log(req.body["filename"]);
    minioput(req.body["filename"], './h786poj.jpg')

    let data = {
        "filename": req.body["filename"],
        "incoming": true
    };
    rabbitsender(data)

    res.end(JSON.stringify(req.body.name))
})


app.post('/post_outcoming', function(req, res) {
    res.setHeader('Content-Type', 'text/plain')
    res.write('your name:\n')
    let filename = req.body["filename"]
    console.log(filename);
    minioput(filename, `./${filename}`)

    let data = {
        "filename": filename,
        "incoming": false
    };
    rabbitsender(data)

    res.end(JSON.stringify(req.body.name))
})
