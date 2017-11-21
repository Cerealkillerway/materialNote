define([
    'jquery',
    'materialnote/base/core/func',
    'materialnote/base/core/list',
    'materialnote/base/core/agent'
], function ($, func, list, agent) {
    var Buttons = function (context) {
        var self = this;
        var ui = $.materialnote.ui;

        var $toolbar = context.layoutInfo.toolbar;
        var options = context.options;
        var lang = options.langInfo;

        var invertedKeyMap = func.invertObject(options.keyMap[agent.isMac ? 'mac' : 'pc']);

        var representShortcut = this.representShortcut = function (editorMethod) {
            var shortcut = invertedKeyMap[editorMethod];
            if (!options.shortcuts || !shortcut) {
                return '';
            }

            if (agent.isMac) {
                shortcut = shortcut.replace('CMD', '⌘').replace('SHIFT', '⇧');
            }

            shortcut = shortcut.replace('BACKSLASH', '\\')
            .replace('SLASH', '/')
            .replace('LEFTBRACKET', '[')
            .replace('RIGHTBRACKET', ']');

            return ' (' + shortcut + ')';
        };

        this.initialize = function () {
            this.addToolbarButtons();
            this.addImagePopoverButtons();
            this.addLinkPopoverButtons();
            this.addTablePopoverButtons();
            this.fontInstalledMap = {};
        };

        this.destroy = function () {
            delete this.fontInstalledMap;
        };

        this.isFontInstalled = function (name) {
            if (!self.fontInstalledMap.hasOwnProperty(name)) {
                self.fontInstalledMap[name] = agent.isFontInstalled(name) ||
                list.contains(options.fontNamesIgnoreCheck, name);
            }

            return self.fontInstalledMap[name];
        };

        this.addToolbarButtons = function () {
            context.memo('button.style', function () {
                return ui.buttonGroup([
                    ui.button({
                        className: 'dropdown-button',
                        contents: ui.icon('arrow_drop_down', 'left') + ui.icon('border_color'),
                        tooltip: lang.style.style,
                        data: {
                            activates: 'note-styles-' + options.posIndex
                        }
                    }),
                    ui.dropdown({
                        id: 'note-styles-' + options.posIndex,
                        items: context.options.styleTags,
                        template: function (item) {

                            if (typeof item === 'string') {
                                item = { tag: item, title: (lang.style.hasOwnProperty(item) ? lang.style[item] : item) };
                            }

                            var tag = item.tag;
                            var title = item.title;
                            var style = item.style ? ' style="' + item.style + '" ' : '';
                            var className = item.className ? ' class="' + item.className + '"' : '';

                            return '<' + tag + style + className + '>' + title + '</' + tag +  '>';
                        },
                        click: context.createInvokeHandler('editor.formatBlock')
                    })
                ]).render();
            });

            context.memo('button.bold', function () {
                return ui.button({
                    className: 'note-btn-bold',
                    contents: ui.icon('format_bold'),
                    tooltip: lang.font.bold + representShortcut('bold'),
                    click: context.createInvokeHandlerAndUpdateState('editor.bold')
                }).render();
            });

            context.memo('button.italic', function () {
                return ui.button({
                    className: 'note-btn-italic',
                    contents: ui.icon('format_italic'),
                    tooltip: lang.font.italic + representShortcut('italic'),
                    click: context.createInvokeHandlerAndUpdateState('editor.italic')
                }).render();
            });

            context.memo('button.underline', function () {
                return ui.button({
                    className: 'note-btn-underline',
                    contents: ui.icon('format_underlined'),
                    tooltip: lang.font.underline + representShortcut('underline'),
                    click: context.createInvokeHandlerAndUpdateState('editor.underline')
                }).render();
            });

            context.memo('button.clear', function () {
                return ui.button({
                    contents: ui.icon('clear'),
                    tooltip: lang.font.clear + representShortcut('removeFormat'),
                    click: context.createInvokeHandler('editor.removeFormat')
                }).render();
            });

            context.memo('button.strikethrough', function () {
                return ui.button({
                    className: 'note-btn-strikethrough',
                    contents: ui.icon('strikethrough_s'),
                    tooltip: lang.font.strikethrough + representShortcut('strikethrough'),
                    click: context.createInvokeHandlerAndUpdateState('editor.strikethrough')
                }).render();
            });

            context.memo('button.superscript', function () {
                return ui.button({
                    className: 'note-btn-superscript',
                    contents: ui.icon('call_made'),
                    tooltip: lang.font.superscript,
                    click: context.createInvokeHandlerAndUpdateState('editor.superscript')
                }).render();
            });

            context.memo('button.subscript', function () {
                return ui.button({
                    className: 'note-btn-subscript',
                    contents: ui.icon('call_received'),
                    tooltip: lang.font.subscript,
                    click: context.createInvokeHandlerAndUpdateState('editor.subscript')
                }).render();
            });

            context.memo('button.fontname', function () {
                return ui.buttonGroup([
                    ui.button({
                        className: 'dropdown-button',
                        contents: ui.icon('arrow_drop_down', 'left') + '<span class="note-current-fontname"/>',
                        tooltip: lang.font.name,
                        data: {
                            activates: 'note-fonts-' + options.posIndex
                        }
                    }),
                    ui.dropdownCheck({
                        id: 'note-fonts-' + options.posIndex,
                        className: 'dropdown-fontname',
                        checkClassName: 'done',
                        items: options.fontNames.filter(self.isFontInstalled),
                        template: function (item) {
                            return '<span style="font-family:' + item + '">' + item + '</span>';
                        },
                        click: context.createInvokeHandlerAndUpdateState('editor.fontName')
                    })
                ]).render();
            });

            context.memo('button.fontsize', function () {
                return ui.buttonGroup([
                    ui.button({
                        className: 'dropdown-button',
                        contents: ui.icon('arrow_drop_down', 'left') + '<span class="note-current-fontsize"/>',
                        tooltip: lang.font.size,
                        data: {
                            activates: 'note-sizes-' + options.posIndex
                        }
                    }),
                    ui.dropdownCheck({
                        id: 'note-sizes-' + options.posIndex,
                        className: 'dropdown-fontsize',
                        checkClassName: 'done',
                        items: options.fontSizes,
                        click: context.createInvokeHandler('editor.fontSize')
                    })
                ]).render();
            });

            context.memo('button.color', function () {
                return ui.buttonGroup({
                    className: 'note-color',
                    children: [
                        ui.button({
                            className: 'note-current-color-button',
                            //contents: ui.icon('format_color_text'),
                            contents: '<div class="note-recent-color">A</div><div class="note-recent-color-back"></div>',
                            tooltip: lang.color.recent,
                            click: function (e) {
                                var $button = $(e.currentTarget);
                                context.invoke('editor.color', {
                                    backColor: $button.attr('data-backColor'),
                                    foreColor: $button.attr('data-foreColor')
                                });
                            },
                            callback: function ($button) {
                                let $recentColor = $button.find('.note-recent-color');
                                let $recentColorBack = $button.find('.note-recent-color-back');
                                let defaultColor = options.defaultColors.text;
                                let defaultBackColor = options.defaultColors.background;

                                $button.attr('data-backColor', defaultBackColor);
                                $button.attr('data-foreColor', defaultColor);
                                $recentColorBack.css('background-color', defaultBackColor);
                                $recentColor.css('color', defaultColor);
                            }
                        }),
                        ui.button({
                            className: 'dropdown-button',
                            contents: ui.icon('arrow_drop_down'),
                            tooltip: lang.color.more,
                            data: {
                                activates: 'note-colors-' + options.posIndex
                            },
                            click: function() {
                                let $dropdown = $(this).next('.dropdown-content');
                                let $tabs = $dropdown.find('ul.tabs');

                                // in this tabs initialization the indicator width will not be set since the plugin does not work
                                // with hidden elements (display: none);
                                // as a workaround the indicator width is forced to 50% in the css
                                $tabs.tabs({
                                    //swipeable: true
                                });
                            }
                        }),
                        ui.dropdown({
                            id: 'note-colors-' + options.posIndex,
                            items: [
                                '<div class="row noMargins">',
                                    '<div class="col s12">',
                                        '<ul class="tabs">',
                                            '<li class="tab col s6"><a class="active" href="#note-background-color-' + options.posIndex + '">' + lang.color.background + '</a></li>',
                                            '<li class="tab col s6"><a href="#note-foreground-color-' + options.posIndex + '">' + lang.color.foreground + '</a></li>',
                                        '</ul>',
                                    '</div>',
                                '</div>',
                                '<div class="row noMargins">',
                                    '<div id="note-background-color-' + options.posIndex + '" class="col s12">',
                                        '<div class="row noMargins">',
                                            '<div class="col s6">',
                                                '<button type="button" class="note-color-reset btn" data-event="backColor" data-value="inherit">' + lang.color.transparent + '</button>',
                                            '</div>',
                                            '<div class="col s6">',
                                                '<span class="color-name"></span>',
                                            '</div>',
                                        '</div>',
                                        '<div class="note-holder" data-event="backColor"></div>',
                                    '</div>',
                                    '<div id="note-foreground-color-' + options.posIndex + '" class="col s12">',
                                        '<div class="row noMargins">',
                                            '<div class="col s6">',
                                                '<button type="button" class="note-color-reset btn" data-event="removeFormat" data-value="foreColor">' + lang.color.resetToDefault + '</button>',
                                            '</div>',
                                            '<div class="col s6">',
                                                '<span class="color-name"></span>',
                                            '</div>',
                                        '</div>',
                                        '<div class="note-holder" data-event="foreColor"/></div>',
                                    '</div>',
                                '</div>'
                            ].join(''),
                            callback: function ($dropdown) {
                                $dropdown.find('.note-holder').each(function () {
                                    var $holder = $(this);

                                    $holder.append(ui.palette({
                                        colors: options.colors,
                                        colorNames: options.colorNames,
                                        eventName: $holder.data('event'),
                                    }).render());
                                });
                            },
                            click: function (event) {
                                var $button = $(event.target);
                                var eventName = $button.data('event');
                                var value = $button.data('value');

                                // prevent closing dropdown when clicking other than note-color-btn or note-color-reset
                                if (!$button.hasClass('note-color-btn') && !$button.hasClass('note-color-reset')) {
                                    return false;
                                }

                                if (eventName && value) {
                                    let key = eventName === 'backColor' ? 'background-color' : 'color';
                                    let $currentButton = $button.closest('.note-color').find('.note-current-color-button');

                                    if (key === 'background-color') {
                                        let $recentColorBack = $button.closest('.note-color').find('.note-recent-color-back');

                                        $recentColorBack.css('background-color', value);
                                    }
                                    else {
                                        let $recentColor = $button.closest('.note-color').find('.note-recent-color');

                                        $recentColor.css('color', value);
                                    }
                                    $currentButton.attr('data-' + eventName, value);
                                    context.invoke('editor.' + eventName, value);
                                }
                            }
                        })
                    ]
                }).render();
            });

            context.memo('button.ul',  function () {
                return ui.button({
                    contents: ui.icon('format_list_bulleted'),
                    tooltip: lang.lists.unordered + representShortcut('insertUnorderedList'),
                    click: context.createInvokeHandler('editor.insertUnorderedList')
                }).render();
            });

            context.memo('button.ol', function () {
                return ui.button({
                    contents: ui.icon('format_list_numbered'),
                    tooltip: lang.lists.ordered + representShortcut('insertOrderedList'),
                    click:  context.createInvokeHandler('editor.insertOrderedList')
                }).render();
            });

            var justifyLeft = ui.button({
                contents: ui.icon('format_align_left'),
                tooltip: lang.paragraph.left + representShortcut('justifyLeft'),
                click: context.createInvokeHandler('editor.justifyLeft')
            });

            var justifyCenter = ui.button({
                contents: ui.icon('format_align_center'),
                tooltip: lang.paragraph.center + representShortcut('justifyCenter'),
                click: context.createInvokeHandler('editor.justifyCenter')
            });

            var justifyRight = ui.button({
                contents: ui.icon('format_align_right'),
                tooltip: lang.paragraph.right + representShortcut('justifyRight'),
                click: context.createInvokeHandler('editor.justifyRight')
            });

            var justifyFull = ui.button({
                contents: ui.icon('format_align_justify'),
                tooltip: lang.paragraph.justify + representShortcut('justifyFull'),
                click: context.createInvokeHandler('editor.justifyFull')
            });

            var outdent = ui.button({
                contents: ui.icon('format_indent_decrease'),
                tooltip: lang.paragraph.outdent + representShortcut('outdent'),
                click: context.createInvokeHandler('editor.outdent')
            });

            var indent = ui.button({
                contents: ui.icon('format_indent_increase'),
                tooltip: lang.paragraph.indent + representShortcut('indent'),
                click: context.createInvokeHandler('editor.indent')
            });

            context.memo('button.paragraphAlignLeft', function() {
                return justifyLeft.render();
            });
            context.memo('button.paragraphAlignRight', function() {
                return justifyRight.render();
            });
            context.memo('button.paragraphAlignCenter', function() {
                return justifyCenter.render();
            });
            context.memo('button.paragraphAlignFull', function() {
                return justifyFull.render();
            });
            context.memo('button.paragraphOutdent', function() {
                return outdent.render();
            });
            context.memo('button.paragraphIndent', function() {
                return indent.render();
            });

            context.memo('button.justifyLeft', func.invoke(justifyLeft, 'render'));
            context.memo('button.justifyCenter', func.invoke(justifyCenter, 'render'));
            context.memo('button.justifyRight', func.invoke(justifyRight, 'render'));
            context.memo('button.justifyFull', func.invoke(justifyFull, 'render'));
            context.memo('button.outdent', func.invoke(outdent, 'render'));
            context.memo('button.indent', func.invoke(indent, 'render'));

            context.memo('button.paragraph', function () {
                return ui.buttonGroup([
                    ui.button({
                        className: 'dropdown-button',
                        contents: ui.icon('arrow_drop_down', 'left') + ui.icon('format_textdirection_l_to_r'),
                        tooltip: lang.paragraph.paragraph,
                        data: {
                            activates: 'note-paragraph-' + options.posIndex
                        }
                    }),
                    ui.dropdown([
                        ui.buttonGroup({
                            className: 'note-align',
                            children: [justifyLeft, justifyCenter, justifyRight, justifyFull]
                        }),
                        ui.buttonGroup({
                            className: 'note-list',
                            children: [outdent, indent]
                        })
                    ], {id: 'note-paragraph-' + options.posIndex})
                ]).render();
            });

            context.memo('button.height', function () {
                return ui.buttonGroup([
                    ui.button({
                        className: 'dropdown-button',
                        contents: ui.icon('arrow_drop_down', 'left') + ' ' + ui.icon('format_size'),
                        tooltip: lang.font.height,
                        data: {
                            activates: 'note-height-' + options.posIndex
                        }
                    }),
                    ui.dropdownCheck({
                        id: 'note-height-' + options.posIndex,
                        items: options.lineHeights,
                        checkClassName: 'done',
                        className: 'dropdown-line-height',
                        click: context.createInvokeHandler('editor.lineHeight')
                    })
                ]).render();
            });

            context.memo('button.table', function () {
                return ui.buttonGroup([
                    ui.button({
                        className: 'dropdown-button',
                        contents: ui.icon('arrow_drop_down', 'left') + ' ' + ui.icon('border_all'),
                        tooltip: lang.table.table,
                        data: {
                            activates: 'note-table-' + options.posIndex
                        }
                    }),
                    ui.dropdown({
                        id: 'note-table-' + options.posIndex,
                        className: 'note-table',
                        items: [
                            '<div class="row beforePicker">',
                                '<div class="col s12 m6">',
                                    '<input type="checkbox" id="note-table-bordered" class="note-table-option" />',
                                    '<label class="note-table-option" for="note-table-bordered">' + lang.table.bordered + '</label>',
                                '</div>',
                                '<div class="col s12 m6">',
                                    '<input type="checkbox" id="note-table-striped" class="note-table-option" checked="checked" />',
                                    '<label class="note-table-option" for="note-table-striped">' + lang.table.striped + '</label>',
                                '</div>',
                                '<div class="col s12 m6">',
                                    '<input type="checkbox" id="note-table-highlight" class="note-table-option" checked="checked" />',
                                    '<label class="note-table-option" for="note-table-highlight">' + lang.table.highlight + '</label>',
                                '</div>',
                                '<div class="col s12 m6">',
                                    '<input type="checkbox" id="note-table-responsive" class="note-table-option" checked="checked" />',
                                    '<label class="note-table-option" for="note-table-responsive">' + lang.table.responsive + '</label>',
                                '</div>',
                                '<div class="col s12 m6">',
                                    '<input type="checkbox" id="note-table-centered" class="note-table-option" />',
                                    '<label class="note-table-option" for="note-table-centered">' + lang.table.centered + '</label>',
                                '</div>',
                            '</div>',
                            '<div class="row">',
                                '<div class="col s12">',
                                    '<div class="note-dimension-picker">',
                                        '<div class="note-dimension-picker-mousecatcher" data-event="insertTable" data-value="1x1"/>',
                                        '<div class="note-dimension-picker-highlighted"/>',
                                        '<div class="note-dimension-picker-unhighlighted"/>',
                                    '</div>',
                                '</div>',
                            '</div>',
                            '<div class="row">',
                                '<div class="col s12">',
                                    '<div class="note-dimension-display">1 x 1</div>',
                                '</div>',
                            '</div>'
                        ].join(''),
                        click: function (event) {
                            var $button = $(event.target);

                            // prevent closing dropdown when clicking table option checkboxes
                            if ($button.hasClass('note-table-option')) {
                                event.stopPropagation();
                            }
                        }
                    })
                ], {
                    callback: function ($node) {
                        var $catcher = $node.find('.note-dimension-picker-mousecatcher');

                        $catcher.css({
                            width: options.insertTableMaxSize.col * 26 + 'px',
                            height: options.insertTableMaxSize.row * 26 + 'px'
                        }).mousedown(context.createInvokeHandler('editor.insertTable'))
                        .on('mousemove', self.tableMoveHandler);
                    }
                }).render();
            });

            context.memo('button.link', function () {
                return ui.button({
                    contents: ui.icon('insert_link'),
                    tooltip: lang.link.link + representShortcut('linkDialog.show'),
                    click: context.createInvokeHandler('linkDialog.show')
                }).render();
            });

            context.memo('button.picture', function () {
                return ui.button({
                    contents: ui.icon('image'),
                    tooltip: lang.image.image,
                    click: context.createInvokeHandler('imageDialog.show')
                }).render();
            });

            context.memo('button.video', function () {
                return ui.button({
                    contents: ui.icon('videocam'),
                    tooltip: lang.video.video,
                    click: context.createInvokeHandler('videoDialog.show')
                }).render();
            });

            context.memo('button.hr', function () {
                return ui.button({
                    contents: ui.icon('remove'),
                    tooltip: lang.hr.insert + representShortcut('insertHorizontalRule'),
                    click: context.createInvokeHandler('editor.insertHorizontalRule')
                }).render();
            });


            // materialize's components
            // cards
            context.memo('button.materializeCard', function () {
                return ui.button({
                    contents: ui.icon('view_agenda'),
                    tooltip: lang.materializeComponents.card.card,
                    click: context.createInvokeHandler('cardDialog.show')
                }).render();
            });


            context.memo('button.fullscreen', function () {
                return ui.button({
                    className: 'btn-fullscreen',
                    contents: ui.icon('settings_overscan'),
                    tooltip: lang.options.fullscreen,
                    click: context.createInvokeHandler('fullscreen.toggle')
                }).render();
            });

            context.memo('button.codeview', function () {
                return ui.button({
                    className: 'btn-codeview',
                    contents: ui.icon('code'),
                    tooltip: lang.options.codeview,
                    click: context.createInvokeHandler('codeview.toggle')
                }).render();
            });

            context.memo('button.redo', function () {
                return ui.button({
                    contents: ui.icon('redo'),
                    tooltip: lang.history.redo + representShortcut('redo'),
                    click: context.createInvokeHandler('editor.redo')
                }).render();
            });

            context.memo('button.undo', function () {
                return ui.button({
                    contents: ui.icon('undo'),
                    tooltip: lang.history.undo + representShortcut('undo'),
                    click: context.createInvokeHandler('editor.undo')
                }).render();
            });

            context.memo('button.help', function () {
                return ui.button({
                    contents: ui.icon('help'),
                    tooltip: lang.options.help,
                    click: context.createInvokeHandler('helpDialog.show')
                }).render();
            });
        };

        /**
        * image : [
        *   ['imagesize', ['imageSize100', 'imageSize50', 'imageSize25']],
        *   ['float', ['floatLeft', 'floatRight', 'floatNone' ]],
        *   ['remove', ['removeMedia']]
        * ],
        */
        this.addImagePopoverButtons = function () {
            // Image Size Buttons
            context.memo('button.imageSize100', function () {
                return ui.button({
                    contents: '<span class="note-fontsize-10">100%</span>',
                    id: 'note-image-size-100',
                    tooltip: lang.image.resizeFull,
                    click: context.createInvokeHandler('editor.resize', '1')
                }).render();
            });
            context.memo('button.imageSize50', function () {
                return  ui.button({
                    contents: '<span class="note-fontsize-10">50%</span>',
                    id: 'note-image-size-50',
                    tooltip: lang.image.resizeHalf,
                    click: context.createInvokeHandler('editor.resize', '0.5')
                }).render();
            });
            context.memo('button.imageSize25', function () {
                return ui.button({
                    contents: '<span class="note-fontsize-10">25%</span>',
                    id: 'note-image-size-25',
                    tooltip: lang.image.resizeQuarter,
                    click: context.createInvokeHandler('editor.resize', '0.25')
                }).render();
            });

            // Float Buttons
            context.memo('button.floatLeft', function () {
                return ui.button({
                    contents: ui.icon('format_align_left'),
                    id: 'note-image-float-left',
                    tooltip: lang.image.floatLeft,
                    click: context.createInvokeHandler('editor.floatMe', 'left')
                }).render();
            });

            context.memo('button.floatRight', function () {
                return ui.button({
                    contents: ui.icon('format_align_right'),
                    id: 'note-image-float-right',
                    tooltip: lang.image.floatRight,
                    click: context.createInvokeHandler('editor.floatMe', 'right')
                }).render();
            });

            context.memo('button.floatNone', function () {
                return ui.button({
                    contents: ui.icon('format_align_justify'),
                    id: 'note-image-float-none',
                    tooltip: lang.image.floatNone,
                    click: context.createInvokeHandler('editor.floatMe', 'none')
                }).render();
            });

            // responsive button
            context.memo('button.responsive', function() {
                return ui.button({
                    contents: ui.icon('photo_size_select_large'),
                    id: 'note-image-responsive',
                    tooltip: lang.image.responsive,
                    click: context.createInvokeHandler('editor.responsivize')
                }).render();
            });

            // Remove Buttons
            context.memo('button.removeMedia', function () {
                return ui.button({
                    contents: ui.icon('delete_forever'),
                    tooltip: lang.image.remove,
                    click: context.createInvokeHandler('editor.removeMedia')
                }).render();
            });
        };

        this.addLinkPopoverButtons = function () {
            context.memo('button.linkDialogShow', function () {
                return ui.button({
                    contents: ui.icon('link'),
                    tooltip: lang.link.edit,
                    click: context.createInvokeHandler('linkDialog.show')
                }).render();
            });

            // button open in new window
            context.memo('button.openLinkNewWindow', function () {
                return ui.button({
                    contents: ui.icon('open_in_new'),
                    id: 'note-link-open-new-window',
                    tooltip: lang.link.openInNewWindow,
                    click: context.createInvokeHandler('editor.toggleOpenInNewWindow')
                }).render();
            });

            context.memo('button.unlink', function () {
                return ui.button({
                    contents: ui.icon('clear'),
                    tooltip: lang.link.unlink,
                    click: context.createInvokeHandler('editor.unlink')
                }).render();
            });
        };

        /**
        * table : [
        *  ['add', ['addRowDown', 'addRowUp', 'addColLeft', 'addColRight']],
        *  ['delete', ['deleteRow', 'deleteCol', 'deleteTable']]
        * ],
        */
        this.addTablePopoverButtons = function () {
            context.memo('button.addRowUp', function () {
                return ui.button({
                    className: 'btn-md',
                    contents: ui.icon('expand_less'),
                    tooltip: lang.table.addRowAbove,
                    click: context.createInvokeHandler('editor.addRow', 'top')
                }).render();
            });
            context.memo('button.addRowDown', function () {
                return ui.button({
                    className: 'btn-md',
                    contents: ui.icon('expand_more'),
                    tooltip: lang.table.addRowBelow,
                    click: context.createInvokeHandler('editor.addRow', 'bottom')
                }).render();
            });
            context.memo('button.addColLeft', function () {
                return ui.button({
                    className: 'btn-md',
                    contents: ui.icon('chevron_left'),
                    tooltip: lang.table.addColLeft,
                    click: context.createInvokeHandler('editor.addCol', 'left')
                }).render();
            });
            context.memo('button.addColRight', function () {
                return ui.button({
                    className: 'btn-md',
                    contents: ui.icon('chevron_right'),
                    tooltip: lang.table.addColRight,
                    click: context.createInvokeHandler('editor.addCol', 'right')
                }).render();
            });
            context.memo('button.deleteRow', function () {
                return ui.button({
                    className: 'btn-md',
                    contents: ui.icon('border_horizontal'),
                    tooltip: lang.table.delRow,
                    click: context.createInvokeHandler('editor.deleteRow')
                }).render();
            });
            context.memo('button.deleteCol', function () {
                return ui.button({
                    className: 'btn-md',
                    contents: ui.icon('border_vertical'),
                    tooltip: lang.table.delCol,
                    click: context.createInvokeHandler('editor.deleteCol')
                }).render();
            });
            context.memo('button.deleteTable', function () {
                return ui.button({
                    className: 'btn-md',
                    contents: ui.icon('clear'),
                    tooltip: lang.table.delTable,
                    click: context.createInvokeHandler('editor.deleteTable')
                }).render();
            });

            // materialize's table options
            context.memo('button.borderedTable', function () {
                return ui.button({
                    className: 'btn-md',
                    id: 'note-table-bordered',
                    contents: ui.icon('border_outer'),
                    tooltip: lang.table.bordered,
                    click: context.createInvokeHandler('editor.updateTable', 'bordered')
                }).render();
            });
            context.memo('button.stripedTable', function () {
                return ui.button({
                    className: 'btn-md',
                    id: 'note-table-striped',
                    contents: ui.icon('view_headline'),
                    tooltip: lang.table.striped,
                    click: context.createInvokeHandler('editor.updateTable', 'striped')
                }).render();
            });
            context.memo('button.highlightedTable', function () {
                return ui.button({
                    className: 'btn-md',
                    id: 'note-table-highlighted',
                    contents: ui.icon('highlight'),
                    tooltip: lang.table.highlight,
                    click: context.createInvokeHandler('editor.updateTable', 'highlight')
                }).render();
            });
            context.memo('button.responsiveTable', function () {
                return ui.button({
                    className: 'btn-md',
                    id: 'note-table-responsive',
                    contents: ui.icon('crop_free'),
                    tooltip: lang.table.responsive,
                    click: context.createInvokeHandler('editor.updateTable', 'responsive-table')
                }).render();
            });
            context.memo('button.centeredTable', function () {
                return ui.button({
                    className: 'btn-md',
                    id: 'note-table-centered',
                    contents: ui.icon('format_align_center'),
                    tooltip: lang.table.centered,
                    click: context.createInvokeHandler('editor.updateTable', 'centered')
                }).render();
            });
        };

        this.build = function ($container, groups) {
            for (var groupIdx = 0, groupLen = groups.length; groupIdx < groupLen; groupIdx++) {
                var group = groups[groupIdx];
                var groupName = group[0];
                var buttons = group[1];

                var $group = ui.buttonGroup({
                    className: 'note-' + groupName
                }).render();

                for (var idx = 0, len = buttons.length; idx < len; idx++) {
                    var button = context.memo('button.' + buttons[idx]);
                    if (button) {
                        $group.append(typeof button === 'function' ? button(context) : button);
                    }
                }
                $group.appendTo($container);
            }
        };

        this.updateCurrentStyle = function () {
            var styleInfo = context.invoke('editor.currentStyle');
            this.updateBtnStates({
                '.note-btn-bold': function () {
                    return styleInfo['font-bold'] === 'bold';
                },
                '.note-btn-italic': function () {
                    return styleInfo['font-italic'] === 'italic';
                },
                '.note-btn-underline': function () {
                    return styleInfo['font-underline'] === 'underline';
                },
                '.note-btn-subscript': function () {
                    return styleInfo['font-subscript'] === 'subscript';
                },
                '.note-btn-superscript': function () {
                    return styleInfo['font-superscript'] === 'superscript';
                },
                '.note-btn-strikethrough': function () {
                    return styleInfo['font-strikethrough'] === 'strikethrough';
                }
            });

            if (styleInfo['font-family']) {
                var fontNames = styleInfo['font-family'].split(',').map(function (name) {
                    return name.replace(/[\'\"]/g, '')
                    .replace(/\s+$/, '')
                    .replace(/^\s+/, '');
                });
                var fontName = list.find(fontNames, self.isFontInstalled);

                $toolbar.find('.dropdown-fontname li a').each(function () {
                    // always compare string to avoid creating another func.
                    var isChecked = ($(this).data('value') + '') === (fontName + '');

                    this.className = isChecked ? 'checked' : '';
                });
                $toolbar.find('.note-current-fontname').text(fontName);
            }

            if (styleInfo['font-size']) {
                var fontSize = styleInfo['font-size'];
                $toolbar.find('.dropdown-fontsize li a').each(function () {
                    // always compare with string to avoid creating another func.
                    var isChecked = ($(this).data('value') + '') === (fontSize + '');
                    this.className = isChecked ? 'checked' : '';
                });
                $toolbar.find('.note-current-fontsize').text(fontSize);
            }

            if (styleInfo['line-height']) {
                var lineHeight = styleInfo['line-height'];
                $toolbar.find('.dropdown-line-height li a').each(function () {
                    // always compare with string to avoid creating another func.
                    var isChecked = ($(this).data('value') + '') === (lineHeight + '');
                    this.className = isChecked ? 'checked' : '';
                });
            }
        };

        this.updateBtnStates = function (infos) {
            $.each(infos, function (selector, pred) {
                ui.toggleBtnActive($toolbar.find(selector), pred());
            });
        };

        this.tableMoveHandler = function (event) {
            var $picker = $(event.target.parentNode); // target is mousecatcher
            var $dimensionDisplay = $picker.closest('.row').next('.row').find('.note-dimension-display');
            var $catcher = $picker.find('.note-dimension-picker-mousecatcher');
            var $highlighted = $picker.find('.note-dimension-picker-highlighted');
            var $unhighlighted = $picker.find('.note-dimension-picker-unhighlighted');

            var posOffset;
            // HTML5 with jQuery - e.offsetX is undefined in Firefox
            if (event.offsetX === undefined) {
                var posCatcher = $(event.target).offset();
                posOffset = {
                    x: event.pageX - posCatcher.left,
                    y: event.pageY - posCatcher.top
                };
            } else {
                posOffset = {
                    x: event.offsetX,
                    y: event.offsetY
                };
            }

            var dim = {
                c: Math.ceil(posOffset.x / 26) || 1,
                r: Math.ceil(posOffset.y / 26) || 1
            };

            $highlighted.css({ width: dim.c * 26 + 'px', height: dim.r * 26 + 'px' });
            $catcher.data('value', dim.c + 'x' + dim.r);

            if (3 < dim.r && dim.r < options.insertTableMaxSize.row) {
                $unhighlighted.css({ height: (dim.r + 1) * 26 + 'px'});
            }

            $dimensionDisplay.html(dim.c + ' x ' + dim.r);
        };
    };

    return Buttons;
});
