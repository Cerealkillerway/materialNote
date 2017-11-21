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
        materialize: {
            deps: ['jquery']
        },
        lang: {
            deps: ['jquery']
        }
    },
    packages: [{
        name: 'materialnote',
        main: 'materialnote',
        location: './'
    }]
});

require(['jquery'], function ($) {
    var requireByPromise = function (paths) {
        return $.Deferred(function (deferred) {
            require(paths, function () {
                //console.log(paths);
                deferred.resolve.apply(this, arguments);
            });
        });
    };

    require(['materialize']);
    require(['materialnote']);

    var promise = $.Deferred();

    // editor type setting
    switch ($('script[data-editor-type]').data('editor-type')) {
        case 'lite':
        promise = requireByPromise(['materialnote/lite/settings']);
        break;

        case 'materialize':
        promise = requireByPromise(['materialnote/materialize/settings']);
        break;
    }

    promise.then(function () {
        return requireByPromise(['lang']);
    }).then(function () {
        // initialize materialNote
        $.each($('.materialnote'), function(index, node) {
            $(node).materialnote({
                height: 300,
                lang: 'it-IT',
                posIndex: index,
                toolbar: [
                    // [groupName, [list of button]]
                    ['style', ['bold', 'italic', 'underline', 'clear']],
                    ['font', ['fontname', 'color', 'strikethrough', 'superscript', 'subscript']],
                    ['fontsize', ['fontsize']],
                    ['para', ['ul', 'ol', 'paragraph', 'paragraphAlignLeft', 'paragraphAlignRight',
                        'paragraphAlignCenter', 'paragraphAlignFull', 'paragraphOutdent', 'paragraphIndent']],
                    ['height', ['height']],
                    ['materialize', ['materializeCard']],
                    ['insert', ['picture', 'link', 'video', 'table', 'hr']],
                    ['misc', ['fullscreen', 'codeview', 'undo', 'redo', 'help']]
                ]
            });
        });

        // hack to make waves work on this demo
        Waves.displayEffect();
    });
});
