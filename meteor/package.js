// package metadata file for Meteor.js
'use strict';

var packageName = 'cerealkiller:materialnote';  // http://atmospherejs.com/cerealkiller:materialnote
var where = 'client';  // where to install: 'client' or 'server'. For both, pass nothing.

var packageJson = JSON.parse(Npm.require("fs").readFileSync('../package.json'));

Package.describe({
  name: packageName,
  summary: 'materialnote (official): jQuery+Materialize WYSIWYG editor with embedded images support',
  version: packageJson.version,
  git: 'https://github.com/Cerealkillerway/materialNote'
});

Package.onUse(function (api) {
  api.versionsFrom(['METEOR@1.6']);
  api.use([
    'jquery',
  ], where);
  // no exports - materialnote adds itself to jQuery
  api.addFiles([
    '../dist/materialnote.js',
    '../dist/materialnote.css'
  ], where);
});

Package.onTest(function (api) {
  api.use(packageName, where);
  api.use('tinytest', where);

  api.addFiles('test.js', where);
});
