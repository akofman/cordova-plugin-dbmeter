/*
* This hook adds all the needed config to implement a Cordova plugin with Swift.
*
*  - It adds a Bridging header importing Cordova/CDV.h if it's not already
*    the case. Else it concats all the bridging headers in one single file.
*
*    /!\ Please be sure not naming your bridging header file 'Bridging-Header.h'
*    else it won't be supported.
*
*  - It puts the ios deployment target to 7.0 in case your project would have a
*    lesser one.
*
*  - It updates the EMBEDDED_CONTENT_CONTAINS_SWIFT build setting to YES.
*/

var child_process = require('child_process');
var fs = require('fs');
var path = require('path');
var xcode = require('xcode');

module.exports = function(context) {
  var _ = context.requireCordovaModule('underscore');
  var IOS_MIN_DEPLOYMENT_TARGET = '7.0';
  var bridgingHeaderPath;
  var bridgingHeaderContent;

  var projectRoot = context.opts.projectRoot;
  var projectName = getConfigParser(context, path.join(projectRoot, 'config.xml')).name();
  var platformPath = path.join(projectRoot, 'platforms', 'ios');
  var projectPath = path.join(platformPath, projectName);
  var pluginsPath = path.join(projectPath, 'Plugins');
  var pbxprojPath = path.join(platformPath, projectName + '.xcodeproj', 'project.pbxproj');
  var xcodeProject = xcode.project(pbxprojPath);

  xcodeProject.parseSync();

  bridgingHeaderPath = unquote(xcodeProject.getBuildProperty('SWIFT_OBJC_BRIDGING_HEADER'));

  try{
    fs.statSync(bridgingHeaderPath);
  } catch(err) {
    // If the bridging header doesn't exist, we create it with the minimum
    // Cordova/CDV.h import.
    bridgingHeaderPath = path.join(projectPath, 'Bridging-Header.h');
    bridgingHeaderContent = ['//',
    '//  Use this file to import your target\'s public headers that you would like to expose to Swift.',
    '//',
    '#import <Cordova/CDV.h>']

    fs.writeFileSync(bridgingHeaderPath, bridgingHeaderContent.join('\n'), { encoding: 'utf-8', flag: 'w' });
    xcodeProject.addHeaderFile('Bridging-Header.h');
    xcodeProject.updateBuildProperty('SWIFT_OBJC_BRIDGING_HEADER', '"' + bridgingHeaderPath + '"');
    console.log('Update IOS build setting SWIFT_OBJC_BRIDGING_HEADER to:', bridgingHeaderPath);
  }

  // Look for any bridging header defined in the plugin
  child_process.exec('find . -name "*Bridging-Header*.h"', { cwd: pluginsPath }, function (error, stdout, stderr) {
    var bridgingHeader = path.basename(bridgingHeaderPath);
    var headers = _.compact(stdout.toString().split('\n').map(function (filePath) {
      return path.basename(filePath);
    }));

    // if other bridging headers are found, they are imported in the
    // one already configured in the project.
    var content = fs.readFileSync(bridgingHeaderPath, 'utf-8');

    headers.forEach(function(header) {
      if(header !== bridgingHeader && !~content.indexOf(header)) {
        if (content.charAt(content.length - 1) !== '\n') {
          content += '\n';
        }
        content += '#import "' + header + '"\n'
        console.log('Importing', header, 'into', bridgingHeaderPath);
      }
    });
    fs.writeFileSync(bridgingHeaderPath, content, 'utf-8');

    if(parseFloat(xcodeProject.getBuildProperty('IPHONEOS_DEPLOYMENT_TARGET')) < parseFloat(IOS_MIN_DEPLOYMENT_TARGET)){
      xcodeProject.updateBuildProperty('IPHONEOS_DEPLOYMENT_TARGET', IOS_MIN_DEPLOYMENT_TARGET);
      console.log('Update IOS project deployment target to:', IOS_MIN_DEPLOYMENT_TARGET);
    }

    xcodeProject.updateBuildProperty('EMBEDDED_CONTENT_CONTAINS_SWIFT', 'YES');
    console.log('Update IOS build setting EMBEDDED_CONTENT_CONTAINS_SWIFT to: YES');

    // xcodeProject.updateBuildProperty('LD_RUNPATH_SEARCH_PATHS','"@executable_path/Frameworks"');
    // console.log('Update IOS build setting LD_RUNPATH_SEARCH_PATHS to: @executable_path/Frameworks');

    fs.writeFileSync(pbxprojPath, xcodeProject.writeSync());
  });
}

function getConfigParser(context, config){
  var semver = context.requireCordovaModule('semver');

  if(semver.lt(context.opts.cordova.version, '5.4.0')) {
    ConfigParser = context.requireCordovaModule('cordova-lib/src/ConfigParser/ConfigParser');
  } else {
    ConfigParser = context.requireCordovaModule('cordova-common/src/ConfigParser/ConfigParser');
  }

  return new ConfigParser(config);
}

function unquote(str) {
  if (str) return str.replace(/^"(.*)"$/, "$1");
}
