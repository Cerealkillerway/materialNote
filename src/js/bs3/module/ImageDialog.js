define([
    'summernote/base/core/key'
],
function (key) {
    var ImageDialog = function (context) {
        var self = this;
        var ui = $.summernote.ui;

        var $editor = context.layoutInfo.editor;
        var options = context.options;
        var lang = options.langInfo;
        var data;

        this.initialize = function () {
            var $container = options.dialogsInBody ? $(document.body) : $editor;

            var imageLimitation = '';
            if (options.maximumImageFileSize) {
                var unit = Math.floor(Math.log(options.maximumImageFileSize) / Math.log(1024));
                var readableSize = (options.maximumImageFileSize / Math.pow(1024, unit)).toFixed(2) * 1 +
                ' ' + ' KMGTP'[unit] + 'B';
                imageLimitation = '<small>' + lang.image.maximumFileSize + ' : ' + readableSize + '</small>';
            }

            var body = '<div class="form-group note-group-select-from-files">' +
            '<label>' + lang.image.selectFromFiles + '</label>' +
            '<input class="note-image-input form-control" type="file" name="files" accept="image/*" multiple="multiple" />' +
            imageLimitation +
            '</div>' +
            '<div class="form-group note-group-image-url" style="overflow:auto;">' +
            '<label>' + lang.image.url + '</label>' +
            '<input class="note-image-url form-control col-md-12" type="text" />' +
            '</div>';
            var footer = [
                '<a href="#!" class="modal-action modal-close waves-effect waves-light btn ">' + lang.shortcut.close + '</a>',
                '<button href="#" class="btn note-image-btn disabled" disabled>' + lang.image.insert + '</button>'
            ].join('');

            this.$dialog = ui.dialog({
                title: lang.image.insert,
                fade: options.dialogsFade,
                body: body,
                footer: footer,
                id: 'note-image-modal'
            }).render().appendTo($container);

            // init materialize modal plugin
            this.$dialog.modal({
                ready: function() {
                    var $imageInput = self.$dialog.find('.note-image-input'),
                        $imageUrl = self.$dialog.find('.note-image-url'),
                        $imageBtn = self.$dialog.find('.note-image-btn');

                    context.triggerEvent('dialog.shown');

                    // Cloning imageInput to clear element.
                    $imageInput.replaceWith($imageInput.clone()
                    .on('change', function () {
                        data.resolve(this.files || this.value);
                    })
                    .val('')
                    );

                    $imageBtn.click(function (event) {
                        event.preventDefault();
                        data.resolve($imageUrl.val());
                    });

                    $imageUrl.on('keyup paste', function () {
                        var url = $imageUrl.val();
                        ui.toggleBtn($imageBtn, url);
                    }).val('').trigger('focus');
                    self.bindEnterKey($imageUrl, $imageBtn);
                },
                complete: function() {
                    var $imageInput = self.$dialog.find('.note-image-input'),
                        $imageUrl = self.$dialog.find('.note-image-url'),
                        $imageBtn = self.$dialog.find('.note-image-btn');

                    $imageInput.off('change');
                    $imageUrl.off('keyup paste keypress');
                    $imageBtn.off('click');

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

        this.show = function () {
            context.invoke('editor.saveRange');
            ui.showDialog(self.$dialog);
            data = $.Deferred()

            data.then(function (data) {
                // [workaround] hide dialog before restore range for IE range focus
                ui.hideDialog(self.$dialog);
                context.invoke('editor.restoreRange');

                if (typeof data === 'string') { // image url
                    context.invoke('editor.insertImage', data);
                } else { // array of files
                    context.invoke('editor.insertImagesOrCallback', data);
                }
            }).fail(function () {
                context.invoke('editor.restoreRange');
            });
        };

        /**
        * show image dialog
        *
        * @param {jQuery} $dialog
        * @return {Promise}
        */
    };

    return ImageDialog;
});
