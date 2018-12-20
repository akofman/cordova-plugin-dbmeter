import Foundation
import AVFoundation

@objc(DBMeter) class DBMeter : CDVPlugin {

    private let LOG_TAG = "DBMeter"
    private let REQ_CODE = 0
    private var isListening: Bool = false
    private var audioRecorder: AVAudioRecorder!
    private var command: CDVInvokedUrlCommand!
    private var timer: DispatchSourceTimer!
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
    @objc(destroy:)
    func destroy(command: CDVInvokedUrlCommand) {
        if (self.isListening) {
            self.timer.suspend()
            self.isListening = false
        }

        self.command = nil

        if (self.audioRecorder != nil) {

            self.audioRecorder.stop()
            self.audioRecorder = nil

            let pluginResult = CDVPluginResult(status: CDVCommandStatus_OK)
            self.commandDelegate!.send(pluginResult, callbackId: command.callbackId)
        } else {
            self.sendPluginError(callbackId: command.callbackId, errorCode: PluginError.DBMETER_NOT_INITIALIZED, errorMessage: "DBMeter is not initialized")
        }
    }

    /**
     Starts listening the audio signal and sends dB values as a
     CDVPluginResult keeping the same calback alive.
     */
    @objc(start:)
    func start(command: CDVInvokedUrlCommand) {
        self.commandDelegate!.run(inBackground:{
            self.command = command

            if (!self.isTimerExists) {
                self.timer = DispatchSource.makeTimerSource(queue: DispatchQueue.main)
                self.timer.scheduleRepeating(deadline: .now(), interval: DispatchTimeInterval.milliseconds(300))
                self.timer.setEventHandler(handler: self.timerCallBack)
                self.isTimerExists = true
            }

            if (self.audioRecorder == nil) {
                let url: URL = URL.init(fileURLWithPath: "/dev/null")

                let settings : [String:Any] = [
                    AVFormatIDKey: Int(kAudioFormatAppleLossless),
                    AVSampleRateKey: 44100.0,
                    AVNumberOfChannelsKey: 1 as NSNumber,
                    AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
                ]

                do {
                    let audioSession: AVAudioSession = AVAudioSession.sharedInstance()
                    try audioSession.setCategory(AVAudioSessionCategoryPlayAndRecord)
                    try audioSession.setActive(true)

                    self.audioRecorder = try AVAudioRecorder(url: url, settings: settings)
                    self.audioRecorder.isMeteringEnabled = true
                } catch {
                    self.sendPluginError(callbackId: command.callbackId, errorCode: PluginError.DBMETER_NOT_INITIALIZED, errorMessage: "Error while initializing DBMeter")
                }
            }
            if (!self.isListening) {
                self.isListening = true
                self.audioRecorder.record()

                self.timer.resume()
            }
        })
    }

    /**
     Stops listening the audio signal.
     Even if stopped, the AVAudioRecorder instance still exist.
     To destroy this instance, please use the destroy method.
     */
    @objc(stop:)
    public func stop(command: CDVInvokedUrlCommand) {
        self.commandDelegate!.run(inBackground: {
            if (self.isListening) {
                self.isListening = false

                if (self.audioRecorder != nil && self.audioRecorder.isRecording) {
                    self.timer.suspend()
                    self.audioRecorder.stop()
                }

                let pluginResult = CDVPluginResult(status: CDVCommandStatus_OK)
                self.commandDelegate!.send(pluginResult, callbackId: command.callbackId)
            } else {
                self.sendPluginError(callbackId: command.callbackId, errorCode: PluginError.DBMETER_NOT_LISTENING, errorMessage: "DBMeter is not listening")
            }
        })
    }

    /**
     Returns whether the DBMeter is listening.
     */
    @objc(isListening:)
    func isListening(command: CDVInvokedUrlCommand?) -> Bool {
        if (command != nil) {
            let pluginResult = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: self.isListening)
            self.commandDelegate!.send(pluginResult, callbackId: command!.callbackId)
        }
        return self.isListening;
    }

    private func timerCallBack() {
        autoreleasepool {
            if (self.isListening && self.audioRecorder != nil) {
                self.audioRecorder.updateMeters()

                let peakPowerForChannel = pow(10, (self.audioRecorder.averagePower(forChannel: 0) / 20))
                let db = Int32(round(20 * log10(peakPowerForChannel) + 90))

                let pluginResult = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: db)
                pluginResult!.setKeepCallbackAs(true)
                self.commandDelegate!.send(pluginResult, callbackId: self.command.callbackId)
            }
        }
    }

    /**
     Convenient method to send plugin errors.
     */
    private func sendPluginError(callbackId: String, errorCode: PluginError, errorMessage: String) {
        let pluginResult = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: ["code": errorCode.hashValue, "message": errorMessage])
        self.commandDelegate!.send(pluginResult, callbackId: callbackId)
    }

    enum PluginError: String {
        case DBMETER_NOT_INITIALIZED = "0"
        case DBMETER_NOT_LISTENING = "1"
    }
}
