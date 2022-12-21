const fs = require('fs');
const util = require('util');
const minio = require('minio');
const amqp = require('amqplib/callback_api');
const nodemailer = require('nodemailer');
const axios = require("axios");
const exec = util.promisify(require('child_process').exec);

const minioClient = new minio.Client({
    endPoint: 'minio',
    port: 9000,
    useSSL: false,
    accessKey: 'minio-root',
    secretKey: 'M@k0nsk@it1os@na'
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'number.recognizer.worker@gmail.com',
        pass: 'tbdilvarokujrvsy'
    }
});

// file path in local storage
const localFilePath = (filename) => `images/${filename}`;

const handleImage = async (filename, isIncoming) => {
    const numberPlate = await downloadImage(filename)
        .then(() => recognizeNumber(localFilePath(filename)))
        .then((alprResult) => {
            const results = JSON.parse(alprResult.stdout.toString()).results;

            if (results && results.length > 0)
                return results[0].plate;

            return null;
        });

    if (numberPlate)
        console.log(`[${filename}]: Plate is ${numberPlate}`);
    else
        console.log(`[${filename}]: Plate unrecognized`);

    deleteFile(filename).then(() => console.log(`[${filename}] delete operation has been finished.`));

    if (!numberPlate)
        return;

    const currentDate = new Date();

    if (isIncoming) {
        await createRecord(numberPlate, currentDate);
        console.log(`[${filename}]: The arrival of the car with the number ${numberPlate} fixed`);
        return;
    }

    const recordValue = await getRecordValue(numberPlate);
    console.log(`[${filename}]: The departure of the car with the number ${numberPlate} fixed`);

    if (!recordValue) {
        await sendNotification(
            `The car left at ${recordValue.getHours()}:${recordValue.getMinutes()}, the arrival was not recorded`
        );
        return;
    }

    const dateDiffMs = currentDate.getTime() - recordValue.getTime();
    const dateDiffMin = dateDiffMs / 60000;
    await sendNotification(
        `The car with plate "${numberPlate}" left at ${currentDate.getHours()}:${currentDate.getMinutes()} and `+
        `stayed there for ${dateDiffMin} minutes (${dateDiffMs} ms)`
    );
}

const downloadImage = async (objectName) => {
    return minioClient.fGetObject('cars', objectName, `images/${objectName}`);
}

// aplr cmd
const recognizeNumber = async (fileName) => {
    return exec(`alpr -c eu -p lv -j ${fileName}`);
}

// Delete file from minio and local storage
const deleteFile = async (filename) => {
    minioClient.removeObject('cars', filename, (err) => {
        if (err)
            console.log(`[${filename}] error while deleting from Minio: ${err}`);
        else
            console.log(`[${filename}] deleted from Minio`);
    })

    fs.unlink(localFilePath(filename), (err) => {
        if (err)
            console.log(`[${filename}] error while deleting local storage: ${err}`);
        else
            console.log(`[${filename}] deleted from local storage`);
    })
}

// Redis API start
const getRecordValue = async (key) => {
    const response = await axios.get(`http://redis_api:3003/redis/get/${key}`);
    return new Date(response.data.value);
}

const createRecord = async (key, value) => {
    await axios.post('http://redis_api:3003/redis/set', {
        "key": key,
        "value": value
    });
}
// Redis API end

// Email sending
const sendNotification = async (msg) => {
    const mailOptions = {
        from: 'number.recognizer.worker@gmail.com',
        to: 'kirill.dobrynin78@gmail.com',
        subject: 'Notification about exit',
        text: msg
    };

    await transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

// RabbitMQ listener loop
amqp.connect('amqp://rabbit-bunny:M@k0nsk@it1os@na@rabbitmq:5672', (error0, connection) => {
    if (error0) throw error0;

    connection.createChannel(async (error1, channel) => {
        if (error1) throw error1;

        const queueName = 'car-queue';

        channel.assertQueue(queueName, { durable: true });

        console.log(`Waiting for messages in queue "${queueName}". To exit press CTRL+C`);

        channel.consume(
            queueName,
            (message) => {
                const jsonData = JSON.parse(message.content);
                handleImage(jsonData.filename, jsonData.incoming);
            },
            { noAck: true }
        );
    });
});