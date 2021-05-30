exports.defineAutoTests = function() {
  var fail = function (done) {
    expect(false).toBe(true);
    done();
  };

  describe('DBMeter (window.DBMeter)', function () {
    it('should exist', function() {
      expect(window.DBMeter).toBeDefined();
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

  describe('start method', function () {

    it('should start the DBMeter', function (done) {
      var started = false;

      window.DBMeter.start(function() {
        if(!started) {
          started = true;
          window.DBMeter.isListening(function(result) {
            expect(result).toBe(true);
            done();
          }, fail.bind(null, done));
        }
      }, fail.bind(null, done));
    });

    it('should return dB if we start the DBMeter', function (done) {
      var started = false;

      window.DBMeter.delete(function() {
        window.DBMeter.start(function(dB) {
          if(!started) {
            started = true;
            window.DBMeter.stop(function() {
              expect(dB).not.toBe(null);
              done();
            });
          }
        }, fail.bind(null, done));
      }, fail.bind(null, done));
    });
  });

  describe('stop method', function () {

    it('should stop the DBMeter', function (done) {
      var started = false;

      window.DBMeter.delete(function() {
        window.DBMeter.start(function() {
          if(!started) {
            started = true;
            window.DBMeter.stop(function() {
              window.DBMeter.isListening(function(result) {
                expect(result).toBe(false);
                done();
              }, fail.bind(null, done));
            }, fail.bind(null, done));
          }
        }, fail.bind(null, done));
      }, fail.bind(null, done));
    });

    describe('error callback', function () {

      it('should be called if we stop the DBMeter while it is not started, the expected error should have the code 1', function (done) {
        window.DBMeter.delete(function() {
          window.DBMeter.stop(fail.bind(null, done), function(e) {
            expect(e.code).toBe(1);
            done();
          }, fail.bind(null, done));
        });
      });
    });
  });

  describe('delete method', function () {

    it('should delete the DBMeter instance', function (done) {
      var started = false;

      window.DBMeter.start(function() {
        if(!started) {
          started = true;
          window.DBMeter.isListening(function(result) {
            expect(result).toBe(true);
            window.DBMeter.delete(function() {
              window.DBMeter.isListening(function(result) {
                expect(result).toBe(false);
                done();
              }, fail.bind(null, done));
            }, fail.bind(null, done));
          }, fail.bind(null, done));
        }
      }, fail.bind(null, done));
    });

    describe('error callback', function () {
      it('should be called if we delete the DBMeter while it is not initialized, the expected error should have the code 0', function (done) {
        window.DBMeter.delete(fail.bind(null, done), function(e) {
          expect(e.code).toBe(0);
          done();
        }, fail.bind(null, done));
      });
    });
  });

  describe('isListening method', function () {

    it('should return false if the DBMeter is not initialized', function (done) {
      window.DBMeter.isListening(function(result) {
        expect(result).toBe(false);
        done();
      }, fail.bind(null, done));
    });

    it('should return true if the DBMeter is listening', function (done) {
      var started = false;

      window.DBMeter.start(function() {
        if(!started) {
          started = true;
          window.DBMeter.isListening(function(result) {
            expect(result).toBe(true);
            done();
          });
          window.DBMeter.stop();
          window.DBMeter.delete();
        }
      }, fail.bind(null, done));
    });
  });
};

exports.defineManualTests = function(contentEl, createActionButton) {

  contentEl.innerHTML = '<div class="decibelBarContainer">'
  + '<div class="decibelBar"></div>'
  + '</div>'
  + '<div class="decibel">0dB</div>';

  var decibelBarContainer = document.querySelector('.decibelBarContainer');
  var decibelBar = document.querySelector('.decibelBar');
  var decibel = document.querySelector('.decibel');


  decibelBarContainer.style.display = '-webkit-flex';
  decibelBarContainer.style.display = 'flex';
  decibelBarContainer.style.width = '50px';
  decibelBarContainer.style.WebkitTransform = 'translateX(-50%)';
  decibelBarContainer.style.marginLeft = '50%';
  decibelBarContainer.style.position = 'absolute';
  decibelBarContainer.style.top = '140px';
  decibelBarContainer.style.height = '200px';

  decibel.style.padding = '50px';
  decibel.style.fontSize = '100px';
  decibel.style.WebkitTransform = 'translateX(-50%)';
  decibel.style.marginLeft = '50%';
  decibel.style.position= 'absolute';
  decibel.style.top = '300px';
  decibel.style.textTransform = 'none';

  decibelBar.style.background ='linear-gradient(to top, #009bca 0px, #009bca 25px, #009182 50px, #009182 100px, #009182 200px)';
  decibelBar.style.flex = '0 1 auto';
  decibelBar.style.alignSelf = 'flex-end';
  decibelBar.style.WebkitFlex = '0 1 auto';
  decibelBar.style.WebkitAlignSelf = 'flex-end';
  decibelBar.style.width = '100%';
  decibelBar.style.height = '2px';

  createActionButton('Start DBMeter', function() {
    DBMeter.start(function(dB) {
      decibelBar.style.height = parseFloat(dB, 10) + '%';
      decibel.innerHTML = parseInt(dB, 10) + 'dB';
    }, function(e) {
      console.log('code: ' + e.code + ', message: ' + e.message);
    });
  });

  createActionButton('Stop DBMeter', function() {
    DBMeter.stop(function() {
      decibelBar.style.height = '0';
      decibel.innerHTML = '0dB';
    }, function(e) {
      console.log('code: ' + e.code + ', message: ' + e.message);
    });
  });

};
