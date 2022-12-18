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

function rabbit_sender(data){
    amqp.connect(`amqp://${rabbitmq_username}:${rabbitmq_password}@${rabbitmq_url}`, function(error0, connection) {
        console.log("4");
        if (error0) { throw error0; }
        connection.createChannel(function(error1, channel) {
            console.log("5");
            if (error1) {
                throw error1;
            }
            let queue = 'car-queue';

            let msg = JSON.stringify(data);
            console.log("6");
            channel.assertQueue(queue, {
                durable: true
            });
            console.log("7");
            channel.sendToQueue(queue, Buffer.from
            (msg)); console.log(" [x] Sent %s", msg);
        });
    });
}

function minio_get(filename, path){
    minioClient.fGetObject('cars', filename, path, function(err) {
        if (err) {
            return console.log(err)
        }
        console.log('success')
    })
}

function minio_put(filename, path){
    minioClient.fPutObject('cars', filename, path, function (err, etag) {
        console.log("2");
        if (err) return console.log(err)
        console.log('File uploaded successfully.')
    });
}

app.listen(3000, () => {
    console.log("App listening on port 3000")
})
app.use(fileUpload());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.post('/get_photo', function(req, res) {
    res.setHeader('Content-Type', 'text/plain')
    let filename = req.body["filename"]
    console.log(filename);
    minio_get(filename, '/tmp/')

    res.end(JSON.stringify(req.body.name))
})


app.post('/post_incoming', function(req, res) {
    res.setHeader('Content-Type', 'text/plain')
    res.write('your name:\n')
    let filename = req.body["filename"]
    console.log(filename);
    minio_put(filename, `./${filename}`)

    let data = {
        "filename": filename,
        "incoming": true
    };
    rabbit_sender(data)

    res.end(JSON.stringify(req.body.name))
})


app.post('/post_outcoming', function(req, res) {
    let filename = req.body["filename"]
    console.log(filename);
    // Get the file that was set to our field named "image"
    const image = req.files.image;
    // If no image submitted, exit
    if (!image) return;

    console.log("1");
    image.mv(`C:/tmp/${filename}`, function (err) {
        if (err)
            console.log(err);
    }).then(r=>console.log('File uploaded!'));
    minio_put(filename, `C:/tmp/${filename}`)

    let data = {
        "filename": filename,
        "incoming": false
    };
    console.log("3");
    rabbit_sender(data)
    app.delete(`C:/tmp/${filename}`);

    res.end(JSON.stringify(req.body.filename))
})
