const express = require('express');
const multer = require('multer');
const upload = multer({dest: __dirname + '\\dataset\\images\\'});
const app = express();
const port = 3000;
const axios = require('axios');
const fs = require('fs');
const url = require('url');
const myParser = require('body-parser');
const MAX_IMG = 432;
app.use(myParser.json({limit: '200mb'}));
app.use(myParser.urlencoded({limit: '200mb', extended: true}));
app.get('/', (req, res) => {
    
});

app.use(express.json());


app.post('/', function requestHandler(req, res) {
  const base64Data = req.body.img.replace(/^data:image\/png;base64,/, "");
  
  
  
  
  res.end();
  
  fs.writeFile(__dirname + `\\test\\out${req.body.num}.png`, base64Data, 'base64', function(err) {
  console.log(err);
});
   
});
app.listen(port, () => {
    //console.log(`Example app listening on port ${port}`);
    
});
function base64_encode(file) {
    return "data:image/png;base64,"+fs.readFileSync(file, 'base64');
}
//const img_n = getRndInteger(0, 432);
//const img = base64_encode(__dirname + `\\dataset\\images\\Cars${img_n}.png`);
//console.log(img);

/*const data = {
    img
  };*/

const limits = {
  maxBodyLength: Infinity
};
  
  let intervalID = setInterval(() => {
    const img_n = getRndInteger(0, 432);
    const img = base64_encode(__dirname + `\\dataset\\images\\Cars${img_n}.png`);
    
    const data = {
      img,
      num : img_n
    };
  axios
    .post('http://localhost:3000/', data)
    .then(res => {
      console.log(`Status: ${res.status}`)
      //console.log('Body: ', res.data)
      
    })
    .catch(err => {
      console.error(err)
    })}, 5000);

    function getRndInteger(min, max) {
      return Math.floor(Math.random() * (max - min) ) + min;
    }
