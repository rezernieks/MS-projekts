const fs = require("fs");
const express = require('express');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const amqp = require('amqplib/callback_api');
const minio = require('minio');

const app = express();

const minioClient = new minio.Client({
    endPoint: 'minio',
    port: 9000,
    useSSL: false,
    accessKey: 'minio-root',
    secretKey: 'M@k0nsk@it1os@na'
});

const rabbitmq_username = 'rabbit-bunny';
const rabbitmq_password = 'M@k0nsk@it1os@na';
const rabbitmq_url = 'rabbitmq:5672';

function rabbit_sender(data){
    amqp.connect(`amqp://${rabbitmq_username}:${rabbitmq_password}@${rabbitmq_url}`, function(error0, connection) {
        if (error0) throw error0;

        connection.createChannel(function(error1, channel) {
            if (error1) throw error1;

            let queue = 'car-queue';

            let msg = JSON.stringify(data);

            channel.assertQueue(queue, { durable: true });
            channel.sendToQueue(queue, Buffer.from(msg));

            console.log(`Sent message ${msg} to RabbitMQ...`);
        });
    });
}

async function minio_put(filename, path){
    minioClient.fPutObject('cars', filename, path, function (err) {
        if (err) return console.log(err);
        console.log(`[${filename}] uploaded to minio successfully.`);
        fs.unlink(path, (err) => {
            if (err) throw err;
            console.log(`[${filename}] deleted from local storage successfully.`);
        })
    });
}

async function upload_photo(image, filename) {
    console.log(`[${filename}] uploading in server storage...`);

    if (!fs.existsSync('tmp')){
        fs.mkdirSync('tmp');
    }
    const path = `tmp/${filename}`;
    await image.mv(path);

    console.log(`[${filename}] uploading to minio...`);

    await minio_put(filename, path);
}

app.use(fileUpload());
app.use(bodyParser.urlencoded({ extended: true, limit : '100mb'}))
app.use(bodyParser.json({limit : '100mb'}))

app.post('/post_incoming', async function (req, res) {
    const image = req.files.image;
    if (!image) return;

    let filename = req.files.image.name;

    console.log(`POST incoming car plate ${filename}`);

    await upload_photo(image, filename)

    let data = {
        "filename": filename,
        "incoming": true
    };

    rabbit_sender(data)

    res.end('Ok. Incoming plate image posted.')
})

app.post('/post_outcoming', async function (req, res) {
    const image = req.files.image;
    if (!image) return;

    let filename = req.files.image.name;

    console.log(`POST outcoming car plate ${filename}`);

    await upload_photo(image, filename)

    let data = {
        "filename": filename,
        "incoming": false
    };

    rabbit_sender(data)

    res.end('Ok. Outcoming plate image posted.')
})

app.listen(3000, () => {
    console.log("App listening on port 3000")
})