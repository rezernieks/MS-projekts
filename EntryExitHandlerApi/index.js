const express = require('express')
const fileUpload = require('express-fileupload');
const app = express()
const bodyParser = require('body-parser');
const amqp = require('amqplib/callback_api');

const rabbitmq_username = 'rabbit-bunny';
const rabbitmq_password = 'M@k0nsk@it1os@na';
const rabbitmq_url = '127.0.0.1:5672';

const Minio = require('minio')
const fs = require("fs");
const minioClient = new Minio.Client({
    endPoint: '127.0.0.1',
    port: 9000,
    useSSL: false,
    accessKey: 'minio-root',
    secretKey: 'M@k0nsk@it1os@na'});



function rabbit_sender(data){
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

async function minio_put(filename, path){
    minioClient.fPutObject('cars', filename, path, function (err) {
        if (err) return console.log(err)
        console.log('File uploaded successfully.')
        fs.unlink(path, (err) => {
            if (err) {
                throw err;
            }
            console.log("Delete File successfully.");
        })
    });
}

async function upload_photo(image, filename, path) {
    await image.mv(path, async function (err) {
        if (err)
            console.log(err);
        await minio_put(filename, path, function (err) {
            if (err) {
                throw err;
            }
        })

    });
}



app.listen(3000, () => {
    console.log("App listening on port 3000")
})
app.use(fileUpload());
app.use(bodyParser.urlencoded({ extended: true, limit : '100mb'}))
app.use(bodyParser.json({limit : '100mb'}))

app.post('/post_incoming', async function (req, res) {
    let filename = req.body["filename"]
    let path = __dirname + '/tmp/' + filename
    let data = {
        "filename": filename,
        "incoming": true
    };
    const image = req.files.image;
    if (!image) return;

    await upload_photo(image, filename, path)

    rabbit_sender(data)

    res.end(JSON.stringify(req.body.filename))
})


app.post('/post_outcoming', async function (req, res) {
    let filename = req.body["filename"]
    let path = __dirname + '/tmp/' + filename
    console.log(path)
    let data = {
        "filename": filename,
        "incoming": false
    };
    const image = req.files.image;
    if (!image) return;

    await upload_photo(image, filename, path)

    rabbit_sender(data)

    res.end(JSON.stringify(req.body.filename))
})
