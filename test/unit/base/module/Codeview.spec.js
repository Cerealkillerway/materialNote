/**
 * Codeview.spec.js
 * (c) 2015~ materialnote Team
 * materialnote may be freely distributed under the MIT license./
 */
define([
  'chai',
  'materialnote/base/Context',
  'materialnote/base/module/Codeview'
], function (chai, Context, Codeview) {
  'use strict';

  var expect = chai.expect;

  describe('Codeview', function () {
    var codeview, context;

    beforeEach(function () {
      var options = $.extend({}, $.materialnote.options);
      options.langInfo = $.extend(true, {
      }, $.materialnote.lang['en-US'], $.materialnote.lang[options.lang]);
      context = new Context($('<div><p>hello</p></div>'), options);
      codeview = new Codeview(context);
    });

    it('should toggle codeview mode', function () {
      expect(codeview.isActivated()).to.be.false;
      codeview.toggle();
      expect(codeview.isActivated()).to.be.true;
      codeview.toggle();
      expect(codeview.isActivated()).to.be.false;
    });
  });
});
