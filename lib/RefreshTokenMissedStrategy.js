var debug = require('debug')('query-v1');
var exec = require('child_process').exec;

module.exports = {
  launchBrowser: function (authApp) {
    return function (dfd) {
      debug("opening web page", authApp.url());
      var browserProcess = exec('open ' + authApp.url(), function (error, stdout, stderr) {
        if (error !== null) {
          debug('error', error);
        }
      });
      // TODO how do I resolve the deferred?
    };
  },

  rejectPromise: function (authApp) {
    return function (dfd) {
      dfd.reject();
    };
  }
};