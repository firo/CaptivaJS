var unirest = require('unirest');
var util = require('util');

var Captiva = function() {
  "use strict";
  var self = this;

  /* Params
  * image:                    image base64 encoded
  * convert_profile:         convert profile name
  * enhance_profile:         enhance profile name
  * recognition_project:     recognition project name
  * callback:                retun the response obj
   */
  self.recognition = function(image, convert_profile, enhance_profile, recognition_project, callback) {

     //captiva login
     self.login(function(err, ticket) {
       if (err) {
          console.log('Error in login: ' + err.statusMessage);
          return;
        }

       //captiva upload
       self.upload( ticket, image, function(err, upload_id) {

         if (err) {
            console.log('Error in upload: ' + err.statusMessage);
            return;
          }

          // captiva convert
          self.convert( ticket, upload_id, convert_profile, function(err, convert_id) {

            if (err) {
               console.log('Error in convert: ' + err.statusMessage);
               return;
             }

            // captiva enhance
            self.enhance( ticket, convert_id, enhance_profile, function(err, enhance_id) {

              if (err) {
                 console.log('Error in enhance: ' + err.statusMessage);
                 return;
               }

              // captiva extraction
              self.extract( ticket, enhance_id, recognition_project, function(err, extraction_result) {

                if (err) {
                   console.log('Error in extraction: ' + err.statusMessage);
                   return;
                 }

                 callback(null, extraction_result);

              });

            });

          });

       });

     });

   }

  }

/* Params
 * action:    type of action, login, upload, convert, enhance, extract
 * json_in:   json request
 * ticket:    ticket session
 * debug:     boalean for console log response
 * callback:  retun the http response obj
 */
Captiva.prototype._post = function(action, json_in, ticket, debug, callback) {

  // check input params
  if (typeof action === 'undefined' ) {
    callback(new Error('action is undefined in private post method'),null);
    return;
  }

  if (typeof json_in === 'undefined' ) {
    callback(new Error('json_in is undefined in private post method'),null);
    return;
  }

  if (action != 'login') {
    if (typeof json_in === 'undefined' ) {
      callback(new Error('json_in is undefined in private post method'),null);
      return;
    }
  }

  var url = process.env.CAPTIVA_URL;
  var header = {'Accept': 'application/vnd.emc.captiva+json, application/json',
                'Content-Type': 'application/vnd.emc.captiva+json; charset=utf-8',
                'Accept-Language': 'en-US'
                }
  var checkCode = 200;
  switch (action) {
    case "login":
      url = url + '/cp-rest/session';
      header = {  'Accept': 'application/json',
                  'Content-Type': 'application/json'};
      break;
    case "upload":
      url = url + '/cp-rest/session/files';
      header = {'Content-Type': 'application/vnd.emc.captiva+json', 'CPTV-TICKET': ticket};
      checkCode = 201;
      break;
    case "convert":
      url = url + '/cp-rest/session/services/convertimages';
      header["CPTV-TICKET"] = ticket;
      break;
    case "enhance":
      url = url + '/cp-rest/session/services/processimage';
      header["CPTV-TICKET"] = ticket;
      break;
    case "extract":
      url = url + '/cp-rest/session/services/classifyextractpage';
      header["CPTV-TICKET"] = ticket;
      break;
    default:
  }

  unirest.post(url).headers(header).send(JSON.stringify(json_in)).end(function (res) {
    if (debug) console.log('---'+action+'---\n'+JSON.stringify(res, null,4));
    if(res.statusCode == checkCode){
      callback(null, res);
    } else {
      callback(res, null);
    }
  });
}

/* Params
 * callback:  retun the ticket session id
 */
Captiva.prototype.login = function(callback) {
  var _json_in = {
                  "culture": "en-US",
                  "licenseKey": process.env.CAPTIVA_LIC_ID,
                  "deviceId": "CaptivaBot client",
                  "applicationId": process.env.CAPTIVA_APP_ID,
                  "username": process.env.CAPTIVA_USER,
                  "password": process.env.CAPTIVA_PWD,
                  "extraAuthInfo":""
                 }


  this._post('login',_json_in, null, process.env.DEBUG || false, function(err, res){

    if(err) {
      callback(err, null);
      return;
    }

    if(res.code == 200){
      callback(null, res.body.ticket);
    } else {
      callback(res, null);
    }
  });

};

/* Params
 * ticket:    Captiva session id
 * image:     the image base64 encoded
 * callback:  retun the uploaded image id
 */
