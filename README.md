# MaterialNote v2

WYSIWYG editor for the web, based on materialnote.js and materializeCss.

MaterialNote v2 is a work-in-progress for better sync with orignal materialnote repo;
MaterialNote v1.2.1 is currently the latest release.


## Editor Api

MaterialNote is based on materialnote.js, so the API is still the same.
Please visit [materialnote.js api guide](http://materialnote.org/deep-dive/) to deep dive.


## Differences with summernote

Other than the obvious changes to the UI to meet material style, there are some differences and improvements in materialNote;

- improved image popover to be shown always in the editor area


## API additions


## Edit colors

If you wish to change any of the editor color, you can quickly achieve the desired result by editing file **src/less/variables.scss**, which defines all colours used by the editor as sass variables.

After making desired changes, just run `grunt build` to create a new dist in the **dist** folder.
