var debug = require('debug')('query-v1');
var templatePath = require.resolve('./flagged-users-view.ejs');
var ejs = require('ejs');

exports.report = function (req, res) {
  debug('taskCadenceForFlagged');
  var options = {
    locals: {
      devMode: true,
      dataString: 'NO DATA'
    }
  }
  ejs.renderFile(templatePath, options, function (err, str) {
    if (err) {
      debug('err rendering', err);
      res.send('failure rendering' + err);
    } else {
      res.send(str);
    }
  });
}
