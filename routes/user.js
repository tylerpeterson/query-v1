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
  debug('routes/user.js:list: START');
  var flaggedOidsP = userService.getFlaggedOids();
  
  v1Query(req, {
      from: 'Member',
      select: [
        'Name', 'Nickname'
      ]
    })
    .end(function (err, queryRes) {
      if (err) {
        debug('routes/user.js:list:Nicknames error');
        res.send('failure :-(\n' + queryRes.text);
        return;
      }

      debug('routes/user.js:list:Nicknames SUCCESS');
      require('fs').writeFileSync('probe.DUMP', JSON.stringify(queryRes.body, null, ' '));
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

    v1Query(req, query).end(function (err, queryRes) {
      var userData;

      if (!err) {
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

exports.listAllTasks = function (req, res) {
  var query = [
    {
      "from": "Member",
      "select": [
        "Name",
        "Nickname"
      ],
      "where": {
        "ID": req.params.id
      }
    },{
      "from": "Task",
      "select": [
        "Name",
        "Number",
        "Status.Name",
        "ChangeDate"
      ],
      "where": {
        "Owners.ID": req.params.id
      },
      "sort": [
        "-ChangeDate"
      ]    
    }];

  debug('listAllTasks');
  v1Query(req, query).end(function (err, queryRes) {
    var viewData = {
      title: "All Tasks for User"
    };
    if (!err) {
      viewData.user = queryRes.body[0][0];
      viewData.tasks = queryRes.body[1];
      res.render('all-tasks', viewData);
    } else {
      res.send('failure. :-(' + queryRes.text);
    }
  });
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

    v1Query(req, query).end(function (err, queryRes) {
      var taskData = [];

      if (!err) {
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

exports.linksForUser = function (req, res) {
  v1Query(req, {
    "from": "Member",
    "select": [
      "Name",
      "Nickname"
    ],
    "where": {
      "ID": req.params.userId
    }
  }).end(function (err, queryRes) {
    if (!err) {
      debug(JSON.stringify(queryRes.body, null, '  '));
      res.render('linksForUser', {
        userId: req.params.userId,
        title: 'Links for ' + queryRes.body[0][0].Name
      });      
    } else {
      res.send('failure :-(');
    }
  });
};

exports.postList = function (req, res) {
  userService.flagUserIffOidInSet(req.body.selectedUsers)
    .then(function (states) {
      debug('upsertsDone %s', JSON.stringify(states, null, ' '));
      res.redirect('/users');
    });
};

function historyQuery(oid) {
  debug('historyQuery>', oid);
  return {
    "from": "Member",
    "select": [
      "Name",
      {
        "from": "Activity",
        "select": [
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
      "ID": oid
    }
  };
}

exports.listFlaggedAccessHistories = function (req, res) {
  debug('listFlaggedAccessHistories>');
  userService.getFlaggedOids().then(function (flaggedOids) {
    debug('getFlaggedOids.then>', flaggedOids);
    var query = flaggedOids.map(historyQuery);

    debug('getFlaggedOids.then>2');
    v1Query(req, query).end(function (err, queryRes) {
      debug('v1Query.end>');
      if (!err) {
        var viewData = {
          data: queryRes.body.map(processMemberResultIntoViewData)
        }

        viewData.title = 'See Access History of Flagged Users';
        debug('flagged user histories', JSON.stringify(viewData, null, '  '));
        res.render('flaggedAccesses', viewData);
      } else {
        res.send('failure. :-(' + queryRes.text);
      }
    });
    debug('getFlaggedOids.then<');
  });
}

var processMemberActivityHistoryResults = function () {
  var uaParser = new UAParser();

  return function processMemberActivityHistoryResults(json) {
    var historyData = [];
    debug("Data", JSON.stringify(json, null, ' '));
    var results = [];
    if (json[0]["Activity"].length > 0) {
      results = json[0]["Activity"][0]["History"].slice();
    }

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
    return historyData;
  }
}();

function createHistogram(historyData) {
  var histogram = createHistogramBoxes();
  var currentHistBox = 0;

  historyData.forEach(function (entry) {
    if (currentHistBox === histogram.length) return;

    while (histogram[currentHistBox].earliest.isAfter(entry.moment)) {
      currentHistBox++;
      if (currentHistBox === histogram.length) return;
    }
    if (currentHistBox < histogram.length) {
      histogram[currentHistBox].count++;
    }
  });

  histogram.forEach(function (entry) {
    entry.countSummary = countToString(entry.count);
  });

  return histogram;
}

function countToString(count) {
  var result = '';
  if (count > 0) {
    result += count;
  }
  while (count > 99) {
    result += '#';
    count -= 100;
  }
  while (count > 9) {
    result += '|';
    count -= 10;
  }
  while (count > 0) {
    result += ':';
    count--;
  }
  return result;
}

function processMemberResult(memberJson) {
  return {_oid: memberJson[0]._oid, Name: memberJson[0].Name};
}

function processMemberResultIntoViewData(memberJson) {
  var data = processMemberActivityHistoryResults(memberJson);
  var viewData = {
    data: data,
    histogram: createHistogram(data),
    user: processMemberResult(memberJson) 
  };
  return viewData;
}

exports.listUserAccessHistory = function (req, res) {
  debug('listAccessHistory> %s', req.params.id);

  var query = [ historyQuery(req.params.id) ];

  v1Query(req, query).end(function (err, queryRes) {
    if (!err) {
      var viewData = processMemberResultIntoViewData(queryRes.body[0]);

      viewData.title =  'Access History for User';
      res.render('accesses', viewData);
    } else {
      res.send('failure. :-(' + queryRes.text);
    }
  });
}

function createHistogramBoxes() {
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
  return histogram; 
}

