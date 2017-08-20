define([
    'materialnote/base/core/key'
], function (key) {
    var LinkDialog = function (context) {
        var self = this;
        var ui = $.materialnote.ui;

        var $editor = context.layoutInfo.editor;
        var options = context.options;
        var lang = options.langInfo;
        var data;
        var linkInfo;

        this.initialize = function () {
            var $container = options.dialogsInBody ? $(document.body) : $editor;

            var body =
            '<div class="row">' +
                '<div class="input-field col s12">' +
                    '<input id="note-link-text" class="note-link-text" type="text">' +
                    '<label for="note-link-text">' + lang.link.textToDisplay + '</label>' +
                '</div>' +
            '</div>' +

            '<div class="row">' +
                '<div class="input-field col s12">' +
                    '<input id="note-link-url" class="note-link-url" type="text">' +
                    '<label for="note-link-url">' + lang.link.url + '</label>' +
                '</div>' +

                (!options.disableLinkTarget ?
                    '<div class="col s12">' +
                        '<input type="checkbox" id="sn-checkbox-open-in-new-window" />' +
                        '<label for="sn-checkbox-open-in-new-window">' + lang.link.openInNewWindow + '</label>' +
                    '</div>' : ''
                ) +

            '</div>';

            var footer = [
                '<a href="#!" class="modal-action modal-close waves-effect waves-light btn ">' + lang.shortcut.close + '</a>',
                '<button href="#" class="btn note-link-btn disabled" disabled>' + lang.link.insert + '</button>'
            ].join('');

            this.$dialog = ui.dialog({
                title: lang.link.insert,
                body: body,
                footer: footer,
                id: 'note-link-modal'
            }).render().appendTo($container);

            this.$dialog.modal({
                ready: function() {
                    var $linkText = self.$dialog.find('.note-link-text'),
                    $linkUrl = self.$dialog.find('.note-link-url'),
                    $linkBtn = self.$dialog.find('.note-link-btn'),
                    $openInNewWindow = self.$dialog.find('input[type=checkbox]');

                    context.triggerEvent('dialog.shown');

                    // if no url was given, copy text to url
                    if (!linkInfo.url) {
                        linkInfo.url = linkInfo.text;
                    }

                    // handle materialize's label state
                    if (linkInfo.text !== '') {
                        $linkText.next('label').addClass('active');
                    }
                    else {
                        $linkText.next('label').removeClass('active');
                    }
                    $linkText.val(linkInfo.text);

                    var handleLinkTextUpdate = function () {
                        self.toggleLinkBtn($linkBtn, $linkText, $linkUrl);
                        // if linktext was modified by keyup,
                        // stop cloning text from linkUrl
                        linkInfo.text = $linkText.val();
                    };

                    $linkText.on('input', handleLinkTextUpdate).on('paste', function () {
                        setTimeout(handleLinkTextUpdate, 0);
                    });

                    var handleLinkUrlUpdate = function () {
                        self.toggleLinkBtn($linkBtn, $linkText, $linkUrl);
                        // display same link on `Text to display` input
                        // when create a new link
                        if (!linkInfo.text) {
                            $linkText.val($linkUrl.val());
                        }
                    };

                    $linkUrl.on('input', handleLinkUrlUpdate).on('paste', function () {
                        setTimeout(handleLinkUrlUpdate, 0);
                    }).val(linkInfo.url).trigger('focus');

                    self.toggleLinkBtn($linkBtn, $linkText, $linkUrl);
                    self.bindEnterKey($linkUrl, $linkBtn);
                    self.bindEnterKey($linkText, $linkBtn);

                    var isChecked = linkInfo.isNewWindow !== undefined ?
                    linkInfo.isNewWindow : context.options.linkTargetBlank;

                    $openInNewWindow.prop('checked', isChecked);

                    $linkBtn.one('click', function(event) {
                        event.preventDefault();

                        data.resolve({
                            range: linkInfo.range,
                            url: $linkUrl.val(),
                            text: $linkText.val(),
                            isNewWindow: $openInNewWindow.is(':checked')
                        });
                        self.$dialog.modal('close');
                    });
                },
                complete: function() {
                    var $linkText = self.$dialog.find('.note-link-text'),
                    $linkUrl = self.$dialog.find('.note-link-url'),
                    $linkBtn = self.$dialog.find('.note-link-btn');

                    // detach events
                    $linkText.off('input paste keypress');
                    $linkUrl.off('input paste keypress');
                    $linkBtn.off('click');

                    if (data.state() === 'pending') {
                        data.reject();
                    }
                }
            });
        };

        this.destroy = function () {
            ui.hideDialog(this.$dialog);
            this.$dialog.remove();
        };

        this.bindEnterKey = function ($input, $btn) {
            $input.on('keypress', function (event) {
                if (event.keyCode === key.code.ENTER) {
                    $btn.trigger('click');
                }
            });
        };

        /**
        * toggle update button
        */
        this.toggleLinkBtn = function ($linkBtn, $linkText, $linkUrl) {
            ui.toggleBtn($linkBtn, $linkText.val() && $linkUrl.val());
        };

        /**
        * @param {Object} layoutInfo
        */
        this.show = function () {
            linkInfo = context.invoke('editor.getLinkInfo');

            context.invoke('editor.saveRange');
            ui.showDialog(self.$dialog);
            data = $.Deferred();

            data.then(function(linkInfo) {
                context.invoke('editor.restoreRange');
                context.invoke('editor.createLink', linkInfo);
            }).fail(function() {
                context.invoke('editor.restoreRange');
            });
        };
        context.memo('help.linkDialog.show', options.langInfo.help['linkDialog.show']);
    };

    return LinkDialog;
});
