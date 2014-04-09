/*jslint node: true */
"use strict";

var http = require('http'),
    express = require('express'),
    debug = require('debug')('query-v1'),
    Q = require('q'),
    myBaseUrl = "http://localhost:8088",
    redirectUri = myBaseUrl + "/auth/versionone/callback",
    PORT = 8088,
    request = require('superagent');

// TODO make the auth app self contained enough that you pass in an app instead of making and starting your own.
function ManualAuthApp(secrets) {
  var server,
      rootThis = this,
      app = this.app = express();

  this.clientId = secrets.web.client_id;
  this.clientSecret = secrets.web.client_secret;
  this.authUri = secrets.web.auth_uri;
  this.tokenUri = secrets.web.token_uri;

  app.get('/start', function (req, res) {
    var authUri = rootThis.authUri +
      '?response_type=code' +
      '&client_id=' + rootThis.clientId +
      '&redirect_uri=' + redirectUri +
      '&scope=ap1v1 query-api-1.0' +
      '&state=foobaz';
    debug('/start redirecting to %s', authUri);
    res.redirect(authUri);
  });

  app.get('/auth/versionone/callback', function (req, res) {
    var pageRes = res,
        tokenPromise;
    if (req.param('code')) {
      tokenPromise = rootThis.hitTokenUri({code: req.param('code')});
      tokenPromise.then(function fulfilled(tokensJson) {
        rootThis.tokenDfd.resolve(tokensJson);
        pageRes.send('got token');
        pageRes.end();
      }, function rejected(errMessage) {
        rootThis.tokenDfd.reject('error turning code into token', errMessage);
        pageRes.send('failed to get token');
        pageRes.end();
      });
    } else {
      rootThis.tokenDfd.reject("error obtaining authorization code");
      res.send("Didn't get authorization code!");
      res.end();
    }
  });

  server = this.server = http.createServer(app);
  server.listen(PORT);
  this.tokenDfd = Q.defer();
}

/** Resolve an authorization code OR a refresh token into an access token.
 * Must be called with either
 *   {code: "**authorization code from oauth flow calback**"}
 *   -- OR --
 *   {refreshToken: "**refresh token from previous successful flow**"}
 */
ManualAuthApp.prototype.hitTokenUri = function (params) {
  var dfd = Q.defer(),
      tokenRequest = request.post(this.tokenUri)
        .send('client_id=' + this.clientId)
        .send('client_secret=' + this.clientSecret);

  if (params.code) {
    tokenRequest = tokenRequest
      .send('code=' + params.code)
      .send('grant_type=authorization_code')
      .send('redirect_uri=' + redirectUri)
      .send('scope=apiv1 query-api-1.0');
  } else if (params.refreshToken) {
    tokenRequest = tokenRequest
      .send('refresh_token=' + params.refreshToken)
      .send('grant_type=refresh_token');
  } else {
    dfd.reject('must call with code or refreshToken');
  }
  tokenRequest
    .end(function (res) {
      if (res.ok) {
        dfd.resolve(res.body);
      } else {
        dfd.reject("error getting access token", res.text);
      }
    });
  return dfd.promise;
};

ManualAuthApp.prototype.url = function () {
  return myBaseUrl + "/start";
};

ManualAuthApp.prototype.tokenPromise = function () {
  return this.tokenDfd.promise;
};

module.exports = ManualAuthApp;