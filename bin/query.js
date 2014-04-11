#!/usr/bin/env node

var http = require('http'),
    express = require('express'),
    program = require('commander'),
    exec = require('child_process').exec,
    AuthApp = require('../lib/ManualAuthApp'),
    debug = require('debug')('query-v1'),
    secrets = require('../client_secrets'),
    serverBaseUri = secrets.web.server_base_uri,
    // query = require('./scopes');
    query = require('./backlog');
    // query = require('./tasks-for-owner-example');

var fs = require('fs'),
    Q = require('q'),
    request = require('superagent');

program
  .version('0.0.1')
  .option('-c, --count [number]', 'specify how many names to emit. default 1', '1')
  .parse(process.argv);

var app = express(),
    auth = new AuthApp(secrets, {appBaseUrl: "http://localhost:8088", app: app}),
    server = http.createServer(app),
    url = auth.url(),
    tokenPromise = auth.tokenPromise(),
    accessTokenDfd = Q.defer(),
    accessTokenPromise = accessTokenDfd.promise,
    refreshTokenDfd = Q.defer(),
    refreshTokenPromise = refreshTokenDfd.promise;

server.listen(8088);

function storeTokens(tokens) {
  var accessToken = tokens.access_token,
      refreshToken = tokens.refresh_token;

  debug('storing tokens');
  fs.writeFileSync('.tokens', JSON.stringify({accessToken: accessToken, refreshToken: refreshToken}));
}

try {
  var tokens = JSON.parse(fs.readFileSync('.tokens'));

  if (tokens && tokens.refreshToken) {
    refreshTokenDfd.resolve(tokens.refreshToken);
  }
} catch (err) {}

if (refreshTokenPromise.isPending()) {
  debug("opening web page", url);
  var browserProcess = exec('open ' + url, function (error, stdout, stderr) {
    if (error !== null) {
      debug('error', error);
    }
  });

  tokenPromise.then(function (token) {
    var accessToken = token.access_token,
        refreshToken = token.refresh_token;

    debug('got a token', token);
    fs.writeFileSync('.tokens', JSON.stringify({accessToken: accessToken, refreshToken: refreshToken}));
    accessTokenDfd.resolve(accessToken);
    refreshTokenDfd.resolve(refreshToken);
  });
} else {
  refreshTokenPromise.then(function resolved(refreshToken) {
    var tokensPromise = auth.hitTokenUri({refreshToken: refreshToken});
    tokensPromise.then(function resolved(tokens) {
      debug('successfully refreshed');
      storeTokens(tokens);
      accessTokenDfd.resolve(tokens.access_token);
    }, function rejected(err) {
      accessTokenDfd.reject('error refreshing for new access token' + err);
    });
  });
}

Q.all([accessTokenPromise, refreshTokenPromise]).spread(function (accessToken, refreshToken) {
  debug('making a test request with bearer token'/*, accessToken*/);
  debug('query', query);
  request
      .get(serverBaseUri + '/query.v1')
      .set('Authorization', 'Bearer ' + accessToken)
      .send(query)
      .end(function (res) {
          if (res.ok) {
            debug('successful request!', JSON.stringify(res.body));
          } else {
            debug("failed to get data", res.text);
          }
      });
});
