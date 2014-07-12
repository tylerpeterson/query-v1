var DataStore = require('nedb');
var path = require('path');
var debug = require('debug')('query-v1');
var Q = require('q');

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
  users: users,
  flagUserByOid: function (userOid) {
    return Q.ninvoke(users, "update",
      {
        _oid: userOid
      }, {
        $set: {
          flagged: true,
          _oid: userOid
        }
      }, {
        upsert: true
      });
  }
}