var DBMeter = {

  /**
  * Starts listening the audio signal.
  *
  * Returns the current decibel value from the success callback parameter
  * as a float value.
  * @param  {success} callback in case of success
  * @param  {error} callback in case of error
  */
  start: function(success, error) {
    cordova.exec(
      success,
      error,
      'DBMeter', 'start', []
    );
  },

  /**
  * Stops listening any audio signal.
  *
  * @param  {success} callback in case of success
  * @param  {error} callback in case of error
  */
  stop: function(success, error) {
    cordova.exec(
      success,
      error,
      'DBMeter', 'stop', []
    );
  }
};

DBMeter.ERROR_CODES = {
  '0':'DBMETER_ALREADY_LISTENING'
};

module.exports = DBMeter;
