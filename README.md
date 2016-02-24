# cordova-plugin-dbmeter



## Installation

```sh
cordova plugin add https://github.com/akofman/cordova-plugin-dbmeter.git
```

## Supported Platforms

 - iOS
 - Android

## Methods

`DBMeter.init(success, error)` : init the DBMeter.

`DBMeter.start(success, error)` : start listening.

`DBMeter.stop(success, error)` : stop listening.

`DBMeter.isListening(success, error)` : retrieve from the success callback whether
the DBMeter is listening.

`DBMeter.delete(success, error)` : delete the DBMeter instance.

## Demo

A demo app is available in the demo folder.
To install it, please follow the following steps :

```sh
cd demo && cordova platform add android|ios
cordova run android|ios --device
```
