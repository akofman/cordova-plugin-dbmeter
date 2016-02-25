import Foundation
import AVFoundation

@objc(DBMeter) class DBMeter : CDVPlugin {

  private let LOG_TAG = "DBMeter"
  private let REQ_CODE = 0
  private var isListening: Bool = false
  private var audioRecorder: AVAudioRecorder!
  private var timer: NSTimer!
  private var command: CDVInvokedUrlCommand!

  func create(command: CDVInvokedUrlCommand) {
    if (self.isListening) {
      self.timer.invalidate()
      self.timer = nil
      self.audioRecorder.stop()
      self.audioRecorder = nil
    }

    self.isListening = false

    let url: NSURL = NSURL.fileURLWithPath("/dev/null")

    let settings = [
      AVFormatIDKey: Int(kAudioFormatAppleLossless),
      AVSampleRateKey: 44100.0,
      AVNumberOfChannelsKey: 1 as NSNumber,
      AVEncoderAudioQualityKey: AVAudioQuality.High.rawValue
    ]

    commandDelegate?.runInBackground({
      do {
        let audioSession: AVAudioSession = AVAudioSession.sharedInstance()
        try audioSession.setCategory(AVAudioSessionCategoryRecord)
        try audioSession.setActive(true)

        self.audioRecorder = try AVAudioRecorder(URL: url, settings: settings)
        self.audioRecorder.meteringEnabled = true

        let pluginResult = CDVPluginResult(status: CDVCommandStatus_OK)
        self.commandDelegate!.sendPluginResult(pluginResult, callbackId: command.callbackId)
      } catch {
        self.sendPluginError(command.callbackId, errorCode: PluginError.DBMETER_NOT_INITIALIZED, errorMessage: "Error while initializing DBMeter")
      }
    })
  }

  func destroy(command: CDVInvokedUrlCommand) {
    if (self.audioRecorder != nil) {
      self.isListening = false
      self.audioRecorder.stop()
      self.audioRecorder = nil
      if (self.timer != nil) {
        self.timer.invalidate()
        self.timer = nil
      }
    } else {
      self.sendPluginError(command.callbackId, errorCode: PluginError.DBMETER_NOT_INITIALIZED, errorMessage: "DBMeter is not initialized")
    }
  }

  func start(command: CDVInvokedUrlCommand) {
    self.command = command
    if (self.audioRecorder != nil) {
      if (!self.isListening) {
        self.isListening = true
        commandDelegate?.runInBackground({
          self.audioRecorder.record()
        })
        self.timer = NSTimer.scheduledTimerWithTimeInterval(0.03, target: self, selector: "timerCallBack:", userInfo: self.audioRecorder, repeats: true)
      }
    } else {
      self.sendPluginError(command.callbackId, errorCode: PluginError.DBMETER_NOT_INITIALIZED, errorMessage: "DBMeter is not initialized")
    }
  }

  func stop(command: CDVInvokedUrlCommand) {
    if (self.isListening) {
      self.isListening = false

      if (self.timer != nil) {
        self.timer.invalidate()
      }

      commandDelegate?.runInBackground({
        objc_sync_enter(self)
        if (self.audioRecorder != nil && self.audioRecorder.recording) {
          self.audioRecorder.stop()
        }
        objc_sync_exit(self)
      })

      let pluginResult = CDVPluginResult(status: CDVCommandStatus_OK)
      self.commandDelegate!.sendPluginResult(pluginResult, callbackId: command.callbackId)
    } else {
      self.sendPluginError(command.callbackId, errorCode: PluginError.DBMETER_NOT_LISTENING, errorMessage: "DBMeter is not listening")
    }
  }

  func isListening(command: CDVInvokedUrlCommand) {
    let pluginResult = CDVPluginResult(status: CDVCommandStatus_OK, messageAsBool: self.isListening)
    self.commandDelegate!.sendPluginResult(pluginResult, callbackId: command.callbackId)
  }

  func timerCallBack(timer: NSTimer) {
    let recorder = timer.userInfo as! AVAudioRecorder
    recorder.updateMeters()

    let peakPowerForChannel = pow(10, (recorder.averagePowerForChannel(0) / 20))
    let db = Int32(round(20 * log10(peakPowerForChannel) + 90))

    let pluginResult = CDVPluginResult(status: CDVCommandStatus_OK, messageAsInt: db)
    pluginResult.setKeepCallbackAsBool(true)
    self.commandDelegate!.sendPluginResult(pluginResult, callbackId: self.command.callbackId)
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
