var express = require('express');
var AuthApp = require('../lib/ManualAuthApp');
var secrets = require('../client_secrets');
var http = require('http');
var debug = require('debug')('query-v1');
var exec = require('child_process').exec;
var expect = require('chai').expect;
var Browser = require('zombie');
var creds = require('../user_secrets');

describe('ManualAuthApp', function () {
  it('should issue a request', function (done) {
    // Replaces the bin script as the only way to exercise the flow.
    this.timeout(15000);
    var app = express();
    var auth = new AuthApp(secrets, {appBaseUrl: "http://localhost:8088", app: app});
    var server = http.createServer(app);
    var url = auth.url();
    var tokenPromise = auth.tokenPromise();
    tokenPromise.then(function (tokens) {
      expect(tokens).to.have.property('access_token');
      expect(tokens).to.have.property('refresh_token');
      expect(tokens).to.have.property('expires_in'); // should be 600
      expect(tokens).to.have.property('token_type');
      expect(tokens.token_type).to.equal('bearer');
      debug('got tokens', tokens);
      done();
    }, done);

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
  }); // TODO add another instance verifying what happens when the user denys the token
  // TODO port the test to the new token promise api based on strategies so that the test doesn't launch the browser.

  it.skip('should read cached auth tokens', function () {
    /* TODO
     * generate a temp directory and use it as the cache base
     * poke tokens into the temp dir
     * get a promise for access token and then refresh token
     * verify they match the poked data.
     *
     * Possibly two tests, not one.
     */
  });
});