#!/usr/bin/env node

const debug = require('debug')('query-v1');
const memberId = "Member:74617";
const utils = require('../lib/utils');

var memberAndTasksQuery = [
  {
    "from": "Member",
    "select": [ "Name", "Nickname" ],
    "where": { "ID": memberId }
  },
  {
    "from": "Task",
    "select": [ "Name", "Number", "Status.Name", "ChangeDate", "CreateDate", "DetailEstimate",
      {
        "from": "Owners",
        "select": [ "Name", "Nickname" ]
      },{
        "from": "Parent",
        "select": [ "Name", "Number" ]
      }
    ],
    "where": {
      "Owners.ID": memberId,
      "Status.Name": "Completed"
    },
    "filter": [
      "ChangeDate>'2017-01-01T00:00:00'"
    ],
    "sort": [
      "-ChangeDate"
    ],
    "asof": "2017-04-01T00:00:00"
  }
];

function storyQuery(storyId) {
  return {
    from: 'Story',
    select: [
      'Name', 'Number', 'ChangeDate', 'CreateDate',
      {
        from: 'Children',
        select: [
          'Name', 'Number', 'DetailEstimate',
          {
            from: 'Owners',
            select: [ 'Name', 'Nickname' ]
          }
        ]
      },
      {
        from: 'Owners',
        select: [ 'Name', 'Nickname' ]
      }
    ],
    where: {
      ID: storyId,
    }
  }
}

function storyRow({number = 'TK-UNKNOWN', name = '[NAME]', owners = [], linkUrl = ''} = {}) {
  const ownerSummary = `(${owners.length}) ` + owners.join(';');
  return `<tr><td>STORY<td> ${number} ${name} ${ownerSummary} $linkUrl`;
};

//debug('memberAndTasksQuery', JSON.stringify(memberAndTasksQuery, null, ' '));
var storiesPromise;

function report(req, res) {
  utils.loadCache('stories', () => {
    return utils.fetchV1(memberAndTasksQuery)
      .then(utils.filterErrors('first request:'))
      .then(response => response.json())
      .then(function (data) {
        const USER_QUERY_INDEX = 0;
        const TASKS_QUERY_INDEX = 1;
        const storyIdSet = {};
        debug('User', data[USER_QUERY_INDEX][0].Name);
        const storyQueries = data[TASKS_QUERY_INDEX].reduce((accumulator, currentTask) => {
          const parentStory = currentTask.Parent[0];
          const versionedParentId = parentStory._oid;
          const storyId = versionedParentId.replace(/:\d+$/, '');
          if (!storyIdSet.hasOwnProperty(storyId)) {
            debug('keeping ', storyId, parentStory.Name);

            accumulator.push(storyQuery(storyId));
            storyIdSet[storyId] = parentStory.Name;
          } else {
            debug('skipping duplicate', storyId);
          }
          return accumulator;
        }, []);
        return utils.fetchV1(storyQueries);
      })
      .then(utils.filterErrors('second request:'))
      .then(response => response.json())
  })
    .then(stories => {
      debug('Iterating over stories...');
          // td #{row.storyNumber}
          // td #{row.storyName}
          // td #{row.taskNumber}
          // td #{row.taskName}
          // td #{row.estimatedHours}
          // td #{row.ownedHours}
          // td #{row.contributionPercent}
          // td #{row.ownerCount}
          // td #{row.ownerList}
      var viewData = []
      stories.forEach(subResult => {
        const story = subResult[0];
        const storyRow = {
          storyNumber: story.Number,
          storyName: story.Name,
          taskNumber: '-',
          taskName: '-',
          estimatedHours: 0,
          ownedHours: 0
        };
        viewData.push(storyRow);

        const storyOwnerIds = new Set();
        const storyOwnerNames = [];

        function addOwner(ownerId, ownerName) {
          if (!storyOwnerIds.has(ownerId)) {
            storyOwnerIds.add(ownerId);
            storyOwnerNames.push(ownerName);
          }
        }

        story.Children.forEach(task => {
          const taskOwnerIds = new Set(task.Owners.map(owner => owner._oid));
          const estimatedHours = Number(task.DetailEstimate);
          var ownedHours = 0;
          var contributionPercent = 0;

          if (taskOwnerIds.has(memberId)) {
            ownedHours = Math.round(10 * estimatedHours / taskOwnerIds.size) / 10;
            contributionPercent = Math.round(100 / taskOwnerIds.size);
          }

          storyRow.estimatedHours += estimatedHours;
          storyRow.ownedHours += ownedHours;

          task.Owners.forEach(owner => addOwner(owner._oid, owner.Name));

          viewData.push({
            storyNumber: story.Number,
            storyName: '"',
            taskNumber: task.Number,
            taskName: task.Name,
            estimatedHours: estimatedHours,
            ownedHours: ownedHours || '-',
            contributionPercent: contributionPercent || '-',
            ownerCount: task.Owners.length,
            ownerList: task.Owners.map(owner => owner.Name).join(', ')
          });
        });
        storyRow.contributionPercent = Math.floor(100 * storyRow.ownedHours / storyRow.estimatedHours);
        storyRow.ownerList = storyOwnerNames.join(', ');
        storyRow.ownerCount = storyOwnerIds.size;
      });
      stories.forEach(subQueryResult => {
        const story = subQueryResult[0];
        console.log(storyRow({}));
        console.log('"' + ['STORY', story.Number, story.Name, story.Owners.map(owner => owner.Name).join(':'), utils.baseUris.story + story._oid].join('", "') + '"')
        const tasks = story.Children;
        tasks.forEach(task => {
          // console.log('"' + ['.', task.Number, task.Name, task.DetailEstimate, task.Owners.map(owner => owner.Name).join(':'), taskBaseUri + task._oid].join('", "') + '"');
        });
      })
      // debug(JSON.stringify(viewData, null, ' '));
      res.render('index', {rows: viewData});
      // debug(JSON.stringify(stories, null, ' '));
    })
    .catch(error => debug('failed to get data', error));
};

module.exports = report;
