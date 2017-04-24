var util = require('util');

function Analyzer (keysToCheck) {
  this.keysToCheck = keysToCheck;
  this.values = {};
}

Analyzer.prototype.addRecord = function(record) {
  var that = this;
  this.keysToCheck.forEach(function (propName) {
    var propValue = record[propName];
    that.values[propName] = that.values[propName] || {};
    that.values[propName][propValue] = (that.values[propName][propValue] || 0) + 1;
  });
};

// TODO stream results instead of big string?
Analyzer.prototype.summary = function() {
  var that = this;
  var report = '';

  this.keysToCheck.forEach(function (propName) {
    var allUnique = true;
    var uniqueValues = 0;
    Object.keys(that.values[propName]).forEach(function (propValue) {
      var count = that.values[propName][propValue];
      if (count > 1) {
        report += util.format('%s: %s, count: %d\n', propName, propValue, count);
        allUnique = false;
      } else {
        uniqueValues++;
      }
    });

    if (allUnique) {
      report += util.format('%s: all values were unique\n', propName);
    } else {
      report += util.format('%s: %d unique value(s) omitted\n', propName, uniqueValues);
    }
  });

  return report;
};

module.exports = Analyzer;