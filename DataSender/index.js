const axios = require('axios');
const fs = require('fs');

const MAX_IMG = 52;
const port = 3000;

let cars_in = Array(MAX_IMG+1).fill(false);
let intervalID = setInterval(() => {
  let img_n = Math.floor(Math.random() * MAX_IMG);
  while(cars_in[img_n]) {
    img_n = Math.floor(Math.random() * MAX_IMG);
  }
  cars_in[img_n] = true;
  let img = "data:image/jpg;base64," + fs.readFileSync(__dirname + `\\dataset\\eu-license-plates\\car_${img_n}.jpg`, 'base64');
  let data = {img};
  axios 
    .post(`http://127.0.0.1:${port}/post_incoming`, data)
    .then(res => {
      console.log(`Status: ${res.status}`)
    })
    .catch(err => {
      console.error(err)
    })
  img_n = Math.floor(Math.random() * MAX_IMG);
  while(!cars_in[img_n]) {
    img_n = Math.floor(Math.random() * MAX_IMG);
  }
  cars_in[img_n] = false; 
  img = "data:image/png;base64," + fs.readFileSync(__dirname + `\\dataset\\eu-license-plates\\car_${img_n}.jpg`, 'base64');
  data = {img}
  axios 
    .post(`http://io_handler_api:${port}/post_incoming`, data)
    .then(res => {
      console.log(`Status: ${res.status}`)
    })
    .catch(err => {
      console.error(err)
    })
}, 10000);