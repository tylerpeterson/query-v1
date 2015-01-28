var Q = require('q');
var debug = require('debug')('query-v1');
var _ = require('lodash');
var userService = require('../../lib/userService');
var v1Query = require('../../lib/v1Query');
var timeago = require('timeago');
var moment = require('moment');
require('twix');
var UAParser = require('ua-parser-js');
var util = require('util');
var templatePath = require.resolve('./one-user-view.ejs');
var ejs = require('ejs');

exports.reportByUserId = function (req, res) {
  debug('listDailyCompletions', req.params.userId);
  var earliest = moment().subtract(14, 'days');
  var current = moment();
  var labels = [];
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
    labels.push(current.clone());
    current.subtract(1, 'days');
  }
  // debug(JSON.stringify(queries, null, ' '));
  v1Query(req, queries).end(function (queryRes) {
    if (queryRes.ok) {
      var rawUser = queryRes.body.shift()[0];
      var userId = normalizeOid(rawUser._oid);
      var user = {
        url: urlToUser(userId),
        name: rawUser.Name,
        nick: rawUser.Nickname
      };
      var data = queryRes.body.map(function (dayData, index) {
        var dayMoment = labels[index];
        return {
          label: dayMoment.format('dddd'), // Day of the Week
          labelDetail: dayMoment.format('ll'), // full date
          clazz: classifyDay(dayMoment),
          tasks: dayData.map(function (taskData) {
            var id = normalizeOid(taskData._oid);
            var creation = moment(taskData.CreateDate);
            var change = moment(taskData.ChangeDate);
            return {
              name: taskData.Name,
              number: taskData.Number,
              url: "https://www5.v1host.com/FH-V1/task.mvc/Summary?oidToken=" + id,
              age: creation.from(change, /*show "ago" = */ true),
              ageDetail: creation.twix(change).format(),
              collaborators: taskData.Owners.map(function (ownerData) {
                return {
                  name: ownerData.Name,
                  url: urlToUser(normalizeOid(ownerData._oid)),
                  id: normalizeOid(ownerData._oid)
                }
              }).filter(function (collaborator) {
                return collaborator.id !== userId;
              }),
              orig: taskData
            }
          })
        }
      });
      var options = {
        locals: {
          user: user,
          data: data,
          devMode: true,
          dataString: JSON.stringify(data, null, ' ')
        }
      }
      ejs.renderFile(templatePath, options, function (err, str) {
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

function classifyDay(dayMoment) {
  var dow = dayMoment.day();
  if (dow === 0 /* Sunday */ || dow === 6 /* Saturday */) {
    return 'holiday'
  }
  return dayMoment.dayOfYear() % 2 === 1 ? 'odd-day' : 'even-day'
}
function urlToUser(id) {
  return "https://www5.v1host.com/FH-V1/Member.mvc/Summary?oidToken=" + id;
}

function normalizeOid(oid) {
  return oid.split(':').slice(0, 2).join(':')
}

function tasksForADay(userId, day) {
  return {
    from: "Task",
    select: [
      "Name",
      "Number",
      "Status.Name",
      "ChangeDate",
      "CreateDate",
      {
        from: "Owners",
        select: [
          "Name",
          "Nickname"
        ]
      }
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
