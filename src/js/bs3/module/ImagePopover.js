define([
    'materialnote/base/core/func',
    'materialnote/base/core/list',
    'materialnote/base/core/dom'
], function (func, list, dom) {

    /**
    * Image popover module
    *  mouse events that show/hide popover will be handled by Handle.js.
    *  Handle.js will receive the events and invoke 'imagePopover.update'.
    */
    var ImagePopover = function (context) {
        var self = this;
        var ui = $.materialnote.ui;

        var options = context.options;

        this.events = {
            'materialnote.disable': function () {
                self.hide();
            }
        };

        this.shouldInitialize = function () {
            return !list.isEmpty(options.popover.image);
        };

        this.initialize = function () {
            this.$popover = ui.popover({
                className: 'note-image-popover'
            }).render().appendTo('body');
            var $content = this.$popover.find('.popover-content');

            context.invoke('buttons.build', $content, options.popover.image);
        };

        this.destroy = function () {
            this.$popover.remove();
        };

        this.update = function (target) {
            if (dom.isImg(target)) {
                var pos = dom.posFromPlaceholder(target);
                let $editable = context.layoutInfo.editable;
                let editableBottom = $editable.height() + $editable.offset().top;
                let topPosition = pos.top;

                if (topPosition > editableBottom) {
                    topPosition = editableBottom - 15;
                }

                this.$popover.css({
                    display: 'block',
                    left: pos.left,
                    top: topPosition
                });
            } else {
                this.hide();
            }
        };

        this.hide = function () {
            this.$popover.hide();
        };
    };

    return ImagePopover;
});
