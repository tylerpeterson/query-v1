var Q = require('q');
var debug = require('debug')('query-v1');
var _ = require('lodash');
var userService = require('../lib/userService');
var v1Query = require('../lib/v1Query');
var timeago = require('timeago');
var moment = require('moment');
var UAParser = require('ua-parser-js');
var util = require('util');

/*
 * GET users listing.
 */

exports.list = function(req, res){
  var flaggedOidsP = userService.getFlaggedOids();
  
  v1Query(req, {
      from: 'Member',
      select: [
        'Name', 'Nickname'
      ]
    })
    .end(function (queryRes) {
      if (queryRes.ok) {
        var allUsers = queryRes.body[0];
        var _oidIndex = _.indexBy(allUsers, '_oid');

        flaggedOidsP.then(function (flaggedOids) {
          var updatePromises = [];
          flaggedOids.forEach(function (_oid) {
            var current = _oidIndex[_oid];

            debug('updating %s with %s', _oid, JSON.stringify(current));
            updatePromises.push(userService.updateNameAndNickByOid(current));
          });
          return Q.allSettled(updatePromises).then(function (states) {
            debug('Update promises settled: %s', JSON.stringify(states, null, ' '));
            res.render('users', { 
              title: 'All Users', 
              users: allUsers, 
              isChecked: function(oid) {
                if (_.contains(flaggedOids, oid)) return 'checked';
                return '';
              }
            });
          });
        });
      } else {
        res.send('failure :-(\n' + queryRes.text);
      }
    });
};

exports.listFlagged = function (req, res) {
  debug('listFlagged>');
  userService.getFlaggedOids().then(function (flaggedOids) {
    debug('getFlaggedOids.then>');
    var query = flaggedOids.map(function (oid) {
      return {
        from: 'Member',
        select: [
          'Name', 'Nickname'
        ],
        where: {
          ID: oid
        }
      };
    });

    v1Query(req, query).end(function (queryRes) {
      var userData;

      if (queryRes.ok) {
        userData = _.flatten(queryRes.body)
        res.render('users', { 
          title: 'Flagged Users', 
          users: userData, 
          isChecked: function(oid) { // TODO sort out whether to show check boxes on both pages
            if (_.contains(flaggedOids, oid)) return 'checked';
            return '';
          }
        });
      } else {
        res.send('failure. :-(' + queryRes.text);
      }
    });
    debug('getFlaggedOids.then<');
  });
  debug('listFlagged<');
}

exports.listFlaggedTasks = function (req, res) {
  debug('listFlaggedTasks>');
  userService.getFlaggedOids().then(function (flaggedOids) {
    debug('getFlaggedOids.then>');
    var query = [];
    flaggedOids.forEach(function (oid) {
      query.push({
        "from": "Task",
        "select": [
          "Name",
          "Number",
          "Parent.Name",
          "Parent.Number",
          "Parent.ID",
          "ToDo",
          "Status.Name",
          "ChangeDate",
          {
            "from": "Owners",
            "select": [
              "Name",
              "ID"
            ]
          }
        ],
        "where": {
          "Owners.ID": "$memberOid"
        },
        "filter": [
          "AssetState=\"Active\""
        ],
        "sort": [
          "+Order"
        ],
        "comments": "change the nickname below to search for tasks assigned to different people.",
        "with": {
          "$memberOid": oid
        }
      });
      query.push({
        "from": "Member",
        "select": [
          "Name",
          "Nickname"
        ],
        "where": {
          "ID": oid
        }
      });
    });

    v1Query(req, query).end(function (queryRes) {
      var taskData = [];

      if (queryRes.ok) {
        var results = queryRes.body.slice();
        while (results.length > 0) {
          taskData.push({
            tasks: results.shift().map(function (task) {
              task.OwnersString = task.Owners.reduce(function (prev, cur) {
                if (prev) {
                  prev += ', ';
                }
                return prev + cur.Name + '(' + cur._oid + ')';
              }, "");

              task.ChangeTimeAgo = timeago(new Date(task.ChangeDate));

              task.StatusString = task['Status.Name'] || 'None';

              return task;
            }),
            user: results.shift()[0]
          })
        }
        debug('flagged user tasks', JSON.stringify(taskData, null, '  '));
        res.render('tasks', { 
          title: 'Flagged Users\' Tasks' ,
          data: taskData
        });
      } else {
        res.send('failure. :-(' + queryRes.text);
      }
    });
    debug('getFlaggedOids.then<');
  });
  debug('listFlaggedTasks<');
}

