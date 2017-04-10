/* jshint node: true */

"use strict";

/*
   This script tries to focus on just making a query and doing some simiple analysis. The libraries it 
   uses help a bit.
 */

var secrets = require('../client_secrets');
var debug = require('debug')('query-v1');
var request = require('superagent');
var path = require('path');
var queryObject = require(path.join(__dirname, '../node_modules/sample-v1-queries/scope-state-exploration.json'));
var Analyzer = require('./CountUniqueValues');

queryObject.page.size = 1000;

// TODO get multiple smaller pages of results instead of one big request
// TODO be kind and throttle requesting.
request
  .get(secrets.web.server_base_uri + '/query.v1')
  .set('Authorization', 'Bearer ' + secrets.access_token)
  .send(queryObject)
  .end(function (err, res) {
    if (!err) {
      var analyzer = new Analyzer(queryObject.select.slice());
      res.body[0].forEach(function (scope) {
        analyzer.addRecord(scope);
      });
      debug(analyzer.summary());
    } else {
      debug("failed to get data", err.text);
    }
  });

