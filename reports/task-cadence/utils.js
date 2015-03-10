exports.normalizeOid = function (oid) {
  return oid.split(':').slice(0, 2).join(':')
};

exports.tasksForADay = function (userId, day) {
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
};

exports.classifyDay = function (dayMoment) {
  var dow = dayMoment.day();
  if (dow === 0 /* Sunday */ || dow === 6 /* Saturday */) {
    return 'holiday'
  }
  return dayMoment.dayOfYear() % 2 === 1 ? 'odd-day' : 'even-day'
}

exports.urlToUser = function (id) {
  return "https://www5.v1host.com/FH-V1/Member.mvc/Summary?oidToken=" + id;
}

