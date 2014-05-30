/* jshint node: true */

"use strict";

/*
   This script tries to focus on just making a query and doing some simiple analysis. The libraries it 
   uses help a bit.
 */

var authService = require('v1oauth').authService(require('../client_secrets'));
var debug = require('debug')('query-v1');
var request = require('superagent');
var path = require('path');
var queryObject = require(path.join(__dirname, '../node_modules/sample-v1-queries/scope-state-exploration.json'));
var Analyzer = require('./CountUniqueValues');

queryObject.page.size = 1000;

authService().then(function (tokens) {
  var token = tokens.access_token;
  request
    .get(authService.serverBaseUri + '/query.v1')
    .set('Authorization', 'Bearer ' + token)
    .send(queryObject)
    .end(function (res) {
      if (res.ok) {
        var analyzer = new Analyzer(queryObject.select.slice());
        res.body[0].forEach(function (scope) {
          analyzer.addRecord(scope);
        });
        analyzer.summary();
      } else {
        debug("failed to get data", res.text);
      }
    });
});

