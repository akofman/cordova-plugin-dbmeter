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


public class DBMeter extends CordovaPlugin {

    private static final String LOG_TAG = "DBMeter";
    private static AudioRecord audioRecord;
    private static short[] buffer;
    private static Timer timer;
    private static boolean isListening = false;
    private static final int REQ_CODE = 0;

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
            } else {
                LOG.e(LOG_TAG, "Not a valid action: " + action);
                return false;
            }
        }
        return true;
    }

    public void start(final CallbackContext callbackContext) {
        if (audioRecord == null) {
            int rate = AudioTrack.getNativeOutputSampleRate(AudioManager.STREAM_SYSTEM);
            int bufferSize = AudioRecord.getMinBufferSize(rate, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT);

            audioRecord = new AudioRecord(
                    MediaRecorder.AudioSource.MIC,
                    rate,
                    AudioFormat.CHANNEL_IN_MONO,
                    AudioFormat.ENCODING_PCM_16BIT,
                    bufferSize);

            buffer = new short[bufferSize];
        }

        if (!isListening) {
            isListening = true;
            audioRecord.startRecording();

            timer = new Timer(LOG_TAG, true);

            //start calling run in a timertask
            TimerTask timerTask = new TimerTask() {
                public void run() {
                    int readSize = audioRecord.read(buffer, 0, buffer.length);
                    double sum = 0;
                    for (int i = 0; i < readSize; i++) {
                        sum += buffer[i] * buffer[i];
                    }
                    double amplitude = sum / readSize;
                    double db = 20.0 * Math.log10(amplitude / 32767.0);

                    LOG.d(LOG_TAG, Double.toString(db));

                    PluginResult result = new PluginResult(PluginResult.Status.OK, (float) db);
                    result.setKeepCallback(true);
                    callbackContext.sendPluginResult(result);
                }
            };
            timer.scheduleAtFixedRate(timerTask, 0, 100);
        } else {
            this.sendPluginError(callbackContext, PluginError.DBMETER_ALREADY_LISTENING, "DBMeter is already listening");
        }
    }

    public void stop(final CallbackContext callbackContext) {
        isListening = false;

        cordova.getThreadPool().execute(new Runnable() {
            public void run() {
                if (audioRecord != null) {
                    timer.cancel();
                    audioRecord.stop();
                    callbackContext.success();
                }
            }
        });
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
        DBMETER_ALREADY_LISTENING
    }
}
