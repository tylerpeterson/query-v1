var rewire = require('rewire'),
    sinon = require('sinon'),
    expect = require('chai').expect,
    Sut = rewire('../lib/V1Auth'),
    sampleSecrets = {
      "web": {
        "client_id": "my_client_id",
        "client_name": "my_client_name",
        "client_secret": "my_client_secret",
        "redirect_uris": [
          "http://localhost:8088/auth/versionone/callback"
        ],
        "auth_uri": "https://www5.v1host.com/my-instance/oauth.v1/auth",
        "token_uri": "https://www5.v1host.com/my-instance/oauth.v1/token",
        "server_base_uri": "https://www5.v1host.com/my-instance",
        "expires_on": "9999-12-31T23:59:59.9999999"
      }
    };

describe('V1Auth', function () {
  describe('#readSecretsSync (static)', function () {
    var readStub;

    beforeEach(function () {
      readStub = sinon.stub(Sut.__get__('fs'), 'readFileSync');
      readStub.returns(JSON.stringify(sampleSecrets));
    });

    afterEach(function () {
      readStub.restore();
    });

    it('is a static function', function () {
      expect(Sut.readSecretsSync).to.be.a('function');
    });

    it('loads the secrets from client_secrets.json by default', function () {
      Sut.readSecretsSync();
      sinon.assert.calledWith(readStub, 'client_secrets.json');
    });

    it('loads the secrets from the file you specify', function () {
      Sut.readSecretsSync('tyv1_secrets.json');
      sinon.assert.calledWith(readStub, 'tyv1_secrets.json');
    });

    it('parses the JSON for you', function () {
      var secrets = Sut.readSecretsSync();
      expect(secrets).to.have.property('web');
      expect(secrets.web).to.have.property('client_id');
    });
  });

  describe('#redirectRoute', function () {
    it('is a static function', function () {
      expect(Sut.redirectRoute).to.be.a('function');
    });

    it('determines the path to mount the callback controller on', function () {
      expect(Sut.redirectRoute("http://localhost:8080/auth/versionone/callback")).to.equal('/auth/versionone/callback');
    });
  });

  describe('#query', function () {
    it('should issue requests to /query.v1', function () {

    });
  });
});