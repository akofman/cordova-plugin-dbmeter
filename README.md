[![Build Status](https://travis-ci.org/akofman/cordova-plugin-dbmeter.svg?branch=master)](https://travis-ci.org/akofman/cordova-plugin-dbmeter)

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
cordova plugin add cordova-plugin-dbmeter
```
The iOS part is written in Swift so the [Swift support plugin](https://github.com/akofman/cordova-plugin-add-swift-support) is configured
as a dependency in [plugin.xml](https://github.com/akofman/cordova-plugin-dbmeter/blob/master/plugin.xml#L38).

## Supported Platforms

 - iOS
 - Android

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
