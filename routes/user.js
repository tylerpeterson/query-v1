var request = require('superagent');
var secrets = require('../client_secrets'); // TODO shouldn't have to require this again, already in v1oauth
var serverBaseUri = secrets.web.server_base_uri; // TODO shouldn't have to look this up. Use v1oauth.

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
  request
    .get(serverBaseUri + '/query.v1') // TODO v1oauth should help with this url
    .set('Authorization', 'Bearer ' + token) // TODO v1oauth should help with setting this header
    .send(query)
    .end(function (queryRes) {
      if (queryRes.ok) {
        res.render('users', { title: 'All Users', users: queryRes.body[0]});
      } else {
        res.send('failure :-(\n' + queryRes.text);
      }
    });
};

exports.postList = function (req, res) {
  // TODO persist selection
  console.log(req.body);
  res.redirect('/users');
};