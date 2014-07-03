
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var url = require('url');
var secrets = require('./client_secrets');
var AuthApp = require('v1oauth').app;
var bodyParser = require('body-parser');

var app = express();
var port = url.parse(secrets.web.redirect_uris[0]).port;
var auth = new AuthApp(secrets, {appBaseUrl: appBaseFromSecrets(secrets), secureCookies: false});

// TODO push this kind of helper into v1oauth
function appBaseFromSecrets(secrets) {
  var returnRedirectUri = secrets.web.redirect_uris[0];
  var tmp = url.resolve(returnRedirectUri, '/');
  return tmp.substr(0, tmp.length - 1);
}

// all environments
app.set('port', port);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(bodyParser());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(auth.router);

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', auth.restrict, user.list);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
