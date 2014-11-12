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
        var query = scopes.map(function (scope) {
          return {
            from: "Story",
            select: [
              "Name",
              "Estimate",
              "Order",
              "Team.Name",
              "Team",
              "Status.Name",
              "Timebox.Name",
              "Timebox.EndDate",
              "Timebox"
            ],
            where: {
              "Scope.ID": scope._oid
            }
          };
        });
        debug('second query', query);
        v1Query(req, query).end(function (queryRes) {
          if (queryRes.ok) {
            var stories = _.flatten(queryRes.body, true);
            var backlogs = _.groupBy(stories, function (story) {
              return story.Team._oid;
            });
            debug(JSON.stringify(Object.keys(backlogs), null, ' '));

            res.send('success! :D');
          } else {
            res.send('failure (2) :-(\n' + queryRes.text);
          }
        });
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