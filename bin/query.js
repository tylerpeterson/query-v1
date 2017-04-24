#!/usr/bin/env node

var path = require('path');
require('dotenv').config({path: path.join(__dirname, '../.env_dev')});

var program = require('commander');
var debug = require('debug')('query-v1');
var secrets = require('../lib/load-secrets')('../client_secrets');
var serverBaseUri = secrets.v1ServerBaseUri;

// var query = require('./scopes');
// var query = require('./backlog');
var query = require('./tasks-for-owner-example');

var request = require('superagent');

program
  .version('0.0.1')
  .option('-c, --count [number]', 'specify how many names to emit. default 1', '1')
  .parse(process.argv);

debug('query', JSON.stringify(query, null, ' '));

request
    .get(serverBaseUri + '/query.v1')
    .set('Authorization', 'Bearer ' + secrets.v1AccessToken)
    .send(query)
    .end(function (err, res) {
      if (err === null) {
        debug('successful request!', JSON.stringify(res.body, null, ' '));
      } else {
        debug('failed to get data', err.response.text);
      }
    });
