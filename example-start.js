var ith = require('./ith.js');
var redis = require('redis');

var client = redis.createClient();

var a = ith({
    redis: client,
    resourceName: 'example-startup',
    processName: 'test-me.js',
    extendInterval: 1200,
    ttl: 2000
});

a.start(function() {
    console.log('start');
});
