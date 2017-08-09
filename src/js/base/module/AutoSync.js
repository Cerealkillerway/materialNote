define([
  'materialnote/base/core/dom'
], function (dom) {
  /**
   * textarea auto sync.
   */
  var AutoSync = function (context) {
    var $note = context.layoutInfo.note;

    this.events = {
      'materialnote.change': function () {
        $note.val(context.invoke('code'));
      }
    };

    this.shouldInitialize = function () {
      return dom.isTextarea($note[0]);
    };
  };

  return AutoSync;
});
