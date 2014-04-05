var V1 = require('../lib/VersionOne'),
    nock = require('nock'),
    expect = require('chai').expect,
    debug = require('debug')('VersionOne:test');

describe('VersionOne', function () {
  var v1;
  describe('#query', function () {
    var queryInterceptor;

    beforeEach(function () {
      debug('query::beforeEach');
      v1 = new V1();
      queryInterceptor = nock('https://www5.v1host.com')
          .post('/myInstance/query.v1')
          .reply(200, {_oid: 'myOid', Name: 'myStoryName'},  {'Content-Type': 'application/json'});
    });

    afterEach(function (){
      nock.cleanAll();
    });

    it.skip('should issue requests to /query.v1', function (done) {
      debug('V1#query::TC1');
      var responseP = v1.query({
        from: "Story",
        select: ["Name"],
      });

      responseP.then(function resolved(response) {
        debug('V1#query::TC1::callback');
        expect(response).to.be.an('array');
        expect(response.length).to.be.above(0);
        expect(response[0]).to.be.an('array');
        expect(response[0].length).to.be.above(0);
        expect(response[0][0]).to.be.an('object');
        expect(response[0][0]).to.have.property('Name');
        queryInterceptor.done();
        done();
      });
    });
  });
});