var mocha = require('mocha'),
    expect = require('chai').expect,
    assert = require('chai').assert,
    AuthApp = require('../lib/EphemeralAuthApp'),
    supertest = require('supertest'),
    net = require('net'),
    debug = require('debug')('EphemeralAuthApp:test'),
    Browser = require('zombie');

describe('EphemeralAuthApp module', function () {
  it('should be a constructor', function () {
    expect(AuthApp).to.be.a('function');
  });
});

describe('EphemeralAuthApp', function () {
  var app = null,
      port;

  beforeEach(function () {
    app = new AuthApp();
    port = app.port();
  });

  describe('#port()', function () {
    it('is ephemeral', function () {
      expect(app.port()).to.be.a('number');
      expect(app.port()).to.be.above(1023);
    });

    describe('tcp', function () {
      var client = null;

      it('accepts tcp connections', function (done) {
        client = net.connect(app.port(), function onConnect() {
          done();
        });
      });

      afterEach(function () {
        if (client) {
          client.end();
          client.unref();
        }
      });
    });
  });

  it('#destroy() stops accepting connections', function (done) {
    var client;
    app.destroy();
    client = net.connect(port, function onConnect() {
      debug('connection worked! means destroy is broken.');
      assert.fail('Shouldn\'t make a connection.');
    });
    client.on('error', function () {
      done();
    });
  });

  it('destroys itself when done', function (done) {
    var browser = new Browser();
    browser.visit(app.url(), function () {
      var client = net.connect(port, function () {
        assert.fail('Shouldn\' accept connection.');
      });
      client.on('error', function () {
        done();
      });
    });
  });

  it('returns a token', function (done) {
    app.tokenPromise().then(function (token) {
      done();
    });
    var browser = new Browser();
    browser.visit(app.url(), function () {});
  });

  it('#url() tells you where to start', function () {
    expect(app.url()).to.be.a('string');
  });

  it('serves a page at #url()', function(done) {
    var browser = new Browser();
    browser.visit(app.url(), function () {
      expect(browser.success).to.be.true;
      done();
    });
  });

  afterEach(function () {
    app.destroy();
  });
});
