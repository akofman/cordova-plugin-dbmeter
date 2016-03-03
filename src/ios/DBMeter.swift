import Foundation
import AVFoundation

@objc(DBMeter) class DBMeter : CDVPlugin {

  private let LOG_TAG = "DBMeter"
  private let REQ_CODE = 0
  private var isListening: Bool = false
  private var audioRecorder: AVAudioRecorder!
  private var command: CDVInvokedUrlCommand!
  private var timer: dispatch_source_t!
  private var isTimerExists: Bool = false

  /**
   This plugin provides the decibel level from the microphone.
   */
  init(commandDelegate: CDVCommandDelegate) {
    super.init()
    self.commandDelegate = commandDelegate
  }

  /**
   Permits to free the memory from the audioRecord instance
   */
  func destroy(command: CDVInvokedUrlCommand) {
    if (self.isListening) {
      dispatch_suspend(self.timer)
      self.isListening = false
    }

    self.command = nil

    if (self.audioRecorder != nil) {

      self.audioRecorder.stop()
      self.audioRecorder = nil

      let pluginResult = CDVPluginResult(status: CDVCommandStatus_OK)
      self.commandDelegate!.sendPluginResult(pluginResult, callbackId: command.callbackId)
    } else {
      self.sendPluginError(command.callbackId, errorCode: PluginError.DBMETER_NOT_INITIALIZED, errorMessage: "DBMeter is not initialized")
    }
  }

  /**
   Starts listening the audio signal and sends dB values as a
   CDVPluginResult keeping the same calback alive.
   */
  func start(command: CDVInvokedUrlCommand) {
    self.commandDelegate!.runInBackground({
      self.command = command

      if (!self.isTimerExists) {
        self.timer = dispatch_source_create(DISPATCH_SOURCE_TYPE_TIMER, 0, 0, dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0))
        dispatch_source_set_event_handler(self.timer, self.timerCallBack)
        dispatch_source_set_timer(self.timer, DISPATCH_TIME_NOW, NSEC_PER_SEC / 300, 0)
        self.isTimerExists = true
      }

      if (self.audioRecorder == nil) {
        let url: NSURL = NSURL.fileURLWithPath("/dev/null")

        let settings = [
          AVFormatIDKey: Int(kAudioFormatAppleLossless),
          AVSampleRateKey: 44100.0,
          AVNumberOfChannelsKey: 1 as NSNumber,
          AVEncoderAudioQualityKey: AVAudioQuality.High.rawValue
        ]

        do {
          let audioSession: AVAudioSession = AVAudioSession.sharedInstance()
          try audioSession.setCategory(AVAudioSessionCategoryRecord)
          try audioSession.setActive(true)

          self.audioRecorder = try AVAudioRecorder(URL: url, settings: settings)
          self.audioRecorder.meteringEnabled = true
        } catch {
          self.sendPluginError(command.callbackId, errorCode: PluginError.DBMETER_NOT_INITIALIZED, errorMessage: "Error while initializing DBMeter")
        }
      }
      if (!self.isListening) {
        self.isListening = true
        self.audioRecorder.record()

        dispatch_resume(self.timer)
      }
    })
  }

  /**
   Stops listening the audio signal.
   Even if stopped, the AVAudioRecorder instance still exist.
   To destroy this instance, please use the destroy method.
   */
  func stop(command: CDVInvokedUrlCommand) {
    self.commandDelegate!.runInBackground({
      if (self.isListening) {
        self.isListening = false

        if (self.audioRecorder != nil && self.audioRecorder.recording) {
          dispatch_suspend(self.timer)
          self.audioRecorder.stop()
        }

        let pluginResult = CDVPluginResult(status: CDVCommandStatus_OK)
        self.commandDelegate!.sendPluginResult(pluginResult, callbackId: command.callbackId)
      } else {
        self.sendPluginError(command.callbackId, errorCode: PluginError.DBMETER_NOT_LISTENING, errorMessage: "DBMeter is not listening")
      }
    })
  }

  /**
   Returns whether the DBMeter is listening.
   */
  func isListening(command: CDVInvokedUrlCommand) {
    let pluginResult = CDVPluginResult(status: CDVCommandStatus_OK, messageAsBool: self.isListening)
    self.commandDelegate!.sendPluginResult(pluginResult, callbackId: command.callbackId)
  }

  private func timerCallBack() {
    autoreleasepool {
      if (self.isListening && self.audioRecorder != nil) {
        self.audioRecorder.updateMeters()

        let peakPowerForChannel = pow(10, (self.audioRecorder.averagePowerForChannel(0) / 20))
        let db = Int32(round(20 * log10(peakPowerForChannel) + 90))

        let pluginResult = CDVPluginResult(status: CDVCommandStatus_OK, messageAsInt: db)
        pluginResult.setKeepCallbackAsBool(true)
        self.commandDelegate!.sendPluginResult(pluginResult, callbackId: self.command.callbackId)
      }
    }
  }

  /**
   Convenient method to send plugin errors.
   */
  private func sendPluginError(callbackId: String, errorCode: PluginError, errorMessage: String) {
    let pluginResult = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAsDictionary: ["code": errorCode.hashValue, "message": errorMessage])
    self.commandDelegate!.sendPluginResult(pluginResult, callbackId: callbackId)
  }

  enum PluginError: String {
    case DBMETER_NOT_INITIALIZED = "0"
    case DBMETER_NOT_LISTENING = "1"
  }
}
