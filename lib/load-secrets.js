var debug = require('debug')('query-v1');

module.exports = function (secretModuleName) {
  var secrets;
  var skipFile = process.env.V1_OAUTH_SECRETS_FROM_FILE === 'false';

  debug("V1_OAUTH_SECRETS_FROM_FILE", process.env.V1_OAUTH_SECRETS_FROM_FILE);

  if (skipFile) {
    secrets = {};
    secrets.web = {};
    secrets.web.server_base_uri =   process.env.V1_OAUTH_SERVER_BASE_URI;
    secrets.access_token        =   process.env.V1_ACCESS_TOKEN;
  } else {
    secrets = require(secretModuleName);
  }

  return secrets;
};
