
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
var secrets = require('./lib/load-secrets')('../client_secrets');
var bodyParser = require('body-parser');
var favicon = require('serve-favicon');
var logger = require('morgan');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var errorHandler = require('errorhandler');
var debug = require('debug')('query-v1');

var app = express();
var port = secrets.port;

debug('binding to port', port);

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
app.get('/users', user.list);
app.post('/users', user.postList);
app.get('/users/flagged', user.listFlagged);
app.get('/users/flagged/tasks', user.listFlaggedTasks);
app.get('/users/:userId', user.linksForUser);
app.get('/user/:id/accesses', user.listUserAccessHistory);
app.get('/users/flagged/accesses', user.listFlaggedAccessHistories);
app.use(timebox.getRouter());
app.use(scope.getRouter());
app.get('/user/:id/all-tasks', user.listAllTasks);
app.get('/user/:userId/done-tasks',
    require('./reports/task-cadence/one-user-controller').reportByUserId);
app.get('/users/flagged/task-cadence',
    require('./reports/task-cadence/flagged-users-controller').report);
app.get('/user/:userId/cadence/year',
    require('./reports/task-cadence/user-year-controller').reportByUserId);

app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(errorHandler());
}

http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});
