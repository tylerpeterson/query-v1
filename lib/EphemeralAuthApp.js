var http = require('http'),
    express = require('express'),
    exec = require('child_process').exec,
    events = require('events'),
    util = require('util'),
    debug = require('debug')('EphemeralAuthApp'),
    Q = require('q');

function AllResTracker() {
  if (!(this instanceof AllResTracker)) return new AllResTracker();
  events.EventEmitter.call(this);
  this.responses = [];
  this.connections = [];
}
util.inherits(AllResTracker, events.EventEmitter);

AllResTracker.prototype.createMiddleware = function createMiddleware() {
  var allResTracker = this;
  return function (req, res, next) {
    allResTracker.track(req, res, next);
  };
};

AllResTracker.prototype.track = function track(req, res, next) {
  this.watchForResponseToComplete(res);
  this.watchForConnectionToClose(req.socket);
  next();
};

AllResTracker.prototype.watchForResponseToComplete = function watchForResponseToComplete(res) {
  var allResTracker = this,
      responses = this.responses;

  if (responses.indexOf(res) !== -1) {
    return;
  }

  responses.push(res);

  res.on('finish', function () {
    var index = responses.indexOf(res);

    debug('A response completed');
    if (index !== -1) {
      responses.splice(index, 1);
    }

    if (responses.length === 0) {
      debug('allResTracker emitting finish');
      allResTracker.emit('finish');
    }
  });
};

AllResTracker.prototype.watchForConnectionToClose = function (socket) {
  var allResTracker = this,
      connections = this.connections;

  if (connections.indexOf(socket) !== -1) {
    return;
  }

  connections.push(socket);

  socket.on('close', function () {
    var index = connections.indexOf(socket);

    debug('A connection closed');

    if (index !== -1) {
      connections.splice(index, 1);
    }
  });
};

AllResTracker.prototype.pendingResponses = function () {
  return this.responses.length;
};

AllResTracker.prototype.closeAllConnections = function () {
  debug('AllResTracker closeAllConnections');
  this.connections.forEach(function (socket) {
    debug('AllResTracker closing a socket...');
    socket.setKeepAlive(false);
    socket.end();
    socket.unref();
  });
  this.connections.splice(0, this.connections.length);
};

function EphemeralAuthApp() {
  var server,
      thisAuthApp = this,
      allResTracker = new AllResTracker();

  this.tokenDfd = Q.defer();
  this.connections = [];
  this.app = express();
  this.app.use(allResTracker.createMiddleware());
  allResTracker.on('finish', function() {
    debug('allResTracker finish caught');
    if (thisAuthApp.closed) {
      debug('auth app closed.  Closing all connections');
      allResTracker.closeAllConnections();
      server.unref();
    }
  });

  this.app.get('/', function(req, res) {
    thisAuthApp.destroy();
    res.send('hello world');
    res.end();
    thisAuthApp.tokenDfd.resolve("aNiftyOauthToken");
  });

  this.server = http.createServer(this.app);
  server = this.server;

  server.on('connection', function (socket) {
    debug('server has a new connection', socket.remoteAddress, socket.remotePort);
    thisAuthApp.trackConnection(socket);
  });
  server.on('close', function (event) {
    debug('caught close event', event);
  });

  server.listen();
}

EphemeralAuthApp.prototype.trackConnection = function (socket) {
  this.connections.push(socket);
};

EphemeralAuthApp.prototype.port = function () {
  return this.server.address().port;
};

EphemeralAuthApp.prototype.url = function() {
  return 'http://localhost:' + this.port() + '/';
};

EphemeralAuthApp.prototype.destroy = function () {
  if (!this.closed) {
    this.closed = true;
    this.server.close();
  }
};

EphemeralAuthApp.prototype.tokenPromise = function () {
  return this.tokenDfd.promise;
};

module.exports = EphemeralAuthApp;