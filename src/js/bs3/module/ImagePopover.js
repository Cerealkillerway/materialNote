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
                let imageInfo = context.invoke('editor.getImageInfo', target);

                if (topPosition > (editableBottom - 15)) {
                    topPosition = editableBottom - 15;
                }

                // handle buttons active status
                // sizes
                this.$popover.find('.btn-group.note-imagesize').children('.note-btn').removeClass('active');
                if (imageInfo.size) {
                    let size = imageInfo.size;

                    this.$popover.find('#note-image-size-' + size).addClass('active');
                }

                // float
                this.$popover.find('.btn-group.note-float').children('.note-btn').removeClass('active');
                if (imageInfo.float) {
                    let float = imageInfo.float;

                    this.$popover.find('#note-image-float-' + float).addClass('active');
                }
                else {
                    this.$popover.find('#note-image-float-none').addClass('active');
                }

                // responsivity
                this.$popover.find('.btn-group.note-responsivity').children('.note-btn').removeClass('active');
                if (imageInfo.responsive) {
                    this.$popover.find('#note-image-responsive').addClass('active');
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
