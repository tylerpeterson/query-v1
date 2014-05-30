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

queryObject.page.size = 1000;

function Analyzer (keysToCheck) {
  this.keysToCheck = keysToCheck;
  this.values = {};
}

Analyzer.prototype.addRecord = function(record) {
  var that = this;
  this.keysToCheck.forEach(function (propName) {
    var propValue = record[propName];
    that.values[propName] = that.values[propName] || {};
    that.values[propName][propValue] = (that.values[propName][propValue] || 0) + 1;
  });
};

Analyzer.prototype.summary = function() {
  var that = this;
  this.keysToCheck.forEach(function (propName) {
    var allUnique = true;
    var uniqueValues = 0;
    Object.keys(that.values[propName]).forEach(function (propValue) {
      var count = that.values[propName][propValue];
      if (count > 1) {
        debug('%s: %s, count: %d', propName, propValue, count);
        allUnique = false;
      } else {
        uniqueValues++;
      }
    });

    if (allUnique) {
      debug('%s: all values were unique', propName);
    } else {
      debug('%s: %d unique value(s) omitted', propName, uniqueValues);
    }
  });
};

authService().then(function (tokens) {
  var token = tokens.access_token;
  request
    .get(authService.serverBaseUri + '/query.v1')
    .set('Authorization', 'Bearer ' + token)
    .send(queryObject)
    .end(function (res) {
      var names = {};


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

