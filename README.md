[![Twitter: @alexiskofman](https://img.shields.io/badge/contact-@alexiskofman-blue.svg?style=flat)](https://twitter.com/alexiskofman)
[![License](https://img.shields.io/badge/license-apache2-green.svg?style=flat)](https://github.com/akofman/cordova-plugin-dbmeter/blob/master/LICENSE)
[![Build Status](https://travis-ci.org/akofman/cordova-plugin-dbmeter.svg?branch=master&style=flat)](https://travis-ci.org/akofman/cordova-plugin-dbmeter)

# cordova-plugin-dbmeter

This plugin defines a global DBMeter object, which permits to get the decibel values from the microphone.
Although the object is in the global scope, it is not available until after the deviceready event.

```
document.addEventListener("deviceready", onDeviceReady, false);
function onDeviceReady() {
    DBMeter.start(function(dB){
        console.log(dB);
    });
}
```

## Installation

```
cordova plugin add cordova-plugin-add-swift-support
cordova plugin add cordova-plugin-dbmeter
```
The iOS part is written in Swift so the [Swift support plugin](https://github.com/akofman/cordova-plugin-add-swift-support) is needed.

## Supported Platforms

 - iOS
 - Android

## iOS Quirks

 Since iOS 10 it's mandatory to provide an usage description in the info.plist if trying to access privacy-sensitive data. When the system prompts the user to allow access, this usage description string will displayed as part of the permission dialog box, but if you didn't provide the usage description, the app will crash before showing the dialog. Also, Apple will reject apps that access private data but don't provide an usage description.

 This plugins requires the following usage description:

 - NSMicrophoneUsageDescription describes the reason the app accesses the user's microphone.

 To add this entry into the info.plist, you can use the `edit-config` tag in the platform section of your `config.xml` like this:

```
<edit-config target="NSMicrophoneUsageDescription" file="*-Info.plist" mode="merge">
    <string>need microphone access to record sounds</string>
</edit-config>
```

## Methods

## `DBMeter.start(success, error)`
start listening.

```
DBMeter.start(function(dB){
  console.log(dB);
}, function(e){
  console.log('code: ' + e.code + ', message: ' + e.message);
});
```

## `DBMeter.stop(success, error)`
stop listening.

```
DBMeter.stop(function(){
  console.log("DBMeter well stopped");
}, function(e){
  console.log('code: ' + e.code + ', message: ' + e.message);  
});
```

:warning: If the DBMeter is stopped while is not listening, an error will be
triggered and can be handle from the second callback argument.

## `DBMeter.isListening(success, error)`
retrieve from the success callback whether
the DBMeter is listening.

```
DBMeter.isListening(function(isListening){
  console.log(isListening);
});
```

## `DBMeter.delete(success, error)`
delete the DBMeter instance.

```
DBMeter.delete(function(){
  console.log("Well done !");
}, function(e){
  console.log('code: ' + e.code + ', message: ' + e.message);  
});
```
:warning: If the DBMeter has not been started once before deleting, an error will be
triggered and can be handle from the second callback argument.

## App

An app is available in the app folder and is generated from the [Cordova Plugin Test Framework](https://github.com/apache/cordova-plugin-test-framework).
It permits to launch auto tests and manual tests.

To install it, please follow these steps :

```
cd app && cordova platform add android|ios
cordova run android|ios --device
```
