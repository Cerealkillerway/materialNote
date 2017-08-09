define([
  'jquery',
  'materialnote/base/core/agent',
  'materialnote/base/core/list',
  'materialnote/base/Context'
], function ($, agent, list, Context) {
  $.fn.extend({
    /**
     * materialnote API
     *
     * @param {Object|String}
     * @return {this}
     */
    materialnote: function () {
      var type = $.type(list.head(arguments));
      var isExternalAPICalled = type === 'string';
      var hasInitOptions = type === 'object';

      var options = hasInitOptions ? list.head(arguments) : {};

      options = $.extend({}, $.materialnote.options, options);

      // Update options
      options.langInfo = $.extend(true, {}, $.materialnote.lang['en-US'], $.materialnote.lang[options.lang]);
      options.icons = $.extend(true, {}, $.materialnote.options.icons, options.icons);
      options.tooltip = options.tooltip === 'auto' ? !agent.isSupportTouch : options.tooltip;

      this.each(function (idx, note) {
        var $note = $(note);
        if (!$note.data('materialnote')) {
          var context = new Context($note, options);
          $note.data('materialnote', context);
          $note.data('materialnote').triggerEvent('init', context.layoutInfo);
        }
      });

      var $note = this.first();
      if ($note.length) {
        var context = $note.data('materialnote');
        if (isExternalAPICalled) {
          return context.invoke.apply(context, list.from(arguments));
        } else if (options.focus) {
          context.invoke('editor.focus');
        }
      }


      // activate plugins
      var $noteEditor = $note.next('.note-editor');
      $noteEditor.find('.dropdown-button').dropdown({
        inDuration: 300,
        outDuration: 225,
        constrainWidth: false, // Does not change width of dropdown to that of the activator
        //hover: true, // Activate on hover
        gutter: 0, // Spacing from edge
        belowOrigin: false, // Displays dropdown below the button
        alignment: 'left', // Displays dropdown with edge aligned to the left of button
        stopPropagation: false // Stops event propagation
      }
    );

      return this;
    }
  });
});
