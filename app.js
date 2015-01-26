
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var timebox = require('./routes/timebox');
var scope = require('./routes/scope');
var http = require('http');
var path = require('path');
var url = require('url');
var secrets = require('./client_secrets');
var AuthApp = require('v1oauth').app;
var bodyParser = require('body-parser');
var favicon = require('serve-favicon');
var logger = require('morgan');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var errorHandler = require('errorhandler');

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
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(methodOverride());
app.use(cookieParser('your secret here'));
app.use(session());

app.get('/', routes.index);
app.get('/users', auth.restrict, user.list);
app.post('/users', auth.restrict, user.postList);
app.get('/users/flagged', auth.restrict, user.listFlagged);
app.get('/users/flagged/tasks', auth.restrict, user.listFlaggedTasks);
app.get('/user/:id/accesses', auth.restrict, user.listUserAccessHistory);
app.get('/users/flagged/accesses', auth.restrict, user.listFlaggedAccessHistories);
app.use(timebox.getRouter(auth.restrict));
app.use(scope.getRouter(auth.restrict));
app.get('/user/:id/all-tasks', auth.restrict, user.listAllTasks);

app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(auth.router);

// development only
if ('development' == app.get('env')) {
  app.use(errorHandler());
}

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
