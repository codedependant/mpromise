/*global describe,it */
/**
 * Module dependencies.
 */

var assert = require('assert');
var Promise = require('../');

/**
 * Test.
 */

describe('promise', function () {
  it('events fire right after fulfill()', function (done) {
    var promise = new Promise()
      , called = 0;

    promise.on('fulfill', function (a, b) {
      assert.equal(a, '1');
      assert.equal(b, '2');
      called++;
    });

    promise.fulfill('1', '2');

    promise.on('fulfill', function (a, b) {
      assert.equal(a, '1');
      assert.equal(b, '2');
      called++;
    });

    assert.equal(2, called);
    done();
  });

  it('events fire right after reject()', function (done) {
    var promise = new Promise()
      , called = 0;

    promise.on('reject', function (err) {
      assert.ok(err instanceof Error);
      called++;
    });

    promise.reject(new Error('booyah'));

    promise.on('reject', function (err) {
      assert.ok(err instanceof Error);
      called++;
    });

    assert.equal(2, called);
    done()
  });

  describe('onResolve()', function () {
    it('from constructor works', function (done) {
      var called = 0;

      var promise = new Promise(function (err) {
        assert.ok(err instanceof Error);
        called++;
      });

      promise.reject(new Error('dawg'));

      assert.equal(1, called);
      done();
    });

    it('after fulfill()', function (done) {
      var promise = new Promise()
        , called = 0;

      promise.fulfill('woot');

      promise.onResolve(function (err, data) {
        assert.equal(data, 'woot');
        called++;
      });

      promise.onResolve(function (err) {
        assert.strictEqual(err, null);
        called++;
      });

      assert.equal(2, called);
      done();
    })
  });

  describe('onFulfill shortcut', function () {
    it('works', function (done) {
      var promise = new Promise()
        , called = 0;

      promise.onFulfill(function (woot) {
        assert.strictEqual(woot, undefined);
        called++;
      });

      promise.fulfill();

      assert.equal(1, called);
      done();
    });
  });

  describe('onReject shortcut', function () {
    it('works', function (done) {
      var promise = new Promise()
        , called = 0;

      promise.onReject(function (err) {
        assert.ok(err instanceof Error);
        called++;
      });

      promise.reject(new Error);
      assert.equal(1, called);
      done();
    })
  });

  describe('return values', function () {
    it('on()', function (done) {
      var promise = new Promise();
      assert.ok(promise.on('jump', function () {}) instanceof Promise);
      done()
    });

    it('onFulfill()', function (done) {
      var promise = new Promise();
      assert.ok(promise.onFulfill(function () {}) instanceof Promise);
      done();
    });
    it('onReject()', function (done) {
      var promise = new Promise();
      assert.ok(promise.onReject(function () {}) instanceof Promise);
      done();
    });
    it('onResolve()', function (done) {
      var promise = new Promise();
      assert.ok(promise.onResolve(function () {}) instanceof Promise);
      done();
    })
  });

  describe('casting errors', function () {
    describe('reject()', function () {
      it('does not cast arguments to Error', function (done) {
        var p = new Promise(function (err) {
          assert.equal(3, err);
          done();
        });

        p.reject(3);
      })
    })
  });

  describe('then', function () {
    describe('catching', function () {
      it('should not catch returned promise fulfillments', function (done) {
        var errorSentinal
          , p = new Promise;
        p.then(function () { throw errorSentinal = new Error("boo!") });

        p.fulfill();
        done();
      });


      it('should not catch returned promise fulfillments even async', function (done) {
        var errorSentinal
          , p = new Promise;
        p.then(function () { throw errorSentinal = new Error("boo!") });

        setTimeout(function () {
          p.fulfill();
          done();
        }, 10);
      });


      it('can be disabled using .end()', function (done) {
        if (process.version.indexOf('v0.8') == 0) return done();
        var errorSentinal
          , overTimeout
          , domain = require('domain').create();

        domain.once('error', function (err) {
          assert(err, errorSentinal);
          clearTimeout(overTimeout);
          done()
        });

        domain.run(function () {
          var p = new Promise;
          var p2 = p.then(function () {
            throw errorSentinal = new Error('shucks')
          });
          p2.end();

          p.fulfill();
        });
        overTimeout = setTimeout(function () { done(new Error('error was swallowed')); }, 10);
      });


      it('can be disabled using .end() even when async', function (done) {
        if (process.version.indexOf('v0.10') != 0) return done();
        var errorSentinal
          , overTimeout
          , domain = require('domain').create();

        domain.on('error', function (err) {
          assert(err, errorSentinal);
          clearTimeout(overTimeout);
          done()
        });

        domain.run(function () {
          var p = new Promise;
          var p2 = p.then(function () {
            throw errorSentinal = new Error("boo!")
          });
          p2.end();

          setTimeout(function () {p.fulfill();}, 10);
        });
        overTimeout = setTimeout(function () { done(new Error('error was swallowed')); }, 20);
      });


      it('can be handled using .end() so no throwing', function (done) {
        var errorSentinal
          , overTimeout
          , domain = require('domain').create();

        domain.run(function () {
          var p = new Promise;
          var p2 = p.then(function () {
            throw errorSentinal = new Error("boo!")
          });
          p2.end(function (err) {
            assert.equal(err, errorSentinal);
            clearTimeout(overTimeout);
            done()
          });

          setTimeout(function () {p.fulfill();}, 10);
        });
        overTimeout = setTimeout(function () { done(new Error('error was swallowed')); }, 20);
      });

    });

    it('persistent', function (done) {
      var p = new Promise;
      v = null;

      function ensure(val) {
        v = v || val;
        assert.equal(v, val);
      }

      function guard() {
        throw new Error('onReject should not be called');
      }

      p.then(ensure, guard).end();

      p.fulfill('foo');
      p.fulfill('bar');
      p.reject(new Error('baz'));

      p.then(ensure, guard).end();

      setTimeout(done, 0);
    });


    it('accepts multiple completion values', function (done) {
      var p = new Promise;

      p.then(function (a, b) {
        assert.equal(2, arguments.length);
        assert.equal('hi', a);
        assert.equal(4, b);
        done();
      }, done).end();

      p.fulfill('hi', 4);
    })
  });

  describe('fulfill values and splats', function () {
    it('should handle multiple values', function (done) {
      var p = new Promise;
      p.onFulfill(function (a, b, c) {
        assert.equal('a', a);
        assert.equal('b', b);
        assert.equal('c', c);
        done();
      });
      p.fulfill('a', 'b', 'c');
    });

    it('should handle multiple values from a then', function (done) {
      Promise.fulfilled().then(
        function () {
          return Promise.fulfilled().then(
            function () {
              var p = new Promise;
              p.fulfill('a', 'b', 'c');
              return p;
            }
          );
        }
      ).onFulfill(
        function (a, b, c) {
          assert.equal('a', a);
          assert.equal('b', b);
          assert.equal('c', c);
          done();
        }
      ).end()
    });

    it('should work with `fulfilled` convenience method', function (done) {
      Promise.fulfilled('a', 'b', 'c').then(function (a, b, c) {
        assert.equal('a', a);
        assert.equal('b', b);
        assert.equal('c', c);
        done();
      })
    });
  });


  describe('end', function () {
    it("should return the promise", function (done) {
      var p = new Promise;
      var p1 = p.end();
      assert.equal(p, p1);
      done();
    });


    it("should throw for chain", function (done) {
      var p = new Promise;
      p.then().then().then().then().end();
      try {
        p.reject('bad');
      } catch (e) {
        done();
      }
    });


    it("should not throw for chain with reject handler", function (done) {
      var p = new Promise;
      p.then().then().then().then().end(function () {
        done();
      });
      try {
        p.reject('bad');
      } catch (e) {
        done(e);
      }
    });
  });


  describe('chain', function () {
    it('should propagate fulfillment', function (done) {
      var varSentinel = {a: 'a'};
      var p1 = new Promise;
      p1.chain(new Promise(function (err, doc) {
        assert.equal(doc, varSentinel);
        done();
      }));
      p1.fulfill(varSentinel);
    });


    it('should propagate rejection', function (done) {
      var e = new Error("gaga");
      var p1 = new Promise;
      p1.chain(new Promise(function (err) {
        assert.equal(err, e);
        done();
      }));
      p1.reject(e);
    });


    it('should propagate resolution err', function (done) {
      var e = new Error("gaga");
      var p1 = new Promise;
      p1.chain(new Promise(function (err) {
        assert.equal(err, e);
        done();
      }));
      p1.resolve(e);
    });


    it('should propagate resolution val', function (done) {
      var varSentinel = {a: 'a'};
      var p1 = new Promise;
      p1.chain(new Promise(function (err, val) {
        assert.equal(val, varSentinel);
        done();
      }));
      p1.resolve(null, varSentinel);
    });


    it('should propagate multiple resolution vals', function(done) {
      var val1 = 'eggs';
      var val2 = 'bacon';
      var p = new Promise;
      p.chain(new Promise(function (err, v1, v2) {
        assert.equal(v1, val1);
        assert.equal(v2, val2);
        done();
      }));
      p.resolve(null, val1, val2);
    });
  });


  describe("all", function () {
    it("works", function (done) {
      var count = 0;
      var p = new Promise;
      var p2 = p.all(function () {
        return [
          (function () {
            var p = new Promise();
            count++;
            p.resolve();
            return p;
          })()
          , (function () {
            var p = new Promise();
            count++;
            p.resolve();
            return p;
          })()
        ];
      });
      p2.then(function () {
        assert.equal(count, 2);
        done();
      });
      p.resolve();
    });


    it("handles rejects", function (done) {
      var count = 0;
      var p = new Promise;
      var p2 = p.all(function () {
        return [
          (function () {
            var p = new Promise();
            count++;
            p.resolve();
            return p;
          })()
          , (function () {
            count++;
            throw new Error("gaga");
          })()
        ];
      });
      p2.onReject(function (err) {
        assert(err.message, "gaga");
        assert.equal(count, 2);
        done();
      });
      p.resolve();
    });
  });


  describe("deferred", function () {
    it("works", function (done) {
      var d = Promise.deferred();
      assert.ok(d.promise instanceof Promise);
      assert.ok(d.reject instanceof Function);
      assert.ok(d.resolve instanceof Function);
      assert.ok(d.callback instanceof Function);
      done();
    });
  });


  describe("hook", function () {
    it("works", function (done) {
      var run = 0;
      var l1 = function (ser, par) {
        run++;
        ser();
        par();
      };
      Promise.hook([l1, l1, l1]).then(function () {
        assert(run, 3);
        done();
      })

    });


    it("works with async serial hooks", function (done) {
      this.timeout(800);
      var run = 0;
      var l1 = function (ser, par) {
        run++;
        setTimeout(function () {ser();}, 200);
        par();
      };
      Promise.hook([l1, l1, l1]).then(function () {
        assert(run, 3);
        done();
      })
    });


    it("works with async parallel hooks", function (done) {
      this.timeout(400);
      var run = 0;
      var l1 = function (ser, par) {
        run++;
        ser();
        setTimeout(function () {par();}, 200);
      };
      Promise.hook([l1, l1, l1]).then(function () {
        assert(run, 3);
        done();
      })
    });


    it("catches errors in hook logic", function (done) {
      var run = 0;
      var l1 = function (ser, par) {
        run++;
        ser();
        par();
      };
      var l2 = function (ser, par) {
        run++;
        ser();
        par();
        throw new Error("err")
      };
      Promise.hook([l1, l2, l1]).end(function (err) {
        assert(run, 2);
        done();
      });
    });
  });

  describe("when", function(){
    it("should return a promise instance", function (done){
      var whenPromise = Promise.when()
      assert.ok(whenPromise instanceof Promise);
      done();
    });

    it("should be fulfilled when all the passed in promises are resolved", function (done){
      var promise1 = new Promise;
      var promise2 = new Promise;
      var whenPromise = Promise.when(promise1, promise2)

      whenPromise.onResolve(function(){
        called = 0;
        promise1.onFulfill(function(){
          called++;
        });
        promise2.onFulfill(function(){
          called++;
        });
        assert(called, 2);
        done();
      });
      promise1.fulfill();
      promise2.fulfill();

    });

    it("should pass the fulfilled promise results in order", function (done){
      var promise1 = new Promise;
      var promise2 = new Promise;
      var whenPromise = Promise.when(promise1, promise2);

      whenPromise.onResolve(function(error, results1, results2){
        assert.ok(results1 instanceof Array)
        assert.ok(results2 instanceof Array)

        assert(results1[0], "a");
        assert(results1[1], "b");
        assert(results1[2], "c");

        assert(results2[0], "d");
        assert(results2[1], "e");
        assert(results2[2], "f");

        done();
      });

      promise1.fulfill("a", "b", "c");
      promise2.fulfill("d", "e", "f");

    });

    it("should be rejected if one of the passed in promises are rejected", function (done){
      var promise1 = new Promise;
      var promise2 = new Promise;
      var whenPromise = Promise.when(promise1, promise2);

      var onResolvedCalled = false;
      whenPromise.onResolve(function(){
        onResolvedCalled = true;
      });

      whenPromise.onReject(function(error){
        assert.ok(error instanceof Error);
        assert(onResolvedCalled, false);
        done();
      });

      promise1.fulfill();
      promise2.reject(new Error("rejected"));

    });


  })

});