exports.postList = function (req, res) {
  userService.flagUserIffOidInSet(req.body.selectedUsers)
    .then(function (states) {
      debug('upsertsDone %s', JSON.stringify(states, null, ' '));
      res.redirect('/users');
    });
};
exports.listUserAccessHistory = function (req, res) {
  debug('listAccessHistory> %s', req.params.id);

  var uaParser = new UAParser();
  var query = [
    {
      "from": "Member",
      "select": [
        "Name",
        "Username",
        "Nickname",
        {
          "from": "Activity",
          "select": [
            "UserAgent",
            "ChangeDate",
            {
              "from": "History",
              "select": [
                "ChangeDate",
                "UserAgent"
              ]
            }
          ]
        }
      ],
      "where": {
        "ID": req.params.id
      }
    }
  ];
  v1Query(req, query).end(function (queryRes) {
    var historyData = [];

    if (queryRes.ok) {
      var results = queryRes.body[0][0]["Activity"][0]["History"].slice();
      while (results.length > 0) {
        var entry = results.shift();
        delete entry["_oid"];
        if (entry.UserAgent === null) {
          entry.agentSummary = "Probably via API"
        } else {
          uaParser.setUA(entry.UserAgent).getResult();
          entry.agentSummary = util.format('%s %s on %s', uaParser.getBrowser().name, uaParser.getBrowser().major, uaParser.getOS().name);
        }
        entry.moment = moment(entry.ChangeDate);
        debug("Parsed %s as %s", entry.ChangeDate, entry.moment.format());
        debug("Parsed %s as %s", entry.UserAgent, entry.agentSummary);

        historyData.push(entry);
      }
      historyData.sort(function (a, b) {
        if (a.moment.isAfter(b.moment)) return -1;
        if (a.moment.isSame(b.moment)) return 0;
        return 1;
      });
      var today = moment().startOf('day')
      var histogram = [
        {
          earliest: today,
          boxName: today.format('[Today,] ddd [the] Do'),
          count: 0
        }
      ];
      for (var x = 1; x < 14; ++x) {
        var thisMoment = moment().startOf('day').subtract(x, 'days');
        var boxName;
        if (thisMoment.day() === 0) continue; // Skip Sundays
        if (thisMoment.day() === 6) {
          // Saturday
          boxName = thisMoment.format("[Weekend of] ddd [the] Do");
        } else {
          boxName = thisMoment.format('ddd [the] Do (') + thisMoment.from(histogram[0].earliest) + ')'
        }

        histogram.push({
          earliest: thisMoment,
          boxName: boxName,
          count: 0
        });
      }
      for (x = 2; x < 14; ++x) {
        thisMoment = moment().startOf('day').add(1, 'd').subtract(x * 14, 'days')
        histogram.push({
          earliest: thisMoment,
          boxName: util.format('14 days starting %s (%d iterations ago)', thisMoment.format('ll'), x),
          count: 0
        });
      }
      for (x = 7; x < 13; ++x) {
        thisMoment = histogram[histogram.length - 1].earliest.clone().subtract(30, 'days');
        histogram.push({
          earliest: thisMoment,
          boxName: util.format('30 days starting %s (%d months ago)', thisMoment.format('ll'), x),
          count: 0
        });
      }
      for (x = 2; x < 4; ++x) {
        thisMoment = histogram[histogram.length - 1].earliest.clone().subtract(1, 'y')
        histogram.push({
          earliest: thisMoment,
          boxName: thisMoment.format('[a year starting ] ll'),
          count: 0
        });
      }

      var currentHistBox = 0;
      historyData.forEach(function (entry) {
        while (histogram[currentHistBox].earliest.isAfter(entry.moment)) {
          currentHistBox++;
          if (currentHistBox === histogram.length) break;
        }
        if (currentHistBox < histogram.length) {
          histogram[currentHistBox].count++;
        }
      });

      debug('histogram', histogram);
      // debug('user accesses', JSON.stringify(historyData, null, '  '));
      res.render('accesses', { 
        title: 'Access History for User' ,
        data: historyData,
        user: {_oid: queryRes.body[0][0]._oid, Name: queryRes.body[0][0].Name},
        histogram: histogram
      });
    } else {
      res.send('failure. :-(' + queryRes.text);
    }
  });
}
