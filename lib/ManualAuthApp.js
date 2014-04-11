/*jslint node: true */
"use strict";

var debug = require('debug')('query-v1'),
    Q = require('q'),
    request = require('superagent');

function ManualAuthApp(secrets, options) {
  var rootThis = this,
      app = options.app;

  this.clientId = secrets.web.client_id;
  this.clientSecret = secrets.web.client_secret;
  this.authUri = secrets.web.auth_uri;
  this.tokenUri = secrets.web.token_uri;
  this.appBaseUrl = options.appBaseUrl;
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

module.exports = ManualAuthApp;