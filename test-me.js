var i = 1;
var bunyan = require('bunyan');
var log = bunyan.createLogger({name: 'myapp'});

var int = setInterval(function() {
    if (i < 30) {
        i++;
        log.info(i);
    } else {
        clearInterval(int);
    }
}, 100);
