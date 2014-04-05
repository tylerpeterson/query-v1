var fs = require('fs'),
    url = require('url'),
    Q = require('q');

function V1Auth() {

}

Object.defineProperty(V1Auth.prototype, 'accessTokenP', {get: function () {
  var dfd = Q.defer();
  dfd.resolve('myAccessToken');
  return dfd.promise;
}});

V1Auth.readSecretsSync = function (path) {
  var result = {},
      clientSecrets;
  try {
    return JSON.parse(fs.readFileSync(path || 'client_secrets.json'));
  } catch (err) {
    if (err.code && err.code === 'ENOENT') {
      err.message = "Couldn't find the client secrets file:: " + err.message;
    }
    if (err instanceof SyntaxError) {
      err.message = "Couldn't read the secrets. File isn't valid JSON:: " + err.message;
    }
    throw err;
  }
};

V1Auth.redirectRoute = function (redirectUri) {
  return url.parse(redirectUri).pathname;
};

module.exports = V1Auth;