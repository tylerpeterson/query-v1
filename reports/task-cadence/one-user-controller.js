var Q = require('q');
var debug = require('debug')('query-v1');
var _ = require('lodash');
var userService = require('../../lib/userService');
var v1Query = require('../../lib/v1Query');
var timeago = require('timeago');
var moment = require('moment');
require('twix');
var numeral = require('numeral');
var UAParser = require('ua-parser-js');
var util = require('util');
var templatePath = require.resolve('./one-user-view.ejs');
var ejs = require('ejs');
var myUtils = require('./utils');
var checkHoliday = require('../../lib/holiday');

var classifyDay = myUtils.classifyDay;
var tasksForADay = myUtils.tasksForADay;
var urlToUser = myUtils.urlToUser;
var normalizeOid = myUtils.normalizeOid;
var parseUrlParams = myUtils.parseUrlParams;

exports.reportByUserId = function (req, res) {
  debug('listDailyCompletions', req.params.userId);
  var urlParams = parseUrlParams(req.url.substr((req.url.indexOf('?') !== -1) ?
    req.url.indexOf('?') + 1 : req.url.length));

  var earliest = (urlParams.start) ? moment(urlParams.start).subtract('days', 1) : moment().subtract('days', 15);
  var current = (urlParams.end) ? moment(urlParams.end) : moment();
  var labels = [];
  var queries = [
    {
      from: 'Member',
      select: [
        'Name',
        'Nickname'
      ],
      where: {
        ID: req.params.userId
      }
    }
  ];
  while (current.isSameOrAfter(earliest)) {
    queries.push(tasksForADay(req.params.userId, current.format('YYYY-MM-DD')));
    labels.push(current.clone());
    current.subtract(1, 'days');
  }

  // Modify the last query to get all tasks completed as of that date so that we can filter out false completions
  delete queries[queries.length - 1].filter;
  labels.pop();

  // debug(JSON.stringify(queries, null, ' '));
  debug('queries: ', queries.length);
  v1Query(queries).end(function (err, queryRes) {
    if (err) {
      res.send('failure. :-(' + queryRes.text);
      return;
    }

    var rawUser = queryRes.body.shift()[0];
    var userId = normalizeOid(rawUser._oid);
    var user = {
      url: urlToUser(userId),
      name: rawUser.Name,
      nick: rawUser.Nickname
    };
    var scores = {
      workDays: 0,
      totalDaysWithTasks: 0,
      totalTasks: 0,
      daysWithTasksScore: 0,
      meanTasksPerDay: 0,
      totalEstimatedHours: 0,
      meanEstimatedHoursPerDay: 0
    };

    removeDuplicates(queryRes.body);

    var dontCountNextDay = false;

    var data = queryRes.body.map(function (dayData, index) {
      var dayMoment = labels[index];
      scores.workDays += (function (day) {
        var isHoliday = checkHoliday(day.format('YYYY-MM-DD'));
        if (day.isoWeekday() < 6) { // Weekday
          if (!isHoliday) {
            if (!dontCountNextDay) {
              return 1;
            } else {
              dontCountNextDay = false;
              return 0;
            }
          } else {
            if (!dontCountNextDay) {
              return 0;
            } else {
              dontCountNextDay = false;
              return 0;
            }
          }
        } else { // Saturday or Sunday
          if (!isHoliday) {
            return 0;
          } else {
            if (day.isoWeekday() === 6) { // Saturday holidays are taken on the preceding Friday
              return (scores.workDays > 0) ? -1 : 0;
            } else if (day.isoWeekday() === 7) { // Sunday holidays are taken on the following Monday
              dontCountNextDay = true;
              return 0;
            }
          }
        }
      })(dayMoment);
      scores.totalDaysWithTasks += dayData.reduce(function (prev, cur) {
        return Math.min(1, prev + 1 / cur.Owners.length);
      }, 0);
      scores.totalTasks += dayData.reduce(function (prev, cur) {
        return prev + 1 / cur.Owners.length;
      }, 0);
      scores.totalEstimatedHours += dayData.reduce(function (prev, cur) {
        var originalEstimate = cur.DetailEstimate;

        if (originalEstimate === null) {
          originalEstimate = 2; // Need a default estimate when none is set.
        } else {
          originalEstimate = parseInt(originalEstimate);
        }

        debug('reducing hours', prev, cur.DetailEstimate, cur.Owners.length);

        return prev + (originalEstimate / cur.Owners.length);
      }, 0);
      debug('totalEstimatedHours', scores.totalEstimatedHours);

      return {
        label: dayMoment.format('ddd, MMM D'), // Day of the Week
        labelDetail: dayMoment.format('ll'), // full date
        clazz: classifyDay(dayMoment),
        tasks: dayData.map(function (taskData) {
          var id = normalizeOid(taskData._oid);
          var creation = moment(taskData.CreateDate);
          var change = moment(taskData.ChangeDate);
          return {
            name: taskData.Name,
            number: taskData.Number,
            url: process.env.V1_SERVER_BASE_URI + '/task.mvc/Summary?oidToken=' + id,
            age: creation.from(change, /*show "ago" = */ true),
            ageDetail: creation.twix(change).format(),
            taskEstimate: taskData.DetailEstimate || 'None',
            collaborators: taskData.Owners.map(function (ownerData) {
              return {
                name: ownerData.Name,
                url: urlToUser(normalizeOid(ownerData._oid)),
                id: normalizeOid(ownerData._oid)
              };
            }).filter(function (collaborator) {
              return collaborator.id !== userId;
            }),
            orig: taskData
          };
        })
      };
    });

    var workDays = Math.max(1, scores.workDays);
    scores.daysWithTasksScore = numeral(scores.totalDaysWithTasks / workDays).format('0%');
    scores.meanTasksPerDay = numeral(scores.totalTasks / workDays).format('0.00');
    scores.meanEstimatedHoursPerDay = numeral(scores.totalEstimatedHours / workDays).format('0.00');
    scores.totalDaysWithTasks = numeral(scores.totalDaysWithTasks).format('0.00');
    scores.totalTasks = numeral(scores.totalTasks).format('0.00');
    scores.totalEstimatedHours = numeral(scores.totalEstimatedHours).format('0.0');

    var locals = {
      user: user,
      data: data,
      scores: scores,
      devMode: false,
      dataString: JSON.stringify(data, null, ' ')
    };
    ejs.renderFile(templatePath, locals, {}, function (err, str) {
      if (err) {
        debug('err rendering', err);
        res.send('failure rendering' + err);
      } else {
        res.send(str);
      }
    });
  });
};

function removeDuplicates(data) {
  var oldCompletions = _.pluck(data.pop().tasks, 'Number').reduce(function (accumulator, current) {
    accumulator[current] = true;

    return accumulator;
  }, {});
  var i;
  for (i = data.length - 1; i >= 0; --i) {
    data[i] = _.reject(data[i], filterFunction);
  }
  function filterFunction(task) {
    var num = task.Number;
    var found = oldCompletions[num] || false;

    oldCompletions[num] = true;

    if (found) {
      debug('found a duplicate:', num);
    }

    return found;
  }
}

