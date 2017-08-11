define([
    'jquery',
    'materialnote/base/core/agent'
], function ($, agent) {
    var HelpDialog = function (context) {
        var self = this;
        var ui = $.materialnote.ui;

        var $editor = context.layoutInfo.editor;
        var options = context.options;
        var lang = options.langInfo;

        this.createShortCutList = function () {
            var keyMap = options.keyMap[agent.isMac ? 'mac' : 'pc'];
            return Object.keys(keyMap).map(function (key) {
                var command = keyMap[key];
                var $row = $('<div><div class="help-list-item"/></div>');
                $row.append($('<label><kbd>' + key + '</kdb></label>').css({
                    'width': 180,
                    'margin-right': 10
                })).append($('<span/>').html(context.memo('help.' + command) || command));
                return $row.html();
            }).join('');
        };

        this.initialize = function () {
            var $container = options.dialogsInBody ? $(document.body) : $editor;

            var body = [
                '<p class="text-center">',
                '<a href="http://web-forge.info/materialnote" target="_blank">materialnote @VERSION</a> · ',
                '<a href="https://github.com/Cerealkillerway/materialNote" target="_blank">' + lang.help.project + '</a> · ',
                '<a href="https://github.com/Cerealkillerway/materialNote/issues" target="_blank">' + lang.help.issues + '</a>',
                '</p>'
            ].join('');

            this.$dialog = ui.dialog({
                title: lang.options.help,
                fade: options.dialogsFade,
                body: this.createShortCutList(),
                footer: body,
                id: 'note-help-modal',
                callback: function ($node) {
                    $node.find('.modal-body').css({
                        'max-height': 300,
                        'overflow': 'scroll'
                    });
                }
            }).render().appendTo($container);

            this.$dialog.modal();
        };

        this.destroy = function () {
            ui.hideDialog(this.$dialog);
            this.$dialog.remove();
        };

        /**
        * show help dialog
        *
        * @return {Promise}
        */
        this.showHelpDialog = function () {
            return $.Deferred(function (deferred) {
                ui.onDialogShown(self.$dialog, function () {
                    context.triggerEvent('dialog.shown');
                    deferred.resolve();
                });
                ui.showDialog(self.$dialog);
            }).promise();
        };

        this.show = function () {
            context.invoke('editor.saveRange');
            this.showHelpDialog().then(function () {
                context.invoke('editor.restoreRange');
            });
        };
    };

    return HelpDialog;
});
