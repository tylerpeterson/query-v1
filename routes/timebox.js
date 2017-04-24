var Q = require('q');
var debug = require('debug')('query-v1');
var _ = require('lodash');
var v1Query = require('../lib/v1Query');
var express = require('express');

exports.listStoriesForTimebox = function(req, res, next){
  var timeboxId = parseInt(req.params.timebox);
  var query = [{
      from:"Timebox",
      select:[
        "Name"
        ],
      where: {
        "Timebox.ID":"Timebox:" + timeboxId
      }
    },{
      from:"Story",
      select:[
        "Name",
        "Estimate"
        ],
      where: {
        "Timebox.ID":"Timebox:" + timeboxId
      }
    }];
  debug('timeboxId', timeboxId);
  debug('query', JSON.stringify(query, null, ' '));
  v1Query(query)
    .end(function (err, queryRes) {
      var timebox;

      if (!err) {
        debug(JSON.stringify(queryRes.body, null, ' '));
        timebox = queryRes.body[0][0];
        timebox.Stories = queryRes.body[1];
        debug(JSON.stringify(timebox, null, ' '));
        res.send('success! :D');
      } else {
        res.send('failure :-(\n' + queryRes.text);
      }
    });
};

exports.getRouter = function () {
  var app = express.Router();
  app.get('/timebox/:timebox', exports.listStoriesForTimebox);
  return app;
}
