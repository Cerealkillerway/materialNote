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
            'materialnote.keyup materialnote.scroll': function () {
                self.update();
            },
            'materialnote.change': function(event, target) {
                self.update(target);
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

            let isCell = dom.isCell(target);
            let isTable = dom.isTable(target);

            if (isTable || isCell) {
                let tableInfo = context.invoke('editor.getTableInfo', target);

                // handle buttons active status
                this.$popover.find('.btn-group.note-materializeOptions').children('.note-btn').removeClass('active');
                if (tableInfo.bordered) {
                    this.$popover.find('#note-table-bordered').addClass('active');
                }
                if (tableInfo.striped) {
                    this.$popover.find('#note-table-striped').addClass('active');
                }
                if (tableInfo.highlighted) {
                    this.$popover.find('#note-table-highlighted').addClass('active');
                }
                if (tableInfo.responsive) {
                    this.$popover.find('#note-table-responsive').addClass('active');
                }
                if (tableInfo.centered) {
                    this.$popover.find('#note-table-centered').addClass('active');
                }

                if (isCell) {
                    let pos = dom.posFromPlaceholder(target);

                    this.$popover.css({
                        display: 'block',
                        left: pos.left,
                        top: pos.top
                    });
                }
            }
            else {
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
