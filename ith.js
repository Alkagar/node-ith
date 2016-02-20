var _ = require('lodash');
var lock = require('./lock.js');
var spawn = require('child_process').spawn;

var bunyan = require('bunyan');
var log = bunyan.createLogger({
    name: 'Ith',
    level: 'info'
});

var TEXT = {
    NO_LOCK_AQUIRED: 'No lock aquired...',
    LOCK_AQUIRED: 'Lock aquired!',
    PROCESS_CLOSE: 'Stdio has been closed.',
    PROCESS_EXIT: 'Process stopped.',
    PROCESS_ERROR: 'Process errored.',
    CANT_EXTEND_LOCK: 'Cannot extend lock for current process.'
};

module.exports = function ith(setup) {
    var obj = {};

    var redisClient = _.get(setup, 'redis', null);
    if (_.isNull(redisClient)) {
        //TODO: add proper errors
        throw new Error('You need to provide redis client instance.');
    }

    var resourceName = _.get(setup, 'resourceName', null);
    if (_.isNull(resourceName)) {
        //TODO: add proper errors
        throw new Error('You need to provide `resource` name.');
    }

    var processName = _.get(setup, 'processName', null);
    if (_.isNull(processName)) {
        //TODO: add proper errors
        throw new Error('You need to provide `process` name.');
    }

    var shouldExtend = true;
    var childProcess = null;
    var prefix = _.get(setup, 'prefix', '');
    var extendInterval = _.get(setup, 'extendInterval', 5 * 1000);
    var ttl = _.get(setup, 'ttl', 10 * 1000);

    //TODO: add bunyan for logging
    var onCantAquire = _.get(setup, 'onCantAquire', function() {
        log.info(TEXT.NO_LOCK_AQUIRED);
    });
    var onAquire = _.get(setup, 'onAquire', function() {
        log.info(TEXT.LOCK_AQUIRED);
    });

    var rd = lock({
        redis: redisClient,
        resourceName: resourceName,
        prefix: prefix
    });

    function _terminateProcess() {
        if (!_.isNull(childProces)) {
            childProcess.kill();
        }
    }

    function _startNewProcess() {
        var nodePath = process.execPath;
        log.info({
            message: 'Spawning new instance.',
            executable: nodePath,
            processFile: processName
        });
        childProcess = spawn(nodePath, [processName], {
            stdio: 'pipe'
        });
        childProcess.stdout.on('data', function(data) {
            var output = data.toString();
            process.stdout.write(output);
        });
        childProcess.stderr.on('data', function(data) {
            var output = data.toString();
            process.stdout.write(output);
        });
        childProcess.on('close', function(code, signal) {
            log.info(TEXT.PROCESS_CLOSE, code,
                signal);
        });
        childProcess.on('error', function(err, si) {
            log.info(TEXT.PROCESS_ERROR, err,
                si);
        });
        childProcess.on('exit', function(code, signal) {
            shouldExtend = false;
            log.info(TEXT.PROCESS_EXIT, code, signal);
            // lets try to create new lock when process is killed
            setTimeout(start, extendInterval);
        });
    }

    function _shouldExtend() {
        return shouldExtend;
    }

    function _extendLock() {
        //  lets extend lock with redlock
        if (!_shouldExtend()) {
            return;
        }
        rd.extend(ttl, function(err, data) {
            if (err) {
                // lock can't be extended - stop our process
                log.info(TEXT.CANT_EXTEND_LOCK, err);

                // lets terminate process if we cannot extend lock - we should try to restart it either way
                _terminateProcess();
            } else {
                // lets try schedule extending time for our lock
                setTimeout(_extendLock, extendInterval);
            }
        });
    }

    function _createLock(callback) {
        rd.lock(ttl, function(err, data) {
            if (err) {
                // we failed to aquire lock
                onCantAquire();
                // lock was not aquired, let's try again after extendInterval
                setTimeout(start, extendInterval);
            } else {
                // we have lock for this process, we can start our process
                onAquire();

                // here we shuld try to start new process
                _startNewProcess();

                // try to run callback if provided
                if (_.isFunction(callback)) {
                    callback();
                }

                // lets try schedule extending time for our lock
                setTimeout(_extendLock, extendInterval);
            }
        });
    }

    function start(callback) {
        shouldExtend = true;
        _createLock(callback);
    };

    obj.start = start;

    return obj;
};
