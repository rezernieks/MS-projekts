const fs = require('fs');
const util = require('util');
const minio = require('minio');
const amqp = require('amqplib/callback_api');
const nodemailer = require('nodemailer');
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

const localFilePath = (fileName) => `images/${fileName}`;

const handleObject = async (objectName, imageType, date) => {
    const numberPlate = await downloadObject(objectName)
        .then(() => recognizeNumber(localFilePath(objectName)))
        .then((alprResult) => {
            const results = JSON.parse(alprResult.stdout.toString()).results;

            if (results && results.length > 0)
                return results[0].plate;

            return null;
        });

    if (numberPlate)
        console.log(`[${objectName}]: Plate is ${numberPlate}`);
    else
        console.log(`[${objectName}]: Plate unrecognized`);

    deleteFile(objectName).then(() => console.log(`[${objectName}] delete operation has been finished.`));

    if (!numberPlate)
        return;

    if (imageType === 'in') {
        await createRecord(numberPlate, date);
        return;
    }

    const recordValue = await getRecordValue(numberPlate);

    if (!recordValue) {
        await sendNotification(
            `The car left at ${date.getHours()}:${date.getMinutes()}, the arrival was not recorded`
        );
        return;
    }

    const dateDiffMs = date.getTime() - recordValue.getTime();
    const dateDiffMin = dateDiffMs / 60000;
    await sendNotification(
        `The car left at ${date.getHours()}:${date.getMinutes()} and stayed there for ${dateDiffMin} minutes`
    );
}

const downloadObject = async (objectName) => {
    return minioClient.fGetObject('test', objectName, `images/${objectName}`);
}

const recognizeNumber = async (fileName) => {
    return exec(`alpr -c eu -p lv -j ${fileName}`);
}

const deleteFile = async (fileName) => {
    minioClient.removeObject('test', fileName, (err) => {
        if (err)
            console.log(`[${fileName}] error while deleting from Minio: ${err}`);
        else
            console.log(`[${fileName}] deleted from Minio`);
    })

    fs.unlink(localFilePath(fileName), (err) => {
        if (err)
            console.log(`[${fileName}] error while deleting local storage: ${err}`);
        else
            console.log(`[${fileName}] deleted from local storage`);
    })
}

const getRecordValue = async (key) => {
    // TODO: Get record from Redis
    // TODO: Delete record from Redis (delete on Redis service side?)
    return new Date();
}

const createRecord = async (key, val) => {
    // TODO: Add record to Redis
}

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

// Loop
amqp.connect('amqp://rabbit-bunny:M@k0nsk@it1os@na@rabbitmq:5672', (error0, connection) => {
    if (error0) throw error0;

    connection.createChannel((error1, channel) => {
        if (error1) throw error1;

        const queueName = 'test';

        channel.assertQueue(queueName, { durable: true });

        console.log(`Waiting for messages in queue "${queueName}". To exit press CTRL+C`);

        channel.consume(
            queueName,
            (message) => {
                const jsonData = JSON.parse(message.content);
                handleObject(jsonData.fileName);
            },
            { noAck: true }
        );
    });
});