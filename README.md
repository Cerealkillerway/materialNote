## MaterialNote v1.2.1

![MaterialNote](http://144.76.103.88/webforge_static/appLogos/materialNote.png)

LIVE DEMO: [MaterialNote demo](http://www.web-forge.info/projects/materialNote)
(live demo can be outdated for a while; if live demo version is not the same of current plugin version, please use the included demo instead)

A Summernote wysiwyg editor version converted for Materialize
 (Materialize [Official website](http://materializecss.com/))

##### Added features:

- Following toolbar
- global restyling


**MaterialNote is a fork of Summernote wysiwyg editor**
(See the [Original API](http://summernote.org/#/deep-dive))
Edited by CK

##### Usage
Just call **materialnote() on any jquery element;

**NOTE:**
in case of multiple editors on the same page, the id attribute must be provided (if you use airMode, the id is needed always);


##### There are some extra options

that you can pass to the constructor in materialSummernote:

- defaultTextColor (used by "color" button to set the default text color)
- defaultBackColor (used by "color" button to set button's color default background color)
- followingToolbar (default true)
- otherStaticBarClass is the class of webapp's static bar (if used); this is used to avoid materialNote's toolbar to override it while scrolling (default .staticTop)

MaterialSummernote is not just a conversion of Summernote from bootstrap to materialize, it also contains some changes, but still have all the original Summernote's API.

It is provided with scss version of the stylesheet, if you use sass, to change style quickly

##### Materialize Overrides
The provided versione includes an override of materialize tooltips (called ckTooltip) with autoclean function for tooltips' shadow dom when the tooltipped element is destroyed (better for single-page app); this functions is also edited to have faster tooltip animations;
If you don't need/want this, you can use the standard materialize tooltip function, replacing "ckTooltip" with "tooltip" in materialNote (1 occurence) and removing "ckMaterializeOverrides.js" file and its reference in index.html;

### Grunt
It is provided with livereload and sass version of stylesheet;
use "grunt" to execute it and point your browser on "localhost:7000" (prerequisites: ruby, sass ("gem install sass"), grunt-cli, grunt and needed plugins ("npm install"), browser livereload extension);

Use --port option to serve it on another port; example:
**grunt --port=9000**

Use **grunt uglify** or **grunt minify** to rebuild the minified version of fileUploader.js

### License
Available under <a href="http://opensource.org/licenses/MIT" target="_blank">MIT license</a> (also available in included **license.txt** file).

##### History
1.2.0
-----
- added minified version and minify task

1.1.8
-----
- fidex bugs for following toolbar with otherStaticBar option
- minor style corrections

1.1.7
-----
- upgraded mobile support for dropdown

1.1.0
-----
- improved mobile support
- added support for webapp' static bar

1.0.6
-----
- bug fixes

1.0.5
-----
- fixed codeMirror bug (codeMirror not updating editor's content)
- fixed Roboto missing font
