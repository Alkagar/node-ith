var ith = require('../ith.js');
var redis = require('redis');
var path = require('path');
var bunyan = require('bunyan');
var log = bunyan.createLogger({
    name: 'example-startup'
});

var client = redis.createClient();
var processName = path.join(__dirname, './test-me.js');

var startup = ith({
    redis: client,
    resourceName: 'example-startup',
    processName: processName,
    extendInterval: 1200,
    ttl: 2000
});

startup.start(function() {
    log.info('Application starts here.');
});
