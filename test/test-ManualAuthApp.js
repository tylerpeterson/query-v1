var expect = require('chai').expect;
var sinon = require('sinon');
var fs = require('fs');
var ManualAuthApp = require('../lib/ManualAuthApp');
var app = require('express')();
var secrets = {web: {}};

describe('ManualAuthApp', function () {
  var instance;

  beforeEach(function () {
    instance = new ManualAuthApp(secrets, {app: app});
  });

  it('should be a constructor', function () {
    expect(instance).to.be.an.instanceof(ManualAuthApp);
  });

  describe('caching on disk', function () {
    var readFile;

    beforeEach(function () {
      readFile = sinon.stub(fs, 'readFile', function (path, cb) {
        cb(null, '{"refreshToken":"access_token_on_disk"}');
      });
    });

    it('should read cached refresh token', function (done) {
      instance.refreshTokenPromise().then(function (refreshToken) {
        try {
          expect(refreshToken).to.equal('access_token_on_disk');
          done();
        } catch (err) {
          done(err);
        }
      }, done);
    });

    afterEach(function () {
      readFile.restore();
    });
  });

  describe('recovering from cache miss', function () {
    var oldCacheDir;

    beforeEach(function () {
      oldCacheDir = instance.cacheDirectory;
      instance.cacheDirectory = oldCacheDir + 'some-directory-that-doesn\'t-exist';
    });

    it.skip('should use a strategy to obtain auth token', function (done) {
      // instance.refreshTokenPromise().then(function (refreshToken) {
      //   try {
      //     expect(refreshToken).to.equal('access_token_on_disk');
      //     done();
      //   } catch (err) {
      //     done(err);
      //   }
      // }, done);
    });

    afterEach(function () {
      instance.cacheDirectory = oldCacheDir;
    });
  });
});