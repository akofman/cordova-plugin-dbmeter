exports.defineAutoTests = function() {
  var fail = function (done) {
    expect(false).toBe(true);
    done();
  };

  describe('DBMeter (window.DBMeter)', function () {
    it('should exist', function() {
      expect(window.DBMeter).toBeDefined();
    });

    it('should contain a init function', function () {
      expect(typeof window.DBMeter.init).toBeDefined();
      expect(typeof window.DBMeter.init === 'function').toBe(true);
    });

    it('should contain a start function', function () {
      expect(typeof window.DBMeter.start).toBeDefined();
      expect(typeof window.DBMeter.start === 'function').toBe(true);
    });

    it('should contain a stop function', function () {
      expect(typeof window.DBMeter.stop).toBeDefined();
      expect(typeof window.DBMeter.stop === 'function').toBe(true);
    });

    it('should contain a isListening function', function () {
      expect(typeof window.DBMeter.isListening).toBeDefined();
      expect(typeof window.DBMeter.isListening === 'function').toBe(true);
    });

    it('should contain a delete function', function () {
      expect(typeof window.DBMeter.delete).toBeDefined();
      expect(typeof window.DBMeter.delete === 'function').toBe(true);
    });
  });

  describe('init method', function () {
    beforeEach(function () {
      window.DBMeter.delete();
    });

    it('should not being listening after initializing', function (done) {
      window.DBMeter.init();
      window.DBMeter.start();
      window.DBMeter.isListening(function(result){
        expect(result).toBe(true);
        done();
      });
      window.DBMeter.init(function(){
        window.DBMeter.isListening(function(result){
          expect(result).toBe(false);
          done();
        });
      });
    });
  });

  describe('start method', function () {
    beforeEach(function () {
      window.DBMeter.delete();
    });

    it('should return dB if we start the DBMeter', function (done) {
      var alreadyDone = false;
      window.DBMeter.init(function(){
        window.DBMeter.start(function(dB){
          if(!alreadyDone){
            alreadyDone = true;
            window.DBMeter.stop();
            expect(true).toBe(true);
            done();
          }
        }, fail.bind(null, done));
      });
    });

    describe('error callback', function () {
      it('should be called if we start the DBMeter while it is not initialized, the expected error should have the code 0', function (done) {
        window.DBMeter.start(function(){
          window.DBMeter.stop();
          fail(done);
        }, function(e){
          expect(e.code).toBe(0);
          done();
        });
      });

      it('should be called if we start the DBMeter while it is already started, the expected error should have the code 1', function (done) {
        //var context = this;
        window.DBMeter.init();
        window.DBMeter.start();
        window.DBMeter.start(function(){
          window.DBMeter.stop();
          fail(done);
        }, function(e){
          window.DBMeter.stop();
          expect(e.code).toBe(1);
          done();
        });

      });
    });
  });

  describe('stop method', function () {
    beforeEach(function () {
      window.DBMeter.delete();
    });

    it('should stop the DBMeter', function (done) {
      window.DBMeter.init();
      window.DBMeter.start();
      window.DBMeter.isListening(function(result){
        expect(result).toBe(true);
        done();
      });

      window.DBMeter.stop();
      window.DBMeter.isListening(function(result){
        expect(result).toBe(false);
        done();
      });
    });

    describe('error callback', function () {

      it('should be called if we stop the DBMeter while it is not started, the expected error should have the code 2', function (done) {
        window.DBMeter.stop(fail.bind(null, done), function(e){
          expect(e.code).toBe(2);
          done();
        });
      });
    });
  });

  describe('delete method', function () {
    beforeEach(function () {
      window.DBMeter.delete();
    });

    it('should delete the DBMeter instance', function (done) {
      window.DBMeter.init();
      window.DBMeter.start();
      window.DBMeter.isListening(function(result){
        expect(result).toBe(true);
        done();
      });
      window.DBMeter.delete();
      window.DBMeter.isListening(function(result){
        expect(result).toBe(false);
        done();
      });
    });

    describe('error callback', function () {
      it('should be called if we delete the DBMeter while it is not initialized, the expected error should have the code 0', function (done) {
        window.DBMeter.delete(fail.bind(null, done), function(e){
          expect(e.code).toBe(0);
          done();
        });
      });
    });
  });

  describe('isListening method', function () {
    beforeEach(function () {
      window.DBMeter.delete();
    });

    it('should return false if the DBMeter is not iniatialized', function (done) {
      window.DBMeter.isListening(function(result){
        expect(result).toBe(false);
        done();
      });
    });

    it('should return false if the DBMeter is not listening', function (done) {
      window.DBMeter.init();
      window.DBMeter.isListening(function(result){
        expect(result).toBe(false);
        done();
      });
    });

    it('should return true if the DBMeter is listening', function (done) {
      window.DBMeter.init();
      window.DBMeter.start();
      window.DBMeter.isListening(function(result){
        expect(result).toBe(true);
        done();
      });
      window.DBMeter.stop();
    });
  });
};
