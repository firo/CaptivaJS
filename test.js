var fs = require('fs');

var Captiva = require('./lib/captiva.js');
var captiva = new Captiva();

var image_path          = '';
var convert_profile     = '';
var enhance_profile     = '';
var recognition_project = '';

process.env.CAPTIVA_APP_ID  = '';
process.env.CAPTIVA_LIC_ID  = '';
process.env.CAPTIVA_PWD     = '';
process.env.CAPTIVA_USER    = '';
process.env.CAPTIVA_URL     = ''
process.env.DEBUG           = true;

// read binary data
var bitmap = fs.readFileSync(image_path);

// convert binary data to base64 encoded string
var image =  new Buffer(bitmap).toString('base64');

//captiva recognition
captiva.recognition(image, convert_profile, enhance_profile, recognition_project, function(err, res) {
  if (err) {
     console.log('Error in recognition: ' + err.statusMessage);
     return;
   }

   var card = {}
   card.fiscalCode = res.body.resultItems[0].values[3].value.nodeList[0].data[0].value;
   card.sex = res.body.resultItems[0].values[3].value.nodeList[1].data[0].value;
   card.birthPlace = res.body.resultItems[0].values[3].value.nodeList[2].data[0].value;
   card.province = res.body.resultItems[0].values[3].value.nodeList[3].data[0].value;
   card.assistedCode = res.body.resultItems[0].values[3].value.nodeList[4].data[0].value;
   card.issuerCode = res.body.resultItems[0].values[3].value.nodeList[5].data[0].value;
   card.documentType = res.body.resultItems[0].values[3].value.nodeList[6].data[0].value;
   card.surname = res.body.resultItems[0].values[3].value.nodeList[7].data[0].value;
   card.name = res.body.resultItems[0].values[3].value.nodeList[8].data[0].value;
   card.dob = res.body.resultItems[0].values[3].value.nodeList[9].data[0].value;
   card.expirationDate = res.body.resultItems[0].values[3].value.nodeList[10].data[0].value;
   card.cardId = res.body.resultItems[0].values[3].value.nodeList[12].data[0].value;

   console.log(card);

});
