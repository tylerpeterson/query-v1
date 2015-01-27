var Q = require('q');
var debug = require('debug')('query-v1');
var _ = require('lodash');
var userService = require('../../lib/userService');
var v1Query = require('../../lib/v1Query');
var timeago = require('timeago');
var moment = require('moment');
var UAParser = require('ua-parser-js');
var util = require('util');
var templatePath = require.resolve('./view.ejs');
var ejs = require('ejs');

exports.reportByUserId = function (req, res) {
  debug('listDailyCompletions', req.params.userId);
  var earliest = moment().subtract(14, 'days');
  var current = moment();
  var queries = [
    {
      from: "Member",
      select: [
        "Name",
        "Nickname"
      ],
      where: {
        ID: req.params.userId
      }
    }
  ];
  while (current.isAfter(earliest)) {
    queries.push(tasksForADay(req.params.userId, current.format("YYYY-MM-DD")));
    current.subtract(1, 'days');
  }
  // debug(JSON.stringify(queries, null, ' '));
  v1Query(req, queries).end(function (queryRes) {
    if (queryRes.ok) {
      ejs.renderFile(templatePath, {locals: {data: JSON.stringify(queryRes.body, null, ' ')}}, function (err, str) {
        if (err) {
          debug('err rendering', err);
          res.sent('failure rendering' + err);
        } else {
          res.send(str);
        }
      })
    } else {
      res.send('failure. :-(' + queryRes.text);
    }
  });
}

function tasksForADay(userId, day) {
  return {
    from: "Task",
    select: [
      "Name",
      "Status.Name",
      "ChangeDate"
    ],
    where: {
      "Owners.ID": userId,
      "Status.Name": "Completed"
    },
    filter: [
      "ChangeDate>'" + day + "T00:00:00'"
    ],
    sort: [
      "-ChangeDate"
    ],
    asof: day + "T23:59:59"
  };
}
