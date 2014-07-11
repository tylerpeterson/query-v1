var request = require('superagent');
var secrets = require('../client_secrets'); // TODO shouldn't have to require this again, already in v1oauth
var serverBaseUri = secrets.web.server_base_uri; // TODO shouldn't have to look this up. Use v1oauth.
var DataStore = require('nedb');
var path = require('path');
var Q = require('q');
var debug = require('debug')('query-v1');
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

/*
 * GET users listing.
 */

exports.list = function(req, res){
  var query = {
    from: 'Member',
    select: [
      'Name', 'Nickname'
    ]
  };
  var token = req.cookies.v1accessToken; // TODO shouldn't read off of the cookie, let v1oauth know that stuff.  
  var flaggedUsersP = Q.ninvoke(users, 'find', {flagged: true});
  request
    .get(serverBaseUri + '/query.v1') // TODO v1oauth should help with this url
    .set('Authorization', 'Bearer ' + token) // TODO v1oauth should help with setting this header
    .send(query)
    .end(function (queryRes) {
      if (queryRes.ok) {
        var allUsers = queryRes.body[0];
        var _oidIndex = _.indexBy(allUsers, '_oid');

        return flaggedUsersP.then(function (flaggedUsers) { // TODO handle db err as well
          var flaggedOids = _.pluck(flaggedUsers, '_oid');
          var updatePromises = [];

          flaggedOids.forEach(function (_oid) {
            var current = _oidIndex[_oid];
            
            debug('updating %s with %s', _oid, JSON.stringify(current));
            updatePromises.push(Q.ninvoke(users, 'update',
              {
                _oid: _oid
              }, {
                $set: {
                  Name: current.Name,
                  Nickname: current.Nickname
                }
              }, {
                upsert: false
              }));
          });
          return Q.allSettled(updatePromises).then(function (states) {
            debug('Update promises settled: %s', JSON.stringify(states, null, ' '));
            res.render('users', { 
              title: 'All Users', 
              users: allUsers, 
              isChecked: function(oid) {
                if (_.contains(flaggedOids, oid)) return 'checked';
                return '';
              }
            });
          });
        });
      } else {
        res.send('failure :-(\n' + queryRes.text);
      }
    });
};

exports.postList = function (req, res) {
  var upsertPromises = [];

  upsertPromises.push(Q.ninvoke(users, 'update', 
    {
      flagged: true,
      _oid: {
        $nin: req.body.selectedUsers
      }
    }, {
      $set: {
        flagged: false
      }
    }, {
      upsert: true
    }));
  req.body.selectedUsers.forEach(function (userOid) {
    upsertPromises.push(Q.ninvoke(users, "update",
      {
        _oid: userOid
      }, {
        $set: {
          flagged: true,
          _oid: userOid
        }
      }, {
        upsert: true
      }));
  });
  Q.allSettled(upsertPromises).then(function (states) {
    debug('upsertsDone %s', JSON.stringify(states, null, ' '));
    res.redirect('/users');
  });
};