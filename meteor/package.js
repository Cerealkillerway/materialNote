// package metadata file for Meteor.js
'use strict';

var packageName = 'materialnote:materialnote';  // http://atmospherejs.com/materialnote:materialnote
var where = 'client';  // where to install: 'client' or 'server'. For both, pass nothing.

var packageJson = JSON.parse(Npm.require("fs").readFileSync('package.json'));

Package.describe({
  name: packageName,
  summary: 'materialnote (official): jQuery+Bootstrap WYSIWYG editor with embedded images support',
  version: packageJson.version,
  git: 'https://github.com/materialnote/materialnote.git'
});

Package.onUse(function (api) {
  api.versionsFrom(['METEOR@0.9.0', 'METEOR@1.0']);
  api.use([
    'jquery',
    'twbs:bootstrap@3.3.1'
  ], where);
  // no exports - materialnote adds itself to jQuery
  api.addFiles([
    'dist/materialnote.js',
    'dist/materialnote.css'
  ], where);

  api.addAssets([
    'dist/font/materialnote.eot',
    'dist/font/materialnote.ttf',
    'dist/font/materialnote.woff'
  ], where);
});

Package.onTest(function (api) {
  api.use(packageName, where);
  api.use('tinytest', where);

  api.addFiles('meteor/test.js', where);
});
