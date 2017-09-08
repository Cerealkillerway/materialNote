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

            return Object.keys(keyMap).map(function(key) {
                let command = keyMap[key];
                let $row = $('<div></div>');
                let $wrapper = $('<div class="row note-help-row"></div>');
                let $leftCol = $('<div class="col s12 m4 s3 note-help-row-left"><label><kbd>' + key + '</kdb></label></div>');
                let $rightCol = $('<div class="col s12 m8 s9 note-help-row-right"/>').html(context.memo('help.' + command) || command);

                $wrapper.append($leftCol).append($rightCol);
                $row.append($wrapper);

                return $row.html();
            }).join('');
        };

        this.initialize = function () {
            var $container = options.dialogsInBody ? $(document.body) : $editor;

            var footer = [
                '<p class="text-center">',
                '<a href="http://web-forge.info/materialnote" target="_blank">materialnote @VERSION</a> - ',
                '<a href="https://github.com/Cerealkillerway/materialNote" target="_blank">' + lang.help.project + '</a> - ',
                '<a href="https://github.com/Cerealkillerway/materialNote/issues" target="_blank">' + lang.help.issues + '</a>',
                '</p>'
            ].join('');

            this.$dialog = ui.dialog({
                title: lang.options.help,
                fade: options.dialogsFade,
                body: '<div class="row help-content"><div class="help-container">' + this.createShortCutList() + '</div></div>',
                footer: footer,
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
