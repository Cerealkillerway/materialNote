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
                '</div>'
            ].join('');

            var footer = [
                '<a href="#!" class="modal-action modal-close waves-effect waves-light btn ">' + lang.shortcut.close + '</a>',
                '<button href="#" class="btn note-video-btn disabled" disabled>' + lang.materializeComponents.card.insert + '</button>'
            ].join('');

            this.$dialog = ui.dialog({
                title: lang.materializeComponents.card.card,
                fade: options.dialogsFade,
                body: body,
                footer: footer,
                id: 'note-card-modal'
            }).render().appendTo($container);

            this.$dialog.modal({
                ready: function() {
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

    return CardDialog;
});
