var Q = require('q');
var debug = require('debug')('query-v1');
var _ = require('lodash');
var v1Query = require('../lib/v1Query');

/*
 * GET users listing.
 */

exports.listStoriesForTimebox = function(req, res){  
  v1Query(req, {
      "from":"Story",
      "select":["Name", "Estimate"],
      "where": {
        "Timebox.ID":"Timebox:307415"
      }
    })
    .end(function (queryRes) {
      if (queryRes.ok) {
        res.send('success! :D');
      } else {
        res.send('failure :-(\n' + queryRes.text);
      }
    });
};
