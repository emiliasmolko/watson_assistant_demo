/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

require('dotenv').config({
  silent: true
});

const DEFAULT_NAME = 'watson-assistant-demo';
const AssistantV1 = require('ibm-watson/assistant/v1');
const LanguageTranslatorV3 = require('ibm-watson/language-translator/v3');
var express = require('express'); // app server
var bodyParser = require('body-parser'); // parser for post requests

var app = express();

// Bootstrap application settings
app.use(express.static('./public')); // load UI from public folder
app.use(bodyParser.json());

if (!process.env.WORKSPACE_ID & !process.env.ASSISTANT_IAM_APIKEY && !process.env.ASSISTANT_URL
&& process.env.LANGUAGE_TRANSLATOR_IAM_APIKEY && !process.env.LANGUAGE_TRANSLATOR_URL) {
  console.log('Please supply WORKSPACE_ID, APIKEYs and URLs in the environment');
  process.exit();
}

const conversation = new AssistantV1({
  version: '2019-08-06'
});
const languageTranslator = new LanguageTranslatorV3({
  version: '2018-05-01'
});

// Endpoint to be call from the client side
app.post('/api/message', function(req, res) {

if( req.body.input){
//translate
const parameters = {
            text: req.body.input.text || '',
            model_id: 'pl-en'
};
languageTranslator.translate(parameters, function (error, response) {
	if (error) {
		console.log(error);
    } else {
		console.log(JSON.stringify(response, null, 4));
        const labelsvr = response.translations[0].translation;
        let cleanString = labelsvr.replace(/\n/g, '');
        console.log(cleanString);
        const params = {
                'text': cleanString,
                'features': {
                  text: req.body.input.text
                }	
		};
	  var payload = {
		workspace_id: process.env.WORKSPACE_ID,
		context: req.body.context || {},
		input: params || {}
	  };
	  // Send the input to the conversation service
	  conversation.message(payload, function(err, data) {
		if (err) {
		  return res.status(err.code || 500).json(err);
		}
		return res.json(updateMessage(payload, data));
	  });	
	}
});
}
});
/**
 * Updates the response text using the intent confidence
 * @param  {Object} input The request to the Assistant service
 * @param  {Object} response The response from the Assistant service
 * @return {Object}          The response with the updated message
 */
function updateMessage(input, response) {
  var responseText = null;
  if (!response.output) {
    response.output = {};
  } else {
	  response.intents.forEach(function(intent, index, array){
		console.log(intent.intent+":"+intent.confidence);
		});
    }
	//response.output.text = responseText;
	return response;
}

module.exports = app;
