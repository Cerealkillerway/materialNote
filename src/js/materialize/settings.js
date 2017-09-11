define([
    'materialnote/materialize/ui',
    'materialnote/base/core/dom',
    'materialnote/base/materialnote-en-US',
    'materialnote/base/module/Editor',
    'materialnote/base/module/Clipboard',
    'materialnote/base/module/Dropzone',
    'materialnote/base/module/Codeview',
    'materialnote/base/module/Statusbar',
    'materialnote/base/module/Fullscreen',
    'materialnote/base/module/Handle',
    'materialnote/base/module/AutoLink',
    'materialnote/base/module/AutoSync',
    'materialnote/base/module/Placeholder',
    'materialnote/materialize/module/Buttons',
    'materialnote/materialize/module/Toolbar',
    'materialnote/materialize/module/LinkDialog',
    'materialnote/materialize/module/LinkPopover',
    'materialnote/materialize/module/ImageDialog',
    'materialnote/materialize/module/ImagePopover',
    'materialnote/materialize/module/TablePopover',
    'materialnote/materialize/module/VideoDialog',
    'materialnote/materialize/module/HelpDialog',
    'materialnote/materialize/module/AirPopover',
    'materialnote/materialize/module/HintPopover',
    'materialnote/materialize/module/CardDialog'
], function (
    ui, dom, lang,
    Editor, Clipboard, Dropzone, Codeview, Statusbar, Fullscreen, Handle, AutoLink, AutoSync, Placeholder,
    Buttons, Toolbar, LinkDialog, LinkPopover, ImageDialog, ImagePopover, TablePopover, VideoDialog, HelpDialog, AirPopover, HintPopover,
    CardDialog
) {

    $.materialnote = $.extend($.materialnote, {
        version: '@VERSION',
        ui: ui,
        dom: dom,

        plugins: {},

        options: {
            modules: {
                'editor': Editor,
                'clipboard': Clipboard,
                'dropzone': Dropzone,
                'codeview': Codeview,
                'statusbar': Statusbar,
                'fullscreen': Fullscreen,
                'handle': Handle,
                // FIXME: HintPopover must be front of autolink
                //  - Script error about range when Enter key is pressed on hint popover
                'hintPopover': HintPopover,
                'autoLink': AutoLink,
                'autoSync': AutoSync,
                'placeholder': Placeholder,
                'buttons': Buttons,
                'toolbar': Toolbar,
                'linkDialog': LinkDialog,
                'linkPopover': LinkPopover,
                'imageDialog': ImageDialog,
                'imagePopover': ImagePopover,
                'tablePopover': TablePopover,
                'videoDialog': VideoDialog,
                'helpDialog': HelpDialog,
                'airPopover': AirPopover,
                'cardDialog': CardDialog
            },

            buttons: {},

            lang: 'en-US',

            // toolbar
            toolbar: [
                ['style', ['style']],
                ['font', ['bold', 'underline', 'clear']],
                ['fontname', ['fontname']],
                ['color', ['color']],
                ['para', ['ul', 'ol', 'paragraph']],
                ['table', ['table']],
                ['insert', ['link', 'picture', 'video']],
                ['view', ['fullscreen', 'codeview', 'help']]
            ],

            // popover
            popover: {
                image: [
                    ['imagesize', ['imageSize100', 'imageSize50', 'imageSize25']],
                    ['float', ['floatLeft', 'floatRight', 'floatNone']],
                    ['responsivity', ['responsive']],
                    ['remove', ['removeMedia']]
                ],
                link: [
                    ['link', ['linkDialogShow', 'openLinkNewWindow', 'unlink']]
                ],
                table: [
                    ['add', ['addRowDown', 'addRowUp', 'addColLeft', 'addColRight']],
                    ['materializeOptions', ['borderedTable', 'stripedTable', 'highlightedTable', 'responsiveTable', 'centeredTable']],
                    ['delete', ['deleteRow', 'deleteCol', 'deleteTable']]
                ],
                air: [
                    ['color', ['color']],
                    ['font', ['bold', 'underline', 'clear']],
                    ['para', ['ul', 'paragraph']],
                    ['table', ['table']],
                    ['insert', ['link', 'picture']]
                ]
            },

            // air mode: inline editor
            airMode: false,

            width: null,
            height: null,
            linkTargetBlank: true,

            focus: false,
            tabSize: 4,
            styleWithSpan: true,
            shortcuts: true,
            textareaAutoSync: true,
            direction: null,
            tooltip: 'auto',

            styleTags: ['p', 'blockquote', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],

            fontNames: [
                'Roboto', 'Arial', 'Arial Black', 'Comic Sans MS', 'Courier New',
                'Helvetica Neue', 'Helvetica', 'Impact', 'Lucida Grande',
                'Tahoma', 'Times New Roman', 'Verdana'
            ],

            fontSizes: ['10', '11', '12', '13', '14', '15', '16', '18', '24', '36', '48'],

            // following toolbar
            followingToolbar: true,
            otherStaticBarClass: 'topBar',

            // materialize components
            materializeComponents: {
                card: {
                    defaultBackColor: '#212121',
                    defaultForeColor: '#eeeeee'
                }
            },

            // pallete colors(n x n)
            colors: [
                ['#FFEBEE', '#fce4ec', '#f3e5f5', '#ede7f6', '#e8eaf6', '#E3F2FD', '#e1f5fe', '#e0f7fa', '#e0f2f1', '#E8F5E9', '#f1f8e9', '#f9fbe7', '#fffde7', '#fff8e1', '#fff3e0', '#fbe9e7', '#fafafa'],
                ['#FFCDD2', '#f8bbd0', '#e1bee7', '#d1c4e9', '#c5cae9', '#BBDEFB', '#b3e5fc', '#b2ebf2', '#b2dfdb', '#C8E6C9', '#dcedc8', '#f0f4c3', '#fff9c4', '#ffecb3', '#ffe0b2', '#ffccbc', '#f5f5f5'],
                ['#EF9A9A', '#f48fb1', '#ce93d8', '#b39ddb', '#9fa8da', '#90CAF9', '#81d4fa', '#80deea', '#80cbc4', '#A5D6A7', '#c5e1a5', '#e6ee9c', '#fff59d', '#ffe082', '#ffcc80', '#ffab91', '#eeeeee'],
                ['#E57373', '#f06292', '#ba68c8', '#9575cd', '#7986cb', '#64B5F6', '#4fc3f7', '#4dd0e1', '#4db6ac', '#81C784', '#aed581', '#dce775', '#fff176', '#ffd54f', '#ffb74d', '#ff8a65', '#e0e0e0'],
                ['#EF5350', '#ec407a', '#ab47bc', '#7e57c2', '#5c6bc0', '#42A5F5', '#29b6f6', '#26c6da', '#26a69a', '#66BB6A', '#9ccc65', '#d4e157', '#ffee58', '#ffca28', '#ffa726', '#ff7043', '#bdbdbd'],
                ['#F44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196F3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', '#9e9e9e'],
                ['#E53935', '#d81b60', '#8e24aa', '#5e35b1', '#3949ab', '#1E88E5', '#039be5', '#00acc1', '#00897b', '#43A047', '#7cb342', '#c0ca33', '#fdd835', '#ffb300', '#fb8c00', '#f4511e', '#757575'],
                ['#D32F2F', '#c2185b', '#7b1fa2', '#512da8', '#303f9f', '#1976D2', '#0288d1', '#0097a7', '#00796b', '#388E3C', '#689f38', '#afb42b', '#fbc02d', '#ffa000', '#f57c00', '#e64a19', '#616161'],
                ['#C62828', '#ad1457', '#6a1b9a', '#4527a0', '#283593', '#1565C0', '#0277bd', '#00838f', '#00695c', '#2E7D32', '#558b2f', '#9e9d24', '#f9a825', '#ff8f00', '#ef6c00', '#d84315', '#424242'],
                ['#B71C1C', '#880e4f', '#4a148c', '#311b92', '#1a237e', '#0D47A1', '#01579b', '#006064', '#004d40', '#1B5E20', '#33691e', '#827717', '#f57f17', '#ff6f00', '#e65100', '#bf360c', '#212121'],
                ['#FF8A80', '#ff80ab', '#ea80fc', '#b388ff', '#8c9eff', '#82B1FF', '#80d8ff', '#84ffff', '#a7ffeb', '#B9F6CA', '#ccff90', '#f4ff81', '#ffff8d', '#ffe57f', '#ffd180', '#ff9e80', '#333333'],
                ['#FF5252', '#ff4081', '#e040fb', '#7c4dff', '#536dfe', '#448AFF', '#40c4ff', '#18ffff', '#64ffda', '#69F0AE', '#b2ff59', '#eeff41', '#ffff00', '#ffd740', '#ffab40', '#ff6e40', '#dddddd'],
                ['#FF1744', '#f50057', '#d500f9', '#651fff', '#3d5afe', '#2979FF', '#00b0ff', '#00e5ff', '#1de9b6', '#00E676', '#76ff03', '#c6ff00', '#ffea00', '#ffc400', '#ff9100', '#ff3d00', '#000000'],
                ['#D50000', '#c51162', '#aa00ff', '#6200ea', '#304ffe', '#2962FF', '#0091ea', '#00b8d4', '#00bfa5', '#00C853', '#64dd17', '#aeea00', '#ffd600', '#ffab00', '#ff6d00', '#dd2c00', '#ffffff']
            ],
            // materialize color names for color palette
            colorNames: [
                ['red lighten-5', 'pink lighten-5', 'purple lighten-5', 'deep-purple lighten-5', 'indigo lighten-5', 'blue lighten-5', 'light-blue lighten-5', 'cyan lighten-5', 'teal lighten-5', 'green lighten-5', 'light-green lighten-5', 'lime lighten-5', 'yellow lighten-5', 'amber lighten-5',  'orange lighten-5', 'deep-orange lighten-5', 'grey lighten-5'],
                ['red lighten-4', 'pink lighten-4', 'purple lighten-4', 'deep-purple lighten-4', 'indigo lighten-4', 'blue lighten-4', 'light-blue lighten-4', 'cyan lighten-4', 'teal lighten-4', 'green lighten-4', 'light-green lighten-4', 'lime lighten-4', 'yellow lighten-4', 'amber lighten-4',  'orange lighten-4', 'deep-orange lighten-4', 'grey lighten-4'],
                ['red lighten-3', 'pink lighten-3', 'purple lighten-3', 'deep-purple lighten-3', 'indigo lighten-3', 'blue lighten-3', 'light-blue lighten-3', 'cyan lighten-3', 'teal lighten-3', 'green lighten-3', 'light-green lighten-3', 'lime lighten-3', 'yellow lighten-3', 'amber lighten-3',  'orange lighten-3', 'deep-orange lighten-3', 'grey lighten-3'],
                ['red lighten-2', 'pink lighten-2', 'purple lighten-2', 'deep-purple lighten-2', 'indigo lighten-2', 'blue lighten-2', 'light-blue lighten-2', 'cyan lighten-2', 'teal lighten-2', 'green lighten-2', 'light-green lighten-2', 'lime lighten-2', 'yellow lighten-2', 'amber lighten-2',  'orange lighten-2', 'deep-orange lighten-2', 'grey lighten-2'],
                ['red lighten-1', 'pink lighten-1', 'purple lighten-1', 'deep-purple lighten-1', 'indigo lighten-1', 'blue lighten-1', 'light-blue lighten-1', 'cyan lighten-1', 'teal lighten-1', 'green lighten-1', 'light-green lighten-1', 'lime lighten-1', 'yellow lighten-1', 'amber lighten-1',  'orange lighten-1', 'deep-orange lighten-1', 'grey lighten-1'],
                ['red',           'pink',           'purple',           'deep-purple',           'indigo',           'blue',           'light-blue',           'cyan',           'teal',           'green',           'light-green',           'lime',           'yellow',           'amber',            'orange',           'deep-orange',           'grey'],
                ['red darken-1',  'pink darken-1',  'purple darken-1',  'deep-purple darken-1',  'indigo darken-1',  'blue darken-1',  'light-blue darken-1',  'cyan darken-1',  'teal darken-1',  'green darken-1',  'light-green darken-1',  'lime darken-1',  'yellow darken-1',  'amber darken-1',   'orange darken-1',  'deep-orange darken-1',  'grey darken-1'],
                ['red darken-2',  'pink darken-2',  'purple darken-2',  'deep-purple darken-2',  'indigo darken-2',  'blue darken-2',  'light-blue darken-2',  'cyan darken-2',  'teal darken-2',  'green darken-2',  'light-green darken-2',  'lime darken-2',  'yellow darken-2',  'amber darken-2',   'orange darken-2',  'deep-orange darken-2',  'grey darken-2'],
                ['red darken-3',  'pink darken-3',  'purple darken-3',  'deep-purple darken-3',  'indigo darken-3',  'blue darken-3',  'light-blue darken-3',  'cyan darken-3',  'teal darken-3',  'green darken-3',  'light-green darken-3',  'lime darken-3',  'yellow darken-3',  'amber darken-3',   'orange darken-3',  'deep-orange darken-3',  'grey darken-3'],
                ['red darken-4',  'pink darken-4',  'purple darken-4',  'deep-purple darken-4',  'indigo darken-4',  'blue darken-4',  'light-blue darken-4',  'cyan darken-4',  'teal darken-4',  'green darken-4',  'light-green darken-4',  'lime darken-4',  'yellow darken-4',  'amber darken-4',   'orange darken-4',  'deep-orange darken-4',  'grey darken-4'],
                ['red accent-1',  'pink accent-1',  'purple accent-1',  'deep-purple accent-1',  'indigo accent-1',  'blue accent-1',  'light-blue accent-1',  'cyan accent-1',  'teal accent-1',  'green accent-1',  'light-green accent-1',  'lime accent-1',  'yellow accent-1',  'amber accent-1',   'orange accent-1',  'deep-orange accent-1',  'grey custom-dark'],
                ['red accent-2',  'pink accent-2',  'purple accent-2',  'deep-purple accent-2',  'indigo accent-2',  'blue accent-2',  'light-blue accent-2',  'cyan accent-2',  'teal accent-2',  'green accent-2',  'light-green accent-2',  'lime accent-2',  'yellow accent-2',  'amber accent-2',   'orange accent-2',  'deep-orange accent-2',  'grey custom-light'],
                ['red accent-3',  'pink accent-3',  'purple accent-3',  'deep-purple accent-3',  'indigo accent-3',  'blue accent-3',  'light-blue accent-3',  'cyan accent-3',  'teal accent-3',  'green accent-3',  'light-green accent-3',  'lime accent-3',  'yellow accent-3',  'amber accent-3',   'orange accent-3',  'deep-orange accent-3',  'black'],
                ['red accent-4',  'pink accent-4',  'purple accent-4',  'deep-purple accent-4',  'indigo accent-4',  'blue accent-4',  'light-blue accent-4',  'cyan accent-4',  'teal accent-4',  'green accent-4',  'light-green accent-4',  'lime accent-4',  'yellow accent-4',  'amber accent-4',   'orange accent-4',  'deep-orange accent-4',  'white']
            ],

            defaultColors: {
                text: '#eeeeee',
                background: '#212121',

                cardText: 'grey lighten-5',
                cardBackground: 'grey darken-4'
            },

            lineHeights: ['1.0', '1.2', '1.4', '1.5', '1.6', '1.8', '2.0', '3.0'],

            tableClassName: '',

            insertTableMaxSize: {
                col: 10,
                row: 10
            },

            dialogsInBody: false,
            dialogsFade: false,

            maximumImageFileSize: null,

            callbacks: {
                onInit: null,
                onFocus: null,
                onBlur: null,
                onEnter: null,
                onKeyup: null,
                onKeydown: null,
                onImageUpload: null,
                onImageUploadError: null
            },

            codemirror: {
                mode: 'text/html',
                htmlMode: true,
                lineNumbers: true
            },

            keyMap: {
                pc: {
                    'ENTER': 'insertParagraph',
                    'CTRL+Z': 'undo',
                    'CTRL+Y': 'redo',
                    'TAB': 'tab',
                    'SHIFT+TAB': 'untab',
                    'CTRL+B': 'bold',
                    'CTRL+I': 'italic',
                    'CTRL+U': 'underline',
                    'CTRL+SHIFT+S': 'strikethrough',
                    'CTRL+BACKSLASH': 'removeFormat',
                    'CTRL+SHIFT+L': 'justifyLeft',
                    'CTRL+SHIFT+E': 'justifyCenter',
                    'CTRL+SHIFT+R': 'justifyRight',
                    'CTRL+SHIFT+J': 'justifyFull',
                    'CTRL+SHIFT+NUM7': 'insertUnorderedList',
                    'CTRL+SHIFT+NUM8': 'insertOrderedList',
                    'CTRL+LEFTBRACKET': 'outdent',
                    'CTRL+RIGHTBRACKET': 'indent',
                    'CTRL+NUM0': 'formatPara',
                    'CTRL+NUM1': 'formatH1',
                    'CTRL+NUM2': 'formatH2',
                    'CTRL+NUM3': 'formatH3',
                    'CTRL+NUM4': 'formatH4',
                    'CTRL+NUM5': 'formatH5',
                    'CTRL+NUM6': 'formatH6',
                    'CTRL+ENTER': 'insertHorizontalRule',
                    'CTRL+K': 'linkDialog.show'
                },

                mac: {
                    'ENTER': 'insertParagraph',
                    'CMD+Z': 'undo',
                    'CMD+SHIFT+Z': 'redo',
                    'TAB': 'tab',
                    'SHIFT+TAB': 'untab',
                    'CMD+B': 'bold',
                    'CMD+I': 'italic',
                    'CMD+U': 'underline',
                    'CMD+SHIFT+S': 'strikethrough',
                    'CMD+BACKSLASH': 'removeFormat',
                    'CMD+SHIFT+L': 'justifyLeft',
                    'CMD+SHIFT+E': 'justifyCenter',
                    'CMD+SHIFT+R': 'justifyRight',
                    'CMD+SHIFT+J': 'justifyFull',
                    'CMD+SHIFT+NUM7': 'insertUnorderedList',
                    'CMD+SHIFT+NUM8': 'insertOrderedList',
                    'CMD+LEFTBRACKET': 'outdent',
                    'CMD+RIGHTBRACKET': 'indent',
                    'CMD+NUM0': 'formatPara',
                    'CMD+NUM1': 'formatH1',
                    'CMD+NUM2': 'formatH2',
                    'CMD+NUM3': 'formatH3',
                    'CMD+NUM4': 'formatH4',
                    'CMD+NUM5': 'formatH5',
                    'CMD+NUM6': 'formatH6',
                    'CMD+ENTER': 'insertHorizontalRule',
                    'CMD+K': 'linkDialog.show'
                }
            },
            icons: {
                'align': 'note-icon-align',
                'alignCenter': 'note-icon-align-center',
                'alignJustify': 'note-icon-align-justify',
                'alignLeft': 'note-icon-align-left',
                'alignRight': 'note-icon-align-right',
                'rowBelow': 'note-icon-row-below',
                'colBefore': 'note-icon-col-before',
                'colAfter': 'note-icon-col-after',
                'rowAbove': 'note-icon-row-above',
                'rowRemove': 'note-icon-row-remove',
                'colRemove': 'note-icon-col-remove',
                'indent': 'note-icon-align-indent',
                'outdent': 'note-icon-align-outdent',
                'arrowsAlt': 'note-icon-arrows-alt',
                'bold': 'note-icon-bold',
                'caret': 'note-icon-caret',
                'circle': 'note-icon-circle',
                'close': 'note-icon-close',
                'code': 'note-icon-code',
                'eraser': 'note-icon-eraser',
                'font': 'note-icon-font',
                'frame': 'note-icon-frame',
                'italic': 'note-icon-italic',
                'link': 'note-icon-link',
                'unlink': 'note-icon-chain-broken',
                'magic': 'note-icon-magic',
                'menuCheck': 'note-icon-check',
                'minus': 'note-icon-minus',
                'orderedlist': 'note-icon-orderedlist',
                'pencil': 'note-icon-pencil',
                'picture': 'note-icon-picture',
                'question': 'note-icon-question',
                'redo': 'note-icon-redo',
                'square': 'note-icon-square',
                'strikethrough': 'note-icon-strikethrough',
                'subscript': 'note-icon-subscript',
                'superscript': 'note-icon-superscript',
                'table': 'note-icon-table',
                'textHeight': 'note-icon-text-height',
                'trash': 'note-icon-trash',
                'underline': 'note-icon-underline',
                'undo': 'note-icon-undo',
                'unorderedlist': 'note-icon-unorderedlist',
                'video': 'note-icon-video'
            }
        }
    });
});
