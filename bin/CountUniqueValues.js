var debug = require('debug')('query-v1');

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

Analyzer.prototype.summary = function() {
  var that = this;
  this.keysToCheck.forEach(function (propName) {
    var allUnique = true;
    var uniqueValues = 0;
    Object.keys(that.values[propName]).forEach(function (propValue) {
      var count = that.values[propName][propValue];
      if (count > 1) {
        debug('%s: %s, count: %d', propName, propValue, count);
        allUnique = false;
      } else {
        uniqueValues++;
      }
    });

    if (allUnique) {
      debug('%s: all values were unique', propName);
    } else {
      debug('%s: %d unique value(s) omitted', propName, uniqueValues);
    }
  });
};

module.exports = Analyzer;