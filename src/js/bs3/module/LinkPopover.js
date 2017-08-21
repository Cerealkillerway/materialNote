define([
    'materialnote/base/core/func',
    'materialnote/base/core/list',
    'materialnote/base/core/dom'
], function (func, list, dom) {
    var LinkPopover = function (context) {
        var self = this;
        var ui = $.materialnote.ui;

        var options = context.options;

        this.events = {
            'materialnote.keyup materialnote.mouseup materialnote.change': function () {
                self.update();
            },
            'materialnote.disable materialnote.dialog.shown materialnote.scroll': function () {
                self.hide();
            }
        };

        this.shouldInitialize = function () {
            return !list.isEmpty(options.popover.link);
        };

        this.initialize = function () {
            this.$popover = ui.popover({
                className: 'note-link-popover',
                callback: function ($node) {
                    var $content = $node.find('.popover-content');
                    $content.prepend('<span class="popover-link"><a target="_blank"></a>&nbsp;</span>');
                }
            }).render().appendTo('body');
            var $content = this.$popover.find('.popover-content');

            context.invoke('buttons.build', $content, options.popover.link);
        };

        this.destroy = function () {
            this.$popover.remove();
        };

        this.update = function () {
            // Prevent focusing on editable when invoke('code') is executed
            if (!context.invoke('editor.hasFocus')) {
                this.hide();
                return;
            }

            var rng = context.invoke('editor.createRange');
            if (rng.isCollapsed() && rng.isOnAnchor()) {
                var anchor = dom.ancestor(rng.sc, dom.isAnchor);
                var href = $(anchor).attr('href');
                this.$popover.find('a').attr('href', href).html(href);

                var pos = dom.posFromPlaceholder(anchor);
                let linkInfo = context.invoke('editor.getLinkInfo');

                // handle buttons active status
                // open in new window
                this.$popover.find('.btn-group.note-link').children('.note-btn').removeClass('active');
                if (linkInfo.isNewWindow) {
                    this.$popover.find('#note-link-open-new-window').addClass('active');
                }

                this.$popover.css({
                    display: 'block',
                    left: pos.left,
                    top: pos.top
                });
            } else {
                this.hide();
            }
        };

        this.hide = function () {
            this.$popover.hide();
        };
    };

    return LinkPopover;
});
