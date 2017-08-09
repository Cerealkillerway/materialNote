'use strict';

Tinytest.add('Instantiation', function (test) {
  var editor = document.createElement('div');
  document.body.appendChild(editor);
  $(editor).materialnote();

  test.equal(typeof $(editor).code(), 'string', 'Instantiation');
});
