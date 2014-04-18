var expect = require('chai').expect;
var Q = require('q');
var strategies = require('../lib/RefreshTokenMissedStrategy');
var rejectPromise = strategies.rejectPromise;

// TODO move to a component test. This test will be slow.

describe('RefreshTokenMissedStrategy', function () {
  var refreshTokenDfd;
  var refreshTokenPromise;

  beforeEach(function () {
    refreshTokenDfd = Q.defer();
    refreshTokenPromise = refreshTokenDfd.promise;
  });

  describe.skip('LaunchBrowser version', function () {
    before(function () {
      // TODO launch an app to detect the browers connecting
    });

    it('should open a browser to the flow start url', function () {
      // TODO trigger the strategy
      // TODO verify that the test app detected the connection.
    });

    after(function () {
      // TODO kill the app you launched
      // TODO kill the browser you launched
    });
  });

  describe('RejectPromise version', function () {
    it('should reject the promise for the refresh token', function () {
      rejectPromise(refreshTokenDfd);
      expect(refreshTokenPromise.isRejected());
    });
  });
});