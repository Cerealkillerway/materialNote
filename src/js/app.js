var script = document.getElementById('start');
var isIE8 = script && script.getAttribute('data-browser') === 'ie8';
var jqueryLink = isIE8 ? '//code.jquery.com/jquery-1.11.3' : '//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.4/jquery';

require.config({
    baseUrl: 'src/js',
    paths: {
        jquery: jqueryLink,
        materialize: '../materialize/materialize',
        lang: '../../lang/materialnote-it-IT'
    },
    shim: {
        bootstrap: ['jquery'],
        lang: ['jquery']
    },
    packages: [{
        name: 'materialnote',
        main: 'materialnote',
        location: './'
    }]
});

require(['jquery', 'materialnote'], function ($) {
    var requireByPromise = function (paths) {
        return $.Deferred(function (deferred) {
            require(paths, function () {
                deferred.resolve.apply(this, arguments);
            });
        });
    };

    var promise = $.Deferred();

    // editor type setting
    switch ($('script[data-editor-type]').data('editor-type')) {
        case 'lite':
        promise = requireByPromise(['materialnote/lite/settings']);
        break;
        
        case 'materialize':
        promise = requireByPromise(['materialize', 'materialnote/bs3/settings']).then(function () {
            return requireByPromise(['lang']);
        });
        break;
    }

    promise.then(function () {
        // initialize materialNote
        $('.materialnote').materialnote({
            height: 300,
            lang: 'it-IT',
            toolbar: [
                // [groupName, [list of button]]
                ['style', ['bold', 'italic', 'underline', 'clear']],
                ['font', ['fontname', 'color', 'strikethrough', 'superscript', 'subscript']],
                ['fontsize', ['fontsize']],
                ['para', ['ul', 'ol', 'paragraph', 'paragraphAlignLeft', 'paragraphAlignRight',
                    'paragraphAlignCenter', 'paragraphAlignFull', 'paragraphOutdent', 'paragraphIndent']],
                ['height', ['height']],
                ['insert', ['picture', 'link', 'video', 'table', 'hr']],
                ['misc', ['fullscreen', 'codeview', 'undo', 'redo', 'help']]
            ]
        });
    });
});
