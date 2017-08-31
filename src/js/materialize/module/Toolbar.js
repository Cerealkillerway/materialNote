define(function () {
    var Toolbar = function (context) {
        var ui = $.materialnote.ui;
        var $editor = context.layoutInfo.editor;
        var $note = context.layoutInfo.note;
        let $toolbar = context.layoutInfo.toolbar;
        var options = context.options;

        this.shouldInitialize = function () {
            return !options.airMode;
        };

        // following toolbar
        this.followingToolbar = function() {
            let isFullscreen = $editor.hasClass('fullscreen');

            if (isFullscreen) {
              return false;
            }

            let $toolbarWrapper = $toolbar.parent('.note-toolbar-wrapper');
            let editorHeight = $editor.outerHeight();
            let editorWidth = $editor.width();
            let toolbarOffset, editorOffsetTop, editorOffsetBottom, toolbarHeight;
            let activateOffset, deactivateOffsetTop, deactivateOffsetBottom;
            let currentOffset;
            let otherBarHeight;

            toolbarHeight = $toolbar.height();
            $toolbarWrapper.css({height: toolbarHeight});

            // check if the web app is currently using another static bar
            otherBarHeight = $('.' + options.otherStaticBarClass).outerHeight();
            if (!otherBarHeight) {
                otherBarHeight = 0;
            }

            currentOffset = $(document).scrollTop();
            toolbarOffset = $toolbar.offset().top;
            editorOffsetTop = $editor.offset().top;
            editorOffsetBottom = editorOffsetTop + editorHeight;
            activateOffset = editorOffsetTop - otherBarHeight;
            deactivateOffsetBottom = editorOffsetBottom - otherBarHeight - toolbarHeight;
            deactivateOffsetTop = editorOffsetTop - otherBarHeight;

            if ((currentOffset > activateOffset) && (currentOffset < deactivateOffsetBottom)) {
                $toolbar.css({position: 'fixed', top: otherBarHeight, width: editorWidth});
            } else {
                $toolbar.css({position: 'relative', top: 0, width: '100%'});
            }
        };

        this.initialize = function () {
            options.toolbar = options.toolbar || [];

            if (!options.toolbar.length) {
                $toolbar.hide();
            } else {
                context.invoke('buttons.build', $toolbar, options.toolbar);
            }

            if (options.toolbarContainer) {
                $toolbar.appendTo(options.toolbarContainer);
            }

            $note.on('materialnote.keyup materialnote.mouseup materialnote.change', function () {
                context.invoke('buttons.updateCurrentStyle');
            });

            context.invoke('buttons.updateCurrentStyle');

            if (options.followingToolbar) {
                $(window).on('scroll resize', () => {
                    this.followingToolbar();
                });
            }
        };

        this.destroy = function () {
            $(window).off('scroll resize', this.followingToolbar);
            $toolbar.children().remove();
        };

        this.updateFullscreen = function (isFullscreen) {
            ui.toggleBtnActive($toolbar.find('.btn-fullscreen'), isFullscreen);
        };

        this.updateCodeview = function (isCodeview) {
            ui.toggleBtnActive($toolbar.find('.btn-codeview'), isCodeview);
            if (isCodeview) {
                this.deactivate();
            } else {
                this.activate();
            }
        };

        this.activate = function (isIncludeCodeview) {
            var $btn = $toolbar.find('div.note-btn');
            if (!isIncludeCodeview) {
                $btn = $btn.not('.btn-codeview');
            }
            ui.toggleBtn($btn, true);
            $toolbar.removeClass('disabled');
        };

        this.deactivate = function (isIncludeCodeview) {
            var $btn = $toolbar.find('div.note-btn');
            if (!isIncludeCodeview) {
                $btn = $btn.not('.btn-codeview');
            }
            ui.toggleBtn($btn, false);
            $toolbar.addClass('disabled');
        };
    };

    return Toolbar;
});
