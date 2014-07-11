var DataStore = require('nedb');
var path = require('path');
var debug = require('debug')('query-v1');

/*\
 * Set up data store
\*/

var users = new DataStore({
  filename: path.join(__dirname, '..', 'cache', 'users.nedb'),
  autoload: true,
  onload: function (err) {
    if (err) console.log('error loading user database', err);
  }
});

function indexReporter(indexName) {
  return function (err) {
    if (err) {
      debug('err adding index %s', indexName, err);
    } else {
      debug('success adding index %s', indexName);
    }
  };
}

users.ensureIndex({fieldName: '_oid', unique: true}, indexReporter('_oid'));
users.ensureIndex({fieldName: 'flagged', unique: false, sparse: true}, indexReporter('flagged'));

module.exports = {
  users: users
}