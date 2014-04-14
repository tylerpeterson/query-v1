var expect = require('chai').expect;
var ManualAuthApp = require('../lib/ManualAuthApp');
var app = require('express')();
var secrets = {web: {}};

describe('ManualAuthApp', function () {
  it('should be a constructor', function () {
    var instance = new ManualAuthApp(secrets, {app: app});
    expect(instance).to.be.an.instanceof(ManualAuthApp);
  });

  it.skip('should read cached tokens', function (done) {

  });
});