var debug = require('debug')('query-v1');
var templatePath = require.resolve('./user-year-view.ejs');
var ejs = require('ejs');
var moment = require('moment');
require('twix'); // plugin that modifies moment
var v1Query = require('../../lib/v1Query');
var myUtils = require('./utils');

var classifyDay = myUtils.classifyDay;
var tasksForADay = myUtils.tasksForADay;
var urlToUser = myUtils.urlToUser;
var normalizeOid = myUtils.normalizeOid;

exports.reportByUserId = function (req, res) {
  debug('taskCadenceForFlagged', req.params.userId);
  var latest = moment('2014-12-31');
  var earliest = latest.clone().subtract(365, 'days');
  var current = latest.clone();
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
  while (current.isAfter(earliest)) {
    queries.push(tasksForADay(req.params.userId, current.format('YYYY-MM-DD')));
    labels.push(current.clone());
    current.subtract(1, 'days');
  }
  // debug(JSON.stringify(queries, null, ' '));
  v1Query(queries).end(function (err, queryRes) {
    if (!err) {
      var rawUser = queryRes.body.shift()[0];
      var userId = normalizeOid(rawUser._oid);
      var user = {
        url: urlToUser(userId),
        name: rawUser.Name,
        nick: rawUser.Nickname
      };
      var summary = {
        completionScore: 0,
        totalDays: 0,
        totalTasks: 0
      };
      var data = queryRes.body.map(function (dayData, index) {
        var dayMoment = labels[index];
        var completionScore = 4 - 4 / Math.pow(2, dayData.length);
        summary.completionScore += completionScore;
        summary.totalDays += 1;
        summary.totalTasks += dayData.length;
        return {
          label: dayMoment.format('ll'), // Day of the Week
          labelDetail: dayMoment.format('ddd ll'), // full date
          clazz: classifyDay(dayMoment),
          rows: dayData.length || 1,
          completionScore: completionScore,
          tasks: dayData.map(function (taskData) {
            var id = normalizeOid(taskData._oid);
            var creation = moment(taskData.CreateDate);
            var change = moment(taskData.ChangeDate);
            return {
              name: taskData.Name,
              number: taskData.Number,
              url: process.env.V1_SERVER_BASE_URI + '/task.mvc/Summary?oidToken=' + id,
              age: creation.from(change, /*show 'ago' = */ true),
              ageDetail: creation.twix(change).format(),
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

      summary.averageCompletionScore = summary.completionScore / summary.totalDays;
      summary.averageTasksCompleted = summary.totalTasks / summary.totalDays;

      var options = {
        locals: {
          user: user,
          data: data,
          summary: summary,
          devMode: false,
          dataString: JSON.stringify(data, null, ' ')
        }
      };
      ejs.renderFile(templatePath, options, function (err, str) {
        if (err) {
          debug('err rendering', err);
          res.sent('failure rendering' + err);
        } else {
          res.send(str);
        }
      });
    } else {
      res.send('failure. :-(' + queryRes.text);
    }
  });
};

