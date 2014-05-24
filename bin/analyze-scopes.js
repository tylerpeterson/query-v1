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

authService().then(function (tokens) {
  var token = tokens.access_token;
  request
    .get(authService.serverBaseUri + '/query.v1')
    .set('Authorization', 'Bearer ' + token)
    .send(queryObject)
    .end(function (res) {
      var names = {};

      if (res.ok) {
        //debug('successful request!', JSON.stringify(res.body, null, 2));
        queryObject.select.forEach(function (propName) {
          var values = {};
          res.body[0].forEach(function (scope) {
            var propValue = scope[propName];
            values[propValue] = (values[propValue] || 0) + 1;
          });
          var allUnique = true;
          var uniqueValues = 0;
          Object.keys(values).forEach(function (propValue) {
            var count = values[propValue];
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
      } else {
        debug("failed to get data", res.text);
      }
    });
});

