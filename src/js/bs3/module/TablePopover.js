define([
  'materialnote/base/core/agent',
  'materialnote/base/core/func',
  'materialnote/base/core/list',
  'materialnote/base/core/dom'
], function (agent, func, list, dom) {
  var TablePopover = function (context) {
    var self = this;
    var ui = $.materialnote.ui;

    var options = context.options;

    this.events = {
      'materialnote.mousedown': function (we, e) {
        self.update(e.target);
      },
      'materialnote.keyup materialnote.scroll materialnote.change': function () {
        self.update();
      },
      'materialnote.disable': function () {
        self.hide();
      }
    };

    this.shouldInitialize = function () {
      return !list.isEmpty(options.popover.table);
    };

    this.initialize = function () {
      this.$popover = ui.popover({
        className: 'note-table-popover'
      }).render().appendTo('body');
      var $content = this.$popover.find('.popover-content');

      context.invoke('buttons.build', $content, options.popover.table);

      // [workaround] Disable Firefox's default table editor
      if (agent.isFF) {
        document.execCommand('enableInlineTableEditing', false, false);
      }
    };

    this.destroy = function () {
      this.$popover.remove();
    };

    this.update = function (target) {
      if (context.isDisabled()) {
        return false;
      }

      var isCell = dom.isCell(target);

      if (isCell) {
        var pos = dom.posFromPlaceholder(target);
        this.$popover.css({
          display: 'block',
          left: pos.left,
          top: pos.top
        });
      } else {
        this.hide();
      }

      return isCell;
    };

    this.hide = function () {
      this.$popover.hide();
    };
  };

  return TablePopover;
});
