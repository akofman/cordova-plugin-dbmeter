var app = {
  // Application Constructor
  initialize: function() {
    this.bindEvents();
  },
  // Bind Event Listeners
  //
  // Bind any events that are required on startup. Common events are:
  // 'load', 'deviceready', 'offline', and 'online'.
  bindEvents: function() {
    document.addEventListener('deviceready', this.onDeviceReady, false);
  },
  // deviceready Event Handler
  //
  // The scope of 'this' is the event. In order to call the 'receivedEvent'
  // function, we must explicitly call 'app.receivedEvent(...);'
  onDeviceReady: function() {
    app.receivedEvent('deviceready');
  },
  // Update DOM on a Received Event
  receivedEvent: function(id) {
    var parentElement = document.getElementById(id);
    var listeningElement = parentElement.querySelector('.listening');
    var receivedElement = parentElement.querySelector('.received');

    listeningElement.setAttribute('style', 'display:none;');
    receivedElement.setAttribute('style', 'display:block;');
  }
};

var decibel = document.querySelector('.decibel');
var decibelBar = document.querySelector('.decibelBar');

var meter = {
  start: function() {
    DBMeter.start(function(dB){
      if(dB > 0) {
        decibelBar.style.height = parseFloat(dB * 130 / 100, 10) + '%';
        decibel.innerHTML = parseInt(dB, 10) + 'dB';
      }
      else {
        decibelBar.style.height = '0';
        decibel.innerHTML = '0dB';
      }
    }, function(e){
      console.log('code: ' + e.code + ', message: ' + e.message);
    });
  },
  stop: function() {
    DBMeter.stop(function(){
      decibelBar.style.height = '0';
      decibel.innerHTML = '0dB';
    }, function(e){
      console.log('code: ' + e.code + ', message: ' + e.message);
    });
  }
}

app.initialize();
