var path = require('path');
var chai = require('chai');
var expect = chai.expect;
var _ = require('lodash');
var sinon = require('sinon');

var lock = require(path.join(__dirname, '../lock.js'));


describe('Lock ... ', function() {
    beforeEach(function() {

    });
    describe('inititalization ...', function() {
        it('should throw error when no redis configuration.', function() {
            expect(function() {
                var l = lock();
            }).to.throw('You need to provide redis instance in setup.redis parameter.');
        });

        it('should return object', function() {
            var l = lock({
                redis: {}
            });
            expect(l).to.be.an('object');
        });

        it('should expose basic functions', function() {
            var l = lock({
                redis: {}
            });
            expect(l).to.be.an('object');
            expect(l.lock).to.be.a('function');
            expect(l.extend).to.be.a('function');
        });
    });

    describe('locking ...', function() {
        beforeEach(function() {
            this.resourceName = 'test-resource';
            this.value = 'random-string';

            this.redis = {
                'set': function() {}
            };
            this.mock_redis = sinon.mock(this.redis);

            this.l = lock({
                redis: this.redis
            });

            this.stub_getResourcename = sinon.stub(this.l.__, 'getResourceName').returns(this.resourceName);
            this.stub_getValue = sinon.stub(this.l.__, 'getValue').returns(this.value);
        });

        afterEach(function() {
            this.mock_redis.restore();
            this.stub_getResourcename.restore();
            this.stub_getValue.restore();
        });

        it('should lock on redis with ttl = 1000', function() {
            this.mock_redis.expects('set').once().withArgs(this.resourceName, this.value, 'NX', 'PX', 1000);
            this.l.lock(1000);
            this.mock_redis.verify();
        });

        it('should lock on redis with ttl = 2000', function() {
            this.mock_redis.expects('set').once().withArgs(this.resourceName, this.value, 'NX', 'PX', 2000);
            this.l.lock(2000);
            this.mock_redis.verify();
        });
    });
});