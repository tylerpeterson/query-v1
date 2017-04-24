var debug = require('debug')('query-v1');

module.exports = function (secretModuleName) {
  var secrets;

  function env(name) {
    var val = process.env[name];
    debug(name, val);

    return val;
  }

  var skipFile = env('SECRETS_FROM_FILE') === 'false';

  if (skipFile) {
    secrets = {};
  } else {
    debug('Loading secrects', secretModuleName);
    secrets = require(secretModuleName);    
  }

  /*
   * Notice that the secrets file takes precedence over the environment
   * so that it is easy to override the access token in a file that is
   * ignored by git. If you set your access token in the .env_dev file
   * you risk checking it in by mistake. DON'T!
   */
  secrets.v1AccessToken   = secrets.v1AccessToken || env('V1_ACCESS_TOKEN');
  secrets.v1ServerBaseUri = env('V1_SERVER_BASE_URI');
  secrets.port            = env('PORT') || 5000;

  return secrets;
};
