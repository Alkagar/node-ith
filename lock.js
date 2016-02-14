// var unlockScript = 'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end';
var extendScript = 'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("pexpire", KEYS[1], ARGV[2]) else return 0 end';

var redis = require('redis');

module.exports = function lock(setup) {
    var obj = {};

    function random() {
        return Math.random().toString(36).slice(2);
    };

    function getCallbackLock(callback) {
        if (typeof callback === 'undefined') {
            callback = function() {};
        }
        return function(err, data) {
            if (err === null && data === null) {
                callback({
                    error: 'LockError',
                    message: 'Can\'t aquire lock for resource ' + resourceName
                }, null);
                return;
            }
            callback(null, 'OK');
        };
    };

    function lock(ttl, callback) {
        redis.set(resourceName, value, 'NX', 'PX', ttl, getCallbackLock(callback));
        return obj;
    };

    function extend(ttl, callback) {
        redis.eval(extendScript, 1, resourceName, value, ttl, callback);
        return obj;
    };

    setup = setup || {};
    var redis = setup.redis;
    var value = random();

    if (typeof setup.prefix !== 'undefined') {
        value = setup.prefix + '_' + value;
    }

    if (typeof setup.redis === 'undefined') {
        throw {
            error: 'NoRedisInstance',
            message: 'You need to provide redis instance in setup.redis parameter.'
        }
    }

    var resourceName = setup.resourceName;
    if (typeof resourceName === 'undefined') {
        resourceName = 'lock_resource_' + random();
    }

    obj.lock = lock;
    obj.extend = extend;
    return obj;
};
