var request = require('superagent');
var secrets = require('./load-secrets')('../client_secrets');
var serverBaseUri = secrets.web.server_base_uri;
var debug = require('debug')('query-v1');

function v1Query(req, query) { // TODO shouldn't need the req object
  return request
    .get(serverBaseUri + '/query.v1')
    .set('Authorization', 'Bearer ' + secrets.access_token)
    .send(query)
}

module.exports = v1Query;