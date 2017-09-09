define([
    'materialnote/base/core/key'
], function (key) {
    var VideoDialog = function (context) {
        var self = this;
        var ui = $.materialnote.ui;

        var $editor = context.layoutInfo.editor;
        var options = context.options;
        var lang = options.langInfo;
        var data;
        var text;

        this.initialize = function () {
            var $container = options.dialogsInBody ? $(document.body) : $editor;

            var body =
            '<div class="row">' +
                '<div class="input-field col s12">' +
                    '<input class="note-video-url form-control" type="text" />' +
                    '<label>' + lang.video.url + lang.video.providers + '</label>' +
                '</div>' +
            '</div>';

            var footer = [
                '<a href="#!" class="modal-action modal-close waves-effect waves-light btn ">' + lang.shortcut.close + '</a>',
                '<button href="#" class="btn note-video-btn disabled" disabled>' + lang.video.insert + '</button>'
            ].join('');

            this.$dialog = ui.dialog({
                title: lang.video.insert,
                fade: options.dialogsFade,
                body: body,
                footer: footer,
                id: 'note-video-modal'
            }).render().appendTo($container);

            this.$dialog.modal({
                ready: function() {
                    var $videoUrl = self.$dialog.find('.note-video-url'),
                    $videoBtn = self.$dialog.find('.note-video-btn');

                    ui.toggleBtn($videoBtn, false);
                    context.triggerEvent('dialog.shown');

                    $videoUrl.val(text).on('input', function () {
                        ui.toggleBtn($videoBtn, $videoUrl.val());
                    }).trigger('focus');

                    $videoBtn.click(function (event) {
                        event.preventDefault();

                        data.resolve($videoUrl.val());
                    });

                    self.bindEnterKey($videoUrl, $videoBtn);
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

        this.createVideoNode = function (url) {
            // video url patterns(youtube, instagram, vimeo, dailymotion, youku, mp4, ogg, webm)
            var ytRegExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
            var ytMatch = url.match(ytRegExp);

            var igRegExp = /(?:www\.|\/\/)instagram\.com\/p\/(.[a-zA-Z0-9_-]*)/;
            var igMatch = url.match(igRegExp);

            var vRegExp = /\/\/vine\.co\/v\/([a-zA-Z0-9]+)/;
            var vMatch = url.match(vRegExp);

            var vimRegExp = /\/\/(player\.)?vimeo\.com\/([a-z]*\/)*(\d+)[?]?.*/;
            var vimMatch = url.match(vimRegExp);

            var dmRegExp = /.+dailymotion.com\/(video|hub)\/([^_]+)[^#]*(#video=([^_&]+))?/;
            var dmMatch = url.match(dmRegExp);

            var youkuRegExp = /\/\/v\.youku\.com\/v_show\/id_(\w+)=*\.html/;
            var youkuMatch = url.match(youkuRegExp);

            var qqRegExp = /\/\/v\.qq\.com.*?vid=(.+)/;
            var qqMatch = url.match(qqRegExp);

            var qqRegExp2 = /\/\/v\.qq\.com\/x?\/?(page|cover).*?\/([^\/]+)\.html\??.*/;
            var qqMatch2 = url.match(qqRegExp2);

            var mp4RegExp = /^.+.(mp4|m4v)$/;
            var mp4Match = url.match(mp4RegExp);

            var oggRegExp = /^.+.(ogg|ogv)$/;
            var oggMatch = url.match(oggRegExp);

            var webmRegExp = /^.+.(webm)$/;
            var webmMatch = url.match(webmRegExp);

            var $video;
            if (ytMatch && ytMatch[1].length === 11) {
                var youtubeId = ytMatch[1];
                $video = $('<iframe>')
                .attr('frameborder', 0)
                .attr('src', '//www.youtube.com/embed/' + youtubeId)
                .attr('width', '640').attr('height', '360');
            } else if (igMatch && igMatch[0].length) {
                $video = $('<iframe>')
                .attr('frameborder', 0)
                .attr('src', 'https://instagram.com/p/' + igMatch[1] + '/embed/')
                .attr('width', '612').attr('height', '710')
                .attr('scrolling', 'no')
                .attr('allowtransparency', 'true');
            } else if (vMatch && vMatch[0].length) {
                $video = $('<iframe>')
                .attr('frameborder', 0)
                .attr('src', vMatch[0] + '/embed/simple')
                .attr('width', '600').attr('height', '600')
                .attr('class', 'vine-embed');
            } else if (vimMatch && vimMatch[3].length) {
                $video = $('<iframe webkitallowfullscreen mozallowfullscreen allowfullscreen>')
                .attr('frameborder', 0)
                .attr('src', '//player.vimeo.com/video/' + vimMatch[3])
                .attr('width', '640').attr('height', '360');
            } else if (dmMatch && dmMatch[2].length) {
                $video = $('<iframe>')
                .attr('frameborder', 0)
                .attr('src', '//www.dailymotion.com/embed/video/' + dmMatch[2])
                .attr('width', '640').attr('height', '360');
            } else if (youkuMatch && youkuMatch[1].length) {
                $video = $('<iframe webkitallowfullscreen mozallowfullscreen allowfullscreen>')
                .attr('frameborder', 0)
                .attr('height', '498')
                .attr('width', '510')
                .attr('src', '//player.youku.com/embed/' + youkuMatch[1]);
            } else if ((qqMatch && qqMatch[1].length) || (qqMatch2 && qqMatch2[2].length)) {
                var vid = ((qqMatch && qqMatch[1].length) ? qqMatch[1]:qqMatch2[2]);
                $video = $('<iframe webkitallowfullscreen mozallowfullscreen allowfullscreen>')
                .attr('frameborder', 0)
                .attr('height', '310')
                .attr('width', '500')
                .attr('src', 'http://v.qq.com/iframe/player.html?vid=' + vid + '&amp;auto=0');
            } else if (mp4Match || oggMatch || webmMatch) {
                $video = $('<video controls>')
                .attr('src', url)
                .attr('width', '640').attr('height', '360');
            } else {
                // this is not a known video link. Now what, Cat? Now what?
                return false;
            }

            $video[0].setAttribute('frameborder', 0);
            $video[0].setAttribute('allowfullscreen', '');

            var $node = $('<div>').addClass('video-container').append($video)[0];

            return $node;
        };

        this.show = function () {
            text = context.invoke('editor.getSelectedText');

            context.invoke('editor.saveRange');
            ui.showDialog(self.$dialog);
            data = $.Deferred();

            data.then(function (url) {
                // [workaround] hide dialog before restore range for IE range focus
                ui.hideDialog(self.$dialog);
                context.invoke('editor.restoreRange');

                // build node
                var $node = self.createVideoNode(url);

                if ($node) {
                    // insert video node
                    context.invoke('editor.insertNode', $node);
                }
            }).fail(function () {
                context.invoke('editor.restoreRange');
            });
        };
    };

    return VideoDialog;
});
