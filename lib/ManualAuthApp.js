/*jslint node: true */
"use strict";

var debug = require('debug')('query-v1');
var Q = require('q');
var request = require('superagent');

function ManualAuthApp(secrets, options) {
  var rootThis = this;
  var app = options.app;

  this.clientId = secrets.web.client_id;
  this.clientSecret = secrets.web.client_secret;
  this.authUri = secrets.web.auth_uri;
  this.tokenUri = secrets.web.token_uri;
  this.appBaseUrl = options.appBaseUrl;
  this.cacheDirectory = options.cacheDirectory || process.cwd();
  this.appReturnUrl = this.appBaseUrl + "/auth/versionone/callback";

  app.get('/start', function (req, res) {
    var authUri = rootThis.authUri +
      '?response_type=code' +
      '&client_id=' + rootThis.clientId +
      '&redirect_uri=' + rootThis.appReturnUrl +
      '&scope=ap1v1 query-api-1.0' +
      '&state=foobaz';
    debug('/start redirecting to %s', authUri);
    res.redirect(authUri);
  });

  app.get('/auth/versionone/callback', function (req, res) {
    var pageRes = res;
    var tokenPromise;
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

  this.tokenDfd = Q.defer();
}

/** Resolve an authorization code OR a refresh token into an access token.
 * Must be called with either
 *   {code: "**authorization code from oauth flow calback**"}
 *   -- OR --
 *   {refreshToken: "**refresh token from previous successful flow**"}
 */
ManualAuthApp.prototype.hitTokenUri = function (params) {
  var dfd = Q.defer();
  var tokenRequest = request.post(this.tokenUri)
        .send('client_id=' + this.clientId)
        .send('client_secret=' + this.clientSecret);

  if (params.code) {
    tokenRequest = tokenRequest
      .send('code=' + params.code)
      .send('grant_type=authorization_code')
      .send('redirect_uri=' + this.appReturnUrl)
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
  return this.appBaseUrl + "/start";
};

ManualAuthApp.prototype.tokenPromise = function () {
  return this.tokenDfd.promise;
};

// TODO make the auth app responsible for caching and maintaining the tokens

// TODO lazily obtain a refresh token
ManualAuthApp.prototype.refreshTokenPromise = function() {
  // IDEA: Consider a forceRefresh option to ignore cached refresh tokens
  if (!this.refreshTokenDfd) {
    this.refreshToken = Q.defer();

    // TODO attempt reading from file cache

    // TODO generate a new token via oauth if necessary

  }

  return this.refreshTokenDfd.promise;
};

// TODO lazily obtain an accessToken
ManualAuthApp.prototype.accessTokenPromise = function(forceRefresh) {
  if (!this.accessTokenDfd || this.accessTokenIsStale() || forceRefresh) {
    // access token is too stale, doesn't exist, or we are being forced to refresh

    // TODO reject unfulfilled promises? Deal with forceRefresh and normal refresh conflicts

    this.refreshTokenPromise().then(function () {

    }, function (err) {

    });
  }

  return this.accessTokenDfd.promise;
};

ManualAuthApp.prototype.accessTokenIsStale = function() {
  // TODO return true if the access token I have is "too close" to its expiration time, or past it.
};

module.exports = ManualAuthApp;