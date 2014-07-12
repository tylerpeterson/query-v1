var DataStore = require('nedb');
var path = require('path');
var debug = require('debug')('query-v1');
var Q = require('q');
var _ = require('lodash');

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

function flagUserByOid(userOid) {
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

function unflagUsersExceptByOids(allowedOids) {
  return Q.ninvoke(users, 'update', 
    {
      flagged: true,
      _oid: {
        $nin: allowedOids
      }
    }, {
      $set: {
        flagged: false
      }
    }, {
      upsert: false,
      multi: true
    });
}


module.exports = {
  flagUserIffOidInSet: function (flaggedUserOids) {
    var promises = [ unflagUsersExceptByOids(flaggedUserOids) ];
    promises = promises.concat(flaggedUserOids.map(flagUserByOid));
    return Q.allSettled(promises);
  },
  getFlaggedOids: function () {
    return Q.ninvoke(users, 'find', {flagged: true})
      .then(function (flaggedUsers) { // TODO handle db err as well
        return _.pluck(flaggedUsers, '_oid')
      });
  },
  updateNameAndNickByOid: function (userData) {
    return Q.ninvoke(users, 'update',
      {
        _oid: userData._oid
      }, {
        $set: {
          Name: userData.Name,
          Nickname: userData.Nickname
        }
      }, {
        upsert: false
      });
  }
}