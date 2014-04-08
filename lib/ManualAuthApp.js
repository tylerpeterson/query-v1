/*jslint node: true */
"use strict";

var http = require('http'),
    express = require('express'),
    Q = require('q'),
    secrets = require('../client_secrets'),
    clientId = secrets.web.client_id,
    clientSecret = secrets.web.client_secret,
    redirectUri = "http://localhost:8088/auth/versionone/callback",
    authUri = secrets.web.auth_uri,
    tokenUri = secrets.web.token_uri,
    PORT = 8088,
    request = require('superagent');

function ManualAuthApp() {
  var server,
      rootThis = this,
      app = this.app = express();

  app.get('/start', function (req, res) {
    res.redirect(authUri +
      '?response_type=code' +
      '&client_id=' + clientId +
      '&redirect_uri=' + redirectUri +
      '&scope=ap1v1 query-api-1.0' +
      '&state=foobaz');
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
      tokenRequest = request.post(tokenUri)
        .send('client_id=' + clientId)
        .send('client_secret=' + clientSecret);

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
  return "http://localhost:8088/start";
};

ManualAuthApp.prototype.tokenPromise = function () {
  return this.tokenDfd.promise;
}

module.exports = ManualAuthApp;