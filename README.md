# MaterialNote v2

WYSIWYG editor for the web, based on summernote.js and materializeCss.

MaterialNote v2 is a work-in-progress for better sync with orignal summernote repo;
MaterialNote v1.2.1 is currently the latest release.


## Editor Api

MaterialNote is based on Summernote.js, so the API is still the same.
Please visit [summernote.js api guide](http://summernote.org/deep-dive/) to deep dive.


## Edit colors

If you wish to change any of the editor color, you can quickly achieve the desired result by editing file **src/less/variables.scss**, which defines all colours used by the editor as sass variables.

After making desired changes, just run `grunt build` to create a new dist in the **dist** folder.
