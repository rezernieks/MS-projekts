const express = require('express')
const app = express()
const port = 3000
const bodyParser = require('body-parser');

//const Minio = require('minio')
//const minioClient = new Minio.Client({
//    endPoint: '127.0.0.1',
//    port: 9000,
//    useSSL: false,
//    accessKey: 'minio-root',
//    secretKey: 'M@k0nsk@it1os@na'});

console.log("initiated");

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.post('/', function(req, res) {
    res.setHeader('Content-Type', 'text/plain')
    res.write('your name:\n')
    console.log(req.body);
    //minioClient.fGetObject('cars', 'Gabriel.webp', '/tmp/photo.jpg', function(err) {
    //    if (err) {
    //        return console.log(err)
    //    }
    //    console.log('success')
    //})
    res.end(JSON.stringify(req.body.name))
})

