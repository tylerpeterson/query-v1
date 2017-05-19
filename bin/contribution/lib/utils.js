require('es6-promise').polyfill();
require('isomorphic-fetch');

const debug = require('debug')('query-v1');
var secrets = require('../../../lib/load-secrets')('../client_secrets');
const serverBaseUri = secrets.v1ServerBaseUri;
const queryUri = serverBaseUri + '/query.v1';
const storyBaseUri = serverBaseUri + '/story.mvc/Summary?oidToken='
const taskBaseUri = serverBaseUri + '/Task.mvc/Summary?oidToken=';

function fetchV1(query) {
  return fetch(queryUri, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + secrets.v1AccessToken,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(query)
  });
}

function filterErrors(label = 'DEFAULT') {
  return function (response) {
    if (response.status >= 200 && response.status < 300) {
      debug(`Success for ${label}`);
      return response;
    } else {
      var error = new Error(label + response.statusText)
      error.response = response;
      debug(`Error for ${label}: ${response.statusText}`);
      throw error;
    }
  }
}

const fs = require('fs');

function cacheJson(cacheName, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(`${__dirname}/../cache/${cacheName}.json`, JSON.stringify(data, null, '  '), err => {
      if (err) {
        debug(`ERROR writing ${cacheName} cache`);
        reject(err);
      } else {
        debug(`Success writing ${cacheName} cache`);
        resolve(data);
      }
    });
  });
}

function loadCache(cacheName, loadFromServer) {
  return new Promise((resolve, reject) => {
    try {
      let data = require(`../cache/${cacheName}`);
      debug(`Found ${cacheName} cache.`);
      resolve(data);
    } catch (e) {
      if (e.code !== 'MODULE_NOT_FOUND') {
        debug(`Unexpected error loading ${cacheName} cache.`);
        reject(e);
      }
      debug(`Could not find ${cacheName} cache on disk. Falling back to server...`);
      loadFromServer()
        .then(serverData => cacheJson(cacheName, serverData))
        .then(serverData => resolve(serverData));
    }
  });
}


module.exports = {
  fetchV1: fetchV1,
  loadCache: loadCache,
  filterErrors: filterErrors,
  baseUris: {
    story: storyBaseUri
  }
}