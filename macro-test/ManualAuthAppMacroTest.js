var express = require('express');
var AuthApp = require('../lib/ManualAuthApp');
var secrets = require('../client_secrets');
var http = require('http');
var debug = require('debug')('query-v1');
var exec = require('child_process').exec;
var expect = require('chai').expect;
var Browser = require('zombie');
var creds = require('../user_secrets');
var temp = require('temp').track();
var Q = require('q');
var makeTempDir = Q.denodeify(temp.mkdir);
var fs = require('fs');
var path = require('path');

describe('ManualAuthApp', function () {
  var auth;
  var app;
  var dataDir;

  beforeEach(function () {
    return makeTempDir('manual-auth-app-macro-test').then(function (dirPath) {
      dataDir = dirPath;
      app = express();
      auth = new AuthApp(secrets, {appBaseUrl: "http://localhost:8088", app: app, cacheDirectory: dataDir});
    });
  });

  afterEach(function () {
    temp.cleanup();
  });

  it('should issue a request', function () {
    // Replaces the bin script as the only way to exercise the flow.
    this.timeout(15000);
    var server = http.createServer(app);
    var url = auth.url();
    var tokenPromise = auth.tokenPromise();
    server.listen(8088);

    debug("opening web page", url);

    // TODO create an auth token strategy that uses Zombie as below

    var browser = new Browser();
    browser.visit(url, function () {
      debug('loaded login page');
      browser
          .fill('username', creds.username)
          .fill('password', creds.password)
          .pressButton('Login', function () {
            debug('on authorization page');
            browser.pressButton('Allow');
          });
    });

    return tokenPromise.then(function (tokens) {
      expect(tokens).to.have.property('access_token');
      expect(tokens).to.have.property('refresh_token');
      expect(tokens).to.have.property('expires_in'); // should be 600
      expect(tokens).to.have.property('token_type');
      expect(tokens.token_type).to.equal('bearer');
      debug('got tokens', tokens);
    });
  }); // TODO add another instance verifying what happens when the user denys the token
  // TODO port the test to the new token promise api based on strategies so that the test doesn't launch the browser.

  it('should read cached auth tokens', function () {
    fs.writeFileSync(path.join(dataDir, '.tokens'), JSON.stringify({
      refreshToken: 'token-on-disk'
    }));

    return auth.refreshTokenPromise().then(function (refreshToken) {
      expect(refreshToken).to.equal('token-on-disk');
    });
  });
});