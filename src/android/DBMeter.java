package org.apache.cordova.dbmeter;

import android.Manifest;
import android.media.AudioFormat;
import android.media.AudioManager;
import android.media.AudioRecord;
import android.media.AudioTrack;
import android.media.MediaRecorder;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.LOG;
import org.apache.cordova.PluginResult;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.Timer;
import java.util.TimerTask;

/**
 * This plugin provides the decibel level from the microphone.
 */
public class DBMeter extends CordovaPlugin {

    private static final String LOG_TAG = "DBMeter";
    private static final int REQ_CODE = 0;
    private AudioRecord audioRecord;
    private short[] buffer;
    private Timer timer;
    private boolean isListening = false;


    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        //LOG.setLogLevel(LOG.DEBUG);

        if (!PermissionHelper.hasPermission(this, Manifest.permission.RECORD_AUDIO)) {
            PermissionHelper.requestPermission(this, REQ_CODE, Manifest.permission.RECORD_AUDIO);
        } else {
            if (action.equals("start")) {
                this.start(callbackContext);
            } else if (action.equals("stop")) {
                this.stop(callbackContext);
            } else if (action.equals("isListening")) {
                this.isListening(callbackContext);
            } else if (action.equals("destroy")) {
                this.destroy(callbackContext);
            } else {
                LOG.e(LOG_TAG, "Not a valid action: " + action);
                return false;
            }
        }
        return true;
    }

    /**
     * Permits to free the memory from the audioRecord instance
     *
     * @param callbackContext The callback context used when calling back into JavaScript.
     */
    public void destroy(CallbackContext callbackContext) {
        if (this.audioRecord != null) {
            this.isListening = false;
            this.audioRecord.stop();
            this.audioRecord = null;
            if (this.timer != null) {
                this.timer.cancel();
                this.timer = null;
            }
            callbackContext.success();
        } else {
            sendPluginError(callbackContext, PluginError.DBMETER_NOT_INITIALIZED, "DBMeter is not initialized");
        }
    }

    /**
     * Starts listening the audio signal and sends dB values as a
     * {@link org.apache.cordova.PluginResult PluginResult} using a
     * {@link java.util.TimerTask TimerTask}.
     *
     * @param callbackContext The callback context used when calling back into JavaScript.
     */
    public void start(final CallbackContext callbackContext) {
        final DBMeter that = this;
        cordova.getThreadPool().execute(new Runnable() {
            public void run() {
                if (that.audioRecord == null) {
                    that.isListening = false;
                    int rate = AudioTrack.getNativeOutputSampleRate(AudioManager.STREAM_SYSTEM);
                    int bufferSize = AudioRecord.getMinBufferSize(rate, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT);

                    that.audioRecord = new AudioRecord(
                            MediaRecorder.AudioSource.MIC,
                            rate,
                            AudioFormat.CHANNEL_IN_MONO,
                            AudioFormat.ENCODING_PCM_16BIT,
                            bufferSize);

                    that.buffer = new short[bufferSize];
                }
                if (!that.isListening) {
                    that.isListening = true;
                    that.audioRecord.startRecording();

                    that.timer = new Timer(LOG_TAG, true);

                    //start calling run in a timertask
                    TimerTask timerTask = new TimerTask() {
                        public void run() {
                            int readSize = that.audioRecord.read(that.buffer, 0, that.buffer.length);
                            double db = 0;
                            double maxAmplitude = 0;
                            for (int i = 0; i < readSize; i++) {
                                if (Math.abs(that.buffer[i]) > maxAmplitude) {
                                    maxAmplitude = Math.abs(that.buffer[i]);
                                }
                            }

                            if (maxAmplitude != 0) {
                                db = 20.0 * Math.log10(maxAmplitude / 32767.0) + 90;
                            }

                            LOG.d(LOG_TAG, Double.toString(db));

                            PluginResult result = new PluginResult(PluginResult.Status.OK, (float) db);
                            result.setKeepCallback(true);
                            callbackContext.sendPluginResult(result);
                        }
                    };
                    that.timer.scheduleAtFixedRate(timerTask, 0, 100);
                }
            }
        });
    }

    /**
     * Stops listening the audio signal.
     * Even if stopped, the {@link android.media.AudioRecord AudioRecord} instance still exist.
     * To destroy this instance, please use the {@link #destroy(CallbackContext) destroy} method.
     *
     * @param callbackContext The callback context used when calling back into JavaScript.
     */
    public void stop(final CallbackContext callbackContext) {
        final DBMeter that = this;
        cordova.getThreadPool().execute(new Runnable() {
            public void run() {
                if (that.isListening) {
                    that.isListening = false;


                    if (that.timer != null) {
                        that.timer.cancel();
                    }
                    if (that.audioRecord != null) {
                        that.audioRecord.stop();
                    }
                    callbackContext.success();

                } else {
                    sendPluginError(callbackContext, PluginError.DBMETER_NOT_LISTENING, "DBMeter is not listening");
                }
            }
        });
    }

    /**
     * Returns whether the DBMeter is listening.
     *
     * @param callbackContext The callback context used when calling back into JavaScript.
     */
    public void isListening(final CallbackContext callbackContext) {
        PluginResult result = new PluginResult(PluginResult.Status.OK, this.isListening);
        callbackContext.sendPluginResult(result);
    }

    /**
     * Convenient method to send plugin errors.
     *
     * @param callbackContext The callback context used when calling back into JavaScript.
     * @param error           The error code to return
     * @param message         The error message to return
     */
    private void sendPluginError(CallbackContext callbackContext, PluginError error, String message) {
        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject.put("code", error.ordinal());
            jsonObject.put("message", message);
        } catch (JSONException e) {
            e.printStackTrace();
        }
        callbackContext.error(jsonObject);
    }

    public enum PluginError {
        DBMETER_NOT_INITIALIZED,
        DBMETER_NOT_LISTENING
    }
}
