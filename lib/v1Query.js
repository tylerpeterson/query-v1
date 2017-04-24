var request = require('superagent');
var secrets = require('./load-secrets')('../client_secrets');
var serverBaseUri = secrets.v1ServerBaseUri;
var debug = require('debug')('query-v1');

function v1Query(query) {
  return request
    .get(serverBaseUri + '/query.v1')
    .set('Authorization', 'Bearer ' + secrets.v1AccessToken)
    .send(query)
}

module.exports = v1Query;