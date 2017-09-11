define([
    'materialnote/base/core/key'
], function (key) {
    var CardDialog = function (context) {
        var self = this;
        var ui = $.materialnote.ui;

        var $editor = context.layoutInfo.editor;
        var options = context.options;
        var lang = options.langInfo;
        var data;
        var text;

        this.initialize = function () {
            var $container = options.dialogsInBody ? $(document.body) : $editor;

            var body = [
                '<div class="row">',
                    '<div class="col s12 center-align">' + lang.materializeComponents.card.selectedColors + '</div>',
                    '<div class="col s6"><div id="selected-back-color" class="selected-color"></div></div>',
                    '<div class="col s6"><div id="selected-fore-color" class="selected-color"></div></div>',
                '</div>',
                '<div class="card-color-wrapper">',
                    '<div class="row noMargins">',
                        '<div class="col s12">',
                            '<ul class="tabs">',
                                '<li class="tab col s6"><a class="active" href="#note-card-background-color">' + lang.color.background + '</a></li>',
                                '<li class="tab col s6"><a href="#note-card-foreground-color">' + lang.color.foreground + '</a></li>',
                            '</ul>',
                        '</div>',
                    '</div>',
                    '<div class="row noMargins">',
                        '<div id="note-card-background-color" class="col s12">',
                            '<div class="row noMargins">',
                                '<div class="col s6">',
                                    '<div class="color-name"></div>',
                                '</div>',
                            '</div>',
                            '<div class="note-holder" data-event="cardBackColor"></div>',
                        '</div>',
                        '<div id="note-card-foreground-color" class="col s12">',
                            '<div class="row noMargins">',
                                '<div class="col s6">',
                                    '<div class="color-name"></div>',
                                '</div>',
                            '</div>',
                            '<div class="note-holder" data-event="cardForeColor"/></div>',
                        '</div>',
                    '</div>',

                '<div class="row">',
                    '<div class="input-field col s12">',
                        '<input class="card-title" type="text" />',
                        '<label>' + lang.materializeComponents.card.cardTitle + '</label>',
                    '</div>',
                '</div>'
            ].join('');

            var footer = [
                '<a href="#!" class="modal-action modal-close waves-effect waves-light btn ">' + lang.shortcut.close + '</a>',
                '<button href="#" class="btn note-materialize-card-btn">' + lang.materializeComponents.card.insert + '</button>'
            ].join('');

            this.$dialog = ui.dialog({
                title: lang.materializeComponents.card.card,
                fade: options.dialogsFade,
                body: body,
                footer: footer,
                id: 'note-card-modal'
            }).render().appendTo($container);

            // create color palettes
            self.$dialog.find('.note-holder').each(function () {
                let $holder = $(this);
                let $tabs = self.$dialog.find('ul.tabs');

                $holder.append(ui.palette({
                    colors: options.colors,
                    colorNames: options.colorNames,
                    eventName: $holder.data('event'),
                }).render());

                // in this tabs initialization the indicator width will not be set since the plugin does not work
                // with hidden elements (display: none);
                // as a workaround the indicator width is forced to 50% in the css
                $tabs.tabs({
                    //swipeable: true
                });
            });

            // set default colors
            let $backColor = self.$dialog.find('#selected-back-color');
            let $foreColor = self.$dialog.find('#selected-fore-color');
            let defaultBackColor = options.materializeComponents.card.defaultBackColor;
            let defaultForeColor = options.materializeComponents.card.defaultForeColor;
            let defaultBackColorName, defaultBackColorValue, defaultForeColorName, defaultForeColorValue;
            let colorXY;

            // handle default colors type
            // backColor
            if (defaultBackColor.indexOf('#') === 0) {
                defaultBackColorValue = defaultBackColor;
                colorXY = ui.colors.lookupInMatrix(options.colors, defaultBackColor);
                defaultBackColorName = options.colorNames[colorXY.row][colorXY.column];
            }
            else {
                defaultBackColorName = defaultBackColor;
                colorXY = ui.colors.lookupInMatrix(options.colorNames, defaultBackColor);
                defaultBackColorValue = options.colors[colorXY.row][colorXY.column];
            }
            // foreColor
            if (defaultForeColor.indexOf('#') === 0) {
                defaultForeColorValue = defaultForeColor;
                colorXY = ui.colors.lookupInMatrix(options.colors, defaultForeColor);
                defaultForeColorName = options.colorNames[colorXY.row][colorXY.column];
            }
            else {
                defaultForeColorName = defaultForeColor;
                colorXY = ui.colors.lookupInMatrix(options.colorNames, defaultForeColor);
                defaultForeColorValue = options.colors[colorXY.row][colorXY.column];
            }

            $backColor.css({'background-color': defaultBackColorValue});
            $backColor.attr('data-color', defaultBackColorName);
            $foreColor.css({'background-color': defaultForeColorValue});
            $foreColor.attr('data-color', defaultForeColorName);

            this.$dialog.modal({
                ready: function() {
                    let $cardBtn = self.$dialog.find('.note-materialize-card-btn');
                    let $cardTitle = self.$dialog.find('.card-title');

                    self.$dialog.find('.note-color-btn').click(function() {
                        self.selectColor($(this).data('event'), $(this).data('value'));
                    });

                    $cardBtn.click(function (event) {
                        event.preventDefault();

                        data.resolve({
                            backColor: $backColor.attr('data-color'),
                            foreColor: ui.colors.backNameToText($foreColor.attr('data-color')),
                            title: $cardTitle.val()
                        });
                    });

                    //self.bindEnterKey($videoUrl, $videoBtn);
                },
                complete: function() {
                    var $videoUrl = self.$dialog.find('.note-video-url'),
                    $videoBtn = self.$dialog.find('.note-video-btn');

                    $videoUrl.off('input');
                    $videoBtn.off('click');

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

        this.selectColor = function(type, color) {
            let $selectedColor;

            switch (type) {
                case 'cardBackColor':
                $selectedColor = self.$dialog.find('#selected-back-color');
                break;

                case 'cardForeColor':
                $selectedColor = self.$dialog.find('#selected-fore-color');
                break;
            }

            let colorXY = ui.colors.lookupInMatrix(options.colors, color);
            let colorName = options.colorNames[colorXY.row][colorXY.column];

            $selectedColor.css({'background-color': color});
            $selectedColor.attr('data-color', colorName);
        };

        this.show = function () {
            text = context.invoke('editor.getSelectedText');

            context.invoke('editor.saveRange');
            ui.showDialog(self.$dialog);
            data = $.Deferred();

            data.then(function (card) {
                // [workaround] hide dialog before restore range for IE range focus
                ui.hideDialog(self.$dialog);
                context.invoke('editor.restoreRange');

                // build node
                context.invoke('editor.insertCard', card);
            }).fail(function () {
                context.invoke('editor.restoreRange');
            });
        };
    };

    return CardDialog;
});
