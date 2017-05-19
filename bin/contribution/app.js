#!/usr/bin/env node

require('es6-promise').polyfill();
require('isomorphic-fetch');
var path = require('path');
require('dotenv').config({path: path.join(__dirname, '../../.env_dev')});

var debug = require('debug')('query-v1');
var secrets = require('../../lib/load-secrets')('../client_secrets');
const serverBaseUri = secrets.v1ServerBaseUri;
const queryUri = serverBaseUri + '/query.v1';
const storyBaseUri = serverBaseUri + '/story.mvc/Summary?oidToken='
const taskBaseUri = serverBaseUri + '/Task.mvc/Summary?oidToken=';

var express = require('express');
var http = require('http');
var logger = require('morgan');
var errorHandler = require('errorhandler');

var app = express();
var port = secrets.port;

const contribution = require('./controllers/contribution');

app.set('port', port);
app.set('view engine', 'pug');
app.use(logger('dev'));
app.get('/', contribution);
app.use(errorHandler());

http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});
