var Q = require('q');
var debug = require('debug')('query-v1');
var _ = require('lodash');
var v1Query = require('../lib/v1Query');
var express = require('express');

exports.listStoriesForScope = function (req, res, next) {
  var scopeId = parseInt(req.params.scope);
  var query = [{
    from: "Scope",
    select: [
      "Name"
    ],
    where: {
      "ParentMeAndUp.ID": "Scope:" + scopeId
    }
  }];
  debug('scopeId', scopeId);
  debug('query', query);
  v1Query(req, query)
  .end(function (queryRes) {
    if (queryRes.ok) {
      debug(JSON.stringify(queryRes.body, null, ' '));
      var scopes = queryRes.body[0];
      res.send('success! :D');
    } else {
      res.send('failure :-(\n' + queryRes.text);
    }
  });
}

exports.getRouter = function (v1Auth) {
  var app = express.Router();
  app.get('/scope/:scope', v1Auth, exports.listStoriesForScope);
  return app;
}