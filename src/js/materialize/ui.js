define([
    'materialnote/base/renderer'
], function (renderer) {
    var editor = renderer.create('<div class="note-editor note-frame panel panel-default"/>');
    var toolbar = renderer.create('<div class="note-toolbar-wrapper"><div class="note-toolbar panel-heading"></div></div>');
    var editingArea = renderer.create('<div class="note-editing-area"/>');
    var codable = renderer.create('<textarea class="note-codable"/>');
    var editable = renderer.create('<div class="note-editable panel-body" contentEditable="true"/>');
    var statusbar = renderer.create([
        '<div class="note-statusbar">',
        '  <div class="note-resizebar">',
        '    <div class="note-icon-bar"/>',
        '    <div class="note-icon-bar"/>',
        '    <div class="note-icon-bar"/>',
        '  </div>',
        '</div>'
    ].join(''));

    var airEditor = renderer.create('<div class="note-editor"/>');
    var airEditable = renderer.create('<div class="note-editable" contentEditable="true"/>');

    var buttonGroup = renderer.create('<div class="note-btn-group btn-group">');

    var dropdown = renderer.create('<div class="dropdown-content">', function ($node, options) {

        var markup = $.isArray(options.items) ? options.items.map(function (item) {
            var value = (typeof item === 'string') ? item : (item.value || '');
            var content = options.template ? options.template(item) : item;
            var option = (typeof item === 'object') ? item.option : undefined;

            var dataValue = 'data-value="' + value + '"';
            var dataOption = (option !== undefined) ? ' data-option="' + option + '"' : '';
            return '<li><a href="#" ' + (dataValue + dataOption) + '>' + content + '</a></li>';
        }).join('') : options.items;

        $node.html(markup);
    });

    var dropdownCheck = renderer.create('<div class="dropdown-content note-check">', function ($node, options) {
        var markup = $.isArray(options.items) ? options.items.map(function (item) {
            var value = (typeof item === 'string') ? item : (item.value || '');
            var content = options.template ? options.template(item) : item;
            return '<li><a href="#" data-value="' + value + '">' + icon(options.checkClassName) + ' ' + content + '</a></li>';
        }).join('') : options.items;
        $node.html(markup);
    });

    var palette = renderer.create('<div class="note-color-palette"/>', function ($node, options) {
        var contents = [];
        for (var row = 0, rowSize = options.colors.length; row < rowSize; row++) {
            var eventName = options.eventName;
            var colors = options.colors[row];
            var colorNames = options.colorNames[row];
            var buttons = [];
            for (var col = 0, colSize = colors.length; col < colSize; col++) {
                var color = colors[col];
                var colorName = colorNames[col];

                buttons.push([
                    '<button type="button" class="note-color-btn"',
                    'style="background-color:', color, '" ',
                    'data-event="', eventName, '" ',
                    'data-value="', color, '" ',
                    'data-description="', colorName, '" ',
                    'data-toggle="button" tabindex="-1"></button>'
                ].join(''));
            }
            contents.push('<div class="note-color-row">' + buttons.join('') + '</div>');
        }
        $node.html(contents.join(''));

        let $btns = $node.find('.note-color-btn').toArray();

        $btns.forEach(function(btn) {
            let $btn = $(btn);
            let hexColor = $btn.data('value');
            let colorDescription = $btn.data('description');

            $btn.tooltip({
                tooltip: hexColor,
                position: 'bottom',
                delay: 200
            });

            $btn.hover(function() {
                let $colorName = $(this).closest('.note-holder').prev('.row.noMargins').find('.color-name');

                $colorName.stop(true, false).fadeTo(150, 1.0, function() {
                    $colorName.html(colorDescription);
                });
            });

            $btn.mouseleave(function() {
                let $colorName = $(this).closest('.note-holder').prev('.row.noMargins').find('.color-name');

                $colorName.stop(true, false).fadeTo(150, 0);
            });
        });
    });

    var dialog = renderer.create('<div class="modal modal-fixed-footer" tabindex="-1"/>', function ($node, options) {
        if (options.fade) {
            $node.addClass('fade');
        }
        if (options.id) {
            $node.attr('id', options.id);
        }
        $node.html([
            '  <div class="modal-content">',
            (options.title ?
                '   <div class="row"><div class="col s12">' +
                '      <h4 class="modal-title">' + options.title + '</h4>' +
                '</div></div>' : ''
            ),
            options.body,
            '</div>',
            (options.footer ?
                '<div class="modal-footer">' +
                options.footer +
                '</div>' : ''
            )
        ].join(''));
    });

    var popover = renderer.create([
        '<div class="note-popover popover in">',
        '  <div class="arrow"/>',
        '  <div class="popover-content note-children-container"/>',
        '</div>'
    ].join(''), function ($node, options) {
        var direction = typeof options.direction !== 'undefined' ? options.direction : 'bottom';

        $node.addClass(direction);

        if (options.hideArrow) {
            $node.find('.arrow').hide();
        }
    });

    var icon = function (iconName, customClasses, tagName) {
        tagName = tagName || 'i';

        if (!customClasses) {
            customClasses = '';
        }
        return '<' + tagName + ' class="material-icons ' + customClasses + '">' + iconName + '</i>';
    };

    var ui = {
        editor: editor,
        toolbar: toolbar,
        editingArea: editingArea,
        codable: codable,
        editable: editable,
        statusbar: statusbar,
        airEditor: airEditor,
        airEditable: airEditable,
        buttonGroup: buttonGroup,
        dropdown: dropdown,
        dropdownCheck: dropdownCheck,
        palette: palette,
        dialog: dialog,
        popover: popover,
        icon: icon,
        options: {},

        colors: {
            backNameToText: function(colorName) {
                let colorTextName = [];

                colorName.split(' ').forEach(function(element, index) {
                    if (index === 0) {
                        element = element + '-text';
                    }
                    else {
                        element = 'text-' + element;
                    }

                    colorTextName[index] = element;
                });

                return colorTextName.join(' ');
            },

            lookupInMatrix: function(matrix, color) {
                let i, j, found;

                for (i = 0; i < matrix.length; i++) {
                    found = false;

                    for (j = 0; j < matrix[i].length; j++) {
                        if (matrix[i][j] === color) {
                            found = true;
                            break;
                        }
                    }

                    if (found) {
                        break;
                    }
                }
                if (found) {
                    return {row: i, column: j};
                }
                return null;
            }
        },

        button: function ($node, options) {
            return renderer.create('<div class="note-btn btn waves-effect waves-light" tabindex="-1">', function ($node, options) {
                if (options && options.tooltip && self.options.tooltip) {
                    $node.attr({
                    }).tooltip({
                        tooltip: options.tooltip,
                        position: 'bottom',
                        delay: 200
                    });
                }
            })($node, options);
        },

        toggleBtn: function ($btn, isEnable) {
            $btn.toggleClass('disabled', !isEnable);
            $btn.attr('disabled', !isEnable);
        },

        toggleBtnActive: function ($btn, isActive) {
            $btn.toggleClass('active', isActive);
        },

        onDialogShown: function ($dialog, handler) {
            $dialog.one('shown.bs.modal', handler);
        },

        onDialogHidden: function ($dialog, handler) {
            $dialog.one('hidden.bs.modal', handler);
        },

        showDialog: function ($dialog) {
            $dialog.modal('open');
        },

        hideDialog: function ($dialog) {
            $dialog.modal('close');
        },

        createLayout: function ($note, options) {
            self.options = options;
            var $editor = (options.airMode ? ui.airEditor([
                ui.editingArea([
                    ui.airEditable()
                ])
            ]) : ui.editor([
                ui.toolbar(),
                ui.editingArea([
                    ui.codable(),
                    ui.editable()
                ]),
                ui.statusbar()
            ])).render();

            $editor.insertAfter($note);

            return {
                note: $note,
                editor: $editor,
                toolbar: $editor.find('.note-toolbar'),
                editingArea: $editor.find('.note-editing-area'),
                editable: $editor.find('.note-editable'),
                codable: $editor.find('.note-codable'),
                statusbar: $editor.find('.note-statusbar')
            };
        },

        removeLayout: function ($note, layoutInfo) {
            $note.html(layoutInfo.editable.html());
            layoutInfo.editor.remove();
            $note.show();
        }
    };

    return ui;
});
