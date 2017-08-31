define([
    'materialnote/base/core/key'
],
function (key) {
    var ImageDialog = function (context) {
        var self = this;
        var ui = $.materialnote.ui;

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

            var body =
            '<div class="row">' +
                '<div class="col s12">' +
                    '<div class="file-field input-field">' +
                        '<div class="btn file-uploader-wrapper">' +
                            '<span>Files</span>' +
                            '<input class="note-image-input" type="file" multiple>' +
                        '</div>' +
                        '<div class="file-path-wrapper">' +
                            '<input class="file-path" type="text" placeholder="' + lang.image.selectFromFiles + '">' +
                        '</div>' +
                    '</div>' +
                    imageLimitation +
                '</div>' +
            '</div>' +

            '<div clas="row">' +
                '<div class="input-field col s12">' +
                    '<input class="note-image-url" id="image-url" type="text">' +
                    '<label for="image-url">' + lang.image.url + '</label>' +
                '</div>' +
            '</div>' +

            '<div class="row">' +
                '<div class="col s12 m6">' +
                    '<input type="checkbox" id="note-image-responsive" class="note-image-option" checked="checked" />' +
                    '<label class="note-table-option" for="note-image-responsive">' + lang.image.responsive + '</label>' +
                '</div>' +
            '</div>';

            var footer = [
                '<a href="#!" class="modal-action modal-close waves-effect waves-light btn ">' + lang.shortcut.close + '</a>',
                '<button href="#" class="btn note-image-btn disabled" disabled>' + lang.image.insert + '</button>'
            ].join('');

            this.$dialog = ui.dialog({
                title: lang.image.insert,
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

                    ui.toggleBtn($imageBtn, false);
                    context.triggerEvent('dialog.shown');

                    // Cloning imageInput to clear element.
                    $imageInput.replaceWith($imageInput.clone()
                    .on('change', function () {
                        data.resolve(this.files || this.value);
                    })
                    .val('')
                    );
                    // clean file-path input
                    self.$dialog.find('.file-path').val('');

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
            data = $.Deferred();

            data.then(function (images) {
                let imageOptions = {
                    responsive: self.$dialog.find('#note-image-responsive').prop('checked')
                };

                // [workaround] hide dialog before restore range for IE range focus
                ui.hideDialog(self.$dialog);
                context.invoke('editor.restoreRange');

                if (typeof images === 'string') { // image url
                    context.invoke('editor.insertImage', {images: images, imageOptions: imageOptions});
                } else { // array of files
                    context.invoke('editor.insertImagesOrCallback', {images: images, imageOptions: imageOptions});
                }
            }).fail(function () {
                context.invoke('editor.restoreRange');
            });
        };
    };

    return ImageDialog;
});
