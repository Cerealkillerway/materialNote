/**
 * key.spec.js
 * (c) 2013~ Alan Hong
 * materialnote may be freely distributed under the MIT license./
 */
define([
  'chai',
  'materialnote/base/core/key'
], function (chai, key) {
  'use strict';

  var expect = chai.expect;

  describe('base:core.key', function () {
    describe('isEdit', function () {
      it('should return true for BACKSPACE', function () {
        expect(key.isEdit(key.code.BACKSPACE)).to.be.true;
      });
       it('should return true for DELETE', function () {
        expect(key.isEdit(key.code.DELETE)).to.be.true;
      });
    });
    describe('isMove', function () {
      it('should return true for LEFT', function () {
        expect(key.isMove(key.code.LEFT)).to.be.true;
      });
    });
  });
});
