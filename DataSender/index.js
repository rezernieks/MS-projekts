const express = require('express');
const axios = require('axios');
const fs = require('fs');
const myParser = require('body-parser');

const app = express();

const MAX_IMG = 432;
const port = 3000;
app.use(myParser.json({limit: '200mb'}));
app.use(myParser.urlencoded({limit: '200mb', extended: true}));
app.use(express.json());

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);  
});
  
let intervalID = setInterval(() => {
    const img_n = Math.floor(Math.random() * MAX_IMG);
    const img = "data:image/png;base64," + fs.readFileSync(__dirname + `\\dataset\\images\\Cars${img_n}.png`, 'base64');
    const data = {img};
  axios
    .post('http://localhost:9000/', data)
    .then(res => {
      console.log(`Status: ${res.status}`)
    })
    .catch(err => {
      console.error(err)
    })}, 10000);