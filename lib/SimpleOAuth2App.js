var http = require('http'),
    express = require('express'),
    exec = require('child_process').exec,
    events = require('events'),
    util = require('util'),
    debug = require('debug')('SimpleOAuth2App'),
    Q = require('q'),
    PORT = 8088,
    secrets = require('../client_secrets'),
    clientId =
    clientName = secrets.web.client_name,
    clientSecret =
    redirectUri = "http://localhost:8088/auth/versionone/callback",
    authUri =
    tokenUri = secrets.web.token_uri,
    serverBaseUri = secrets.web.server_base_uri,
    OAuth2 = require('simple-oauth2')({
      clientID: secrets.web.client_id,
      clientSecret: secrets.web.client_secret,
      site: secrets.web.auth_uri, // or should this be server_base_uri?
      tokenPath: '/oauth/access_token'
    });;

function SimpleOAuth2App() {
  var server,
      thisAuthApp = this;

  this.tokenDfd = Q.defer();
  this.app = express();
var

// Authorization uri definition
var authorization_uri = OAuth2.AuthCode.authorizeURL({
  redirect_uri: 'http://localhost:3000/callback',
  scope: 'notifications',
  state: '3(#0/!~'
});

// Initial page redirecting to Github
app.get('/auth', function (req, res) {
    res.redirect(authorization_uri);
});

  this.app.get('/', function(req, res) {
    thisAuthApp.destroy();
    res.send('hello world');
    res.end();
    thisAuthApp.tokenDfd.resolve("aNiftyOauthToken");
  });

  this.app.listen(PORT);
  this.server = http.createServer(this.app);
  server = this.server;

  server.on('connection', function (socket) {
    debug('server has a new connection', socket.remoteAddress, socket.remotePort);
  });
  server.on('close', function (event) {
    debug('caught close event', event);
  });

  server.listen(PORT);
}

SimpleOAuth2App.prototype.port = function () {
  return this.server.address().port;
};

SimpleOAuth2App.prototype.url = function() {
  return 'http://localhost:' + this.port() + '/';
};

SimpleOAuth2App.prototype.tokenPromise = function () {
  return this.tokenDfd.promise;
};

module.exports = SimpleOAuth2App;