Captiva.prototype.upload = function (ticket, image, callback) {

  // check input ticket param
  if (typeof ticket === 'undefined' ) {
    callback(new Error('ticket is undefined for upload base64'),null);
    return;
  }

  // check input image param
  if (typeof image === 'undefined' ) {
    callback(new Error('image is undefined for upload base64'),null);
    return;
  }

  var _json_in = {"data":image, "contentType": "application/vnd.emc.captiva+json"}
  this._post('upload',_json_in, ticket, false, function(err, res){
    if(err) {
      callback(err, null);
      return;
    }

    if(res.code == 201){
      callback(null, res.body.id);
    } else {
      callback(res, null);
    }
  });

}


/* Params
 * ticket:    Captiva session id
 * id:        Captiva image id already uploaded
 * profile:   Captiva profile name for covert image
 * callback:  retun the converted image
 */
Captiva.prototype.convert = function (ticket, id, profile, callback) {

  // check input ticket param
  if (typeof ticket === 'undefined' ) {
    callback(new Error('ticket is undefined for convert'),null);
    return;
  }
  // check input image id
  if (typeof id === 'undefined' ) {
    callback(new Error('id is undefined for convert'),null);
    return;
  }
  // check input convert profile
  if (typeof profile === 'undefined' ) {
    callback(new Error('profile is undefined for convert'),null);
    return;
  }
  var _json_in =
              {
                "serviceProps": [{  "name":"Profile", "value":profile }],
                "requestItems": [{  "nodeId":1,
                                    "files": [{
                                              "name":id,
                                              "value":id,
                                              "contentType":"image/jpg",
                                              "fileType":"jpg"
                                            }]
                                }]
              }

  this._post('convert',_json_in, ticket, process.env.DEBUG || false, function(err, res) {

    if(err) {
      callback(err, null);
      return;
    }


    if (res.body.returnStatus.status == 200 && res.body.resultItems[0].errorCode == '') {
      callback(null, res.body.resultItems[0].files[0].value);
    } else {
      callback(new Error(util.inspect(res)), null);
    }

  });
}

/* Params
 * ticket:    Captiva session id
 * id:        Captiva image id already uploaded
 * profile:   Captiva profile name for enhance image
 * callback:  retun the enhanced image
 */
Captiva.prototype.enhance = function (ticket, id, profile, callback) {
  // check input ticket param
  if (typeof ticket === 'undefined' ) {
    callback(new Error('ticket is undefined for enhance'),null);
    return;
  }
  // check input image id
  if (typeof id === 'undefined' ) {
    callback(new Error('id is undefined for enhance'),null);
    return;
  }
  // check input convert profile
  if (typeof profile === 'undefined' ) {
    callback(new Error('profile is undefined for enhance'),null);
    return;
  }
  var _json_in = {
                    "serviceProps":[{  "name":"Profile","value": profile },
                                    {"name":"ReturnFileDataInline",
                                    "value": false}],
                    "requestItems":[{  "nodeId":1,
                    "files": [{
                             "name":id,
                             "value":id,
                             "contentType":"image/tiff",
                             "fileType":"tiff"
                           }]
                }]
              }

  this._post('enhance',_json_in, ticket, process.env.DEBUG || false, function(err, res){

    if(err) {
      callback(err, null);
      return;
    }

    if(res.body.returnStatus.status != 200){
      callback(new Error(util.inspect(res)), null);
    } else {
      callback(null, res.body.resultItems[0].files[0].value);
    }

  });

}

/* Params
 * ticket:    Captiva session id
 * id:        Captiva image id already uploaded
 * project:   Captiva project name for OCR
 * callback:  retun full extracted json data
 */
 Captiva.prototype.extract = function (ticket, id, project, callback) {
  // check input ticket param
  if (typeof ticket === 'undefined' ) {
    callback(new Error('ticket is undefined for extract'),null);
    return;
  }
  // check input image id
  if (typeof id === 'undefined' ) {
    callback(new Error('id is undefined for extract'),null);
    return;
  }
  // check input convert profile
  if (typeof project === 'undefined' ) {
    callback(new Error('project is undefined for extract'),null);
    return;
  }
  var _json_in =
  {
      "serviceProps":[{  "name":"Project","value": project } ],
      "requestItems":[{  "nodeId":1,
          "files": [{
              "name":id,
              "value":id,
              "contentType":"image/tiff",
              "fileType":"tiff"
          }]
      }]
  }

this._post('extract',_json_in, ticket, process.env.DEBUG || false, function(err, res){

    if(err) {
      callback(err, null);
      return;
    }

    if(res.body.returnStatus.status != 200){
      callback(new Error(util.inspect(res)), null);
    } else {
      callback(null, res);
    }
  });
}

module.exports = Captiva;
