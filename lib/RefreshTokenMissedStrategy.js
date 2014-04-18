var debug = require('debug')('query-v1');
var exec = require('child_process').exec;

module.exports = {
  launchBrowser: function (startUrl) {
    return function (dfd) {
      debug("opening web page", startUrl);
      var browserProcess = exec('open ' + startUrl, function (error, stdout, stderr) {
        if (error !== null) {
          debug('error', error);
        }
      });
      // TODO how do I resolve the deferred?
    };
  },

  rejectPromise: function (dfd) {
    dfd.reject();
  }
};