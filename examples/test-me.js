var bunyan = require('bunyan');
var log = bunyan.createLogger({
    name: 'test me'
});

var i = 1;
var int = setInterval(function() {
    if (i++ < 10) {
        log.info({
            count: i
        });
    } else {
        clearInterval(int);
    }
}, 100);
