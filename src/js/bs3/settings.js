define([
  'summernote/bs3/ui',
  'summernote/base/core/dom',
  'summernote/base/summernote-en-US',
  'summernote/base/module/Editor',
  'summernote/base/module/Clipboard',
  'summernote/base/module/Dropzone',
  'summernote/base/module/Codeview',
  'summernote/base/module/Statusbar',
  'summernote/base/module/Fullscreen',
  'summernote/base/module/Handle',
  'summernote/base/module/AutoLink',
  'summernote/base/module/AutoSync',
  'summernote/base/module/Placeholder',
  'summernote/bs3/module/Buttons',
  'summernote/bs3/module/Toolbar',
  'summernote/bs3/module/LinkDialog',
  'summernote/bs3/module/LinkPopover',
  'summernote/bs3/module/ImageDialog',
  'summernote/bs3/module/ImagePopover',
  'summernote/bs3/module/TablePopover',
  'summernote/bs3/module/VideoDialog',
  'summernote/bs3/module/HelpDialog',
  'summernote/bs3/module/AirPopover',
  'summernote/bs3/module/HintPopover'
], function (
  ui, dom, lang,
  Editor, Clipboard, Dropzone, Codeview, Statusbar, Fullscreen, Handle, AutoLink, AutoSync, Placeholder,
  Buttons, Toolbar, LinkDialog, LinkPopover, ImageDialog, ImagePopover, TablePopover, VideoDialog, HelpDialog, AirPopover, HintPopover
) {

  $.summernote = $.extend($.summernote, {
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
        'airPopover': AirPopover
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
          ['remove', ['removeMedia']]
        ],
        link: [
          ['link', ['linkDialogShow', 'unlink']]
        ],
        table: [
          ['add', ['addRowDown', 'addRowUp', 'addColLeft', 'addColRight']],
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
        'Arial', 'Arial Black', 'Comic Sans MS', 'Courier New',
        'Helvetica Neue', 'Helvetica', 'Impact', 'Lucida Grande',
        'Tahoma', 'Times New Roman', 'Verdana'
      ],

      fontSizes: ['8', '9', '10', '11', '12', '14', '18', '24', '36'],

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

      lineHeights: ['1.0', '1.2', '1.4', '1.5', '1.6', '1.8', '2.0', '3.0'],

      tableClassName: 'table table-bordered',

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
