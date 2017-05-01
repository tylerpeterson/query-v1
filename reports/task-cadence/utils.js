var isHoldiay = require('../../lib/holiday');

exports.normalizeOid = function (oid) {
  return oid.split(':').slice(0, 2).join(':');
};

exports.tasksForADay = function (userId, day) {
  return {
    from: 'Task',
    select: [
      'Name',
      'Number',
      'Status.Name',
      'ChangeDate',
      'CreateDate',
      'DetailEstimate',
      {
        from: 'Owners',
        select: [
          'Name',
          'Nickname'
        ]
      }
    ],
    where: {
      'Owners.ID': userId,
      'Status.Name': 'Completed'
    },
    filter: [
      'ChangeDate>\'' + day + 'T00:00:00\''
    ],
    sort: [
      '-ChangeDate'
    ],
    asof: day + 'T23:59:59'
  };
};

const SUNDAY = 0;
const SATURDAY = 6;

exports.classifyDay = function (dayMoment) {
  var dayOfWeek = dayMoment.day();
  if (dayOfWeek === SUNDAY || dayOfWeek === SATURDAY) {
    return 'holiday';
  }
  if (isHoldiay(dayMoment.toDate())) {
    return 'holiday';
  }
  return dayMoment.dayOfYear() % 2 === 1 ? 'odd-day' : 'even-day';
};

exports.parseUrlParams = function (queryString) {
  var match;
  var pl = /\+/g;  // Regex for replacing addition symbol with a space
  var search = /([^&=]+)=?([^&]*)/g;
  var decode = function (s) { return decodeURIComponent(s.replace(pl, ' ')); };
  var urlParams = {};

  while (match = search.exec(queryString)) {
    urlParams[decode(match[1])] = decode(match[2]);
  }

  return urlParams;
};

exports.urlToUser = function (id) {
  return process.env.V1_SERVER_BASE_URI + '/Member.mvc/Summary?oidToken=' + id;
};

