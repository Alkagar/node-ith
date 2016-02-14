# Ith
Simple module for starting only single instance of node process across many
servers. Ith uses redis as communication channel - for locking purposes.

# Usage
1. firstly you need to install Ith by:
```
npm install ith
```

2. next you need to load Ith dependency into your startup file
```
var ith = require('ith');
```

3. for Ith to be able to communicate between serwers you need to provide him some
redis client, so be so nice and craete one for him:
```
var redis = require('redis');
var client = redis.createClient();
```

4. then it's finally time to create Ith instance:
```
var letsRun = ith({
    redis: client,
    resourceName: 'turbo-node-process-to-start-only-once',
    processName: 'path/to/your/turbo-node-process-to-start-only-once.js',
    extendInterval: 1200,
    ttl: 2000
});

letsRun.start(function() {
    console.log('start');
});
```
