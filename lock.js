// var unlockScript = 'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end';
var extendScript = 'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("pexpire", KEYS[1], ARGV[2]) else return 0 end';
var ERRORS = require('./errors.js');
var _ = require('lodash');

module.exports = function lock(setup) {
    // global scope
    var obj = {};
    // private scope
    var __ = {};

    setup = setup || {};
    if (_.isUndefined(setup.redis)){
         throw ERRORS.NoRedisInstance;
     }

    // private
    var resourceName = setup.resourceName;
    var redis = setup.redis;
    var value = null;

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
                    message: 'Can\'t aquire lock for resource ' + __.getResourceName()
                }, null);
                return;
            }
            callback(null, 'OK');
        };
    };

    function lock(ttl, callback) {
        redis.set(__.getResourceName(), __.getValue(), 'NX', 'PX', ttl, __.getCallbackLock(callback));
        return obj;
    };

    function extend(ttl, callback) {
        redis.eval(extendScript, 1, __.getResourceName(), __.getValue(), ttl, callback);
        return obj;
    };

    function getValue() {
        if (_.isNull(value)) {
            value = random();
            if (typeof setup.prefix !== 'undefined') {
                value = setup.prefix + '_' + value;
            }
        }
       return value;
    }

    function getResourceName() {
        if (typeof resourceName === 'undefined') {
            resourceName = 'lock_resource_' + __.random();
        }
        return resourceName;
    }

    obj.lock = lock;
    obj.extend = extend;

    __.random = random;
    __.getResourceName = getResourceName;
    __.getValue = getValue;
    __.getCallbackLock = getCallbackLock;

    if(process.env.NODE_ENV === 'test') {
        obj.__ = __;
    }

    return obj;
};
