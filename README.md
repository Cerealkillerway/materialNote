## MaterialNote V 1.0.6

LIVE DEMO: [MaterialNote demo](http://www.web-forge.info/projects/materialNote)

A Summernote wysiwyg editor version converted for Materialize
 (Materialize [Official website](http://materializecss.com/))

##### Added features:

*   Following toolbar
*   global restyling


MaterialNote is a fork of Summernote wysiwyg editor
 (See the [Original API](http://summernote.org/#/deep-dive))
 Edited by CK

##### Usage
 Just call **materialnote() on any jquery element;

 **NOTE:
 in case of multiple editors on the same page, the id attribute must be provided (if you use airMode, the id is needed always);


##### There are some extra options

that you can pass to the constructor in materialSummernote:

*   defaultTextColor (used by "color" button to set the default text color)
*   defaultBackColor (used by "color" button to set button's color default background color)
*   followingToolbar (default true)

MaterialSummernote is not just a conversion of Summernote from bootstrap to materialize,
 it also contains some changes

It is provided with scss version of the stylesheet, if you use sass, to change style quickly

##### Materialize Overrides
The provided versione includes an override of materialize tooltips (called ckTooltip) with autoclean function for tooltips' shadow dom when the tooltipped element is destroyed (better for single-page app); this functions is also edited to have faster tooltip animations;
If you don't need/want this, you can use the standard materialize tooltip function, replacing "ckTooltip" with "tooltip" in materialNote (1 occurence) and removing "ckMaterializeOverrides.js" file and its reference in index.html;

##### Grunt
It is provided with livereload and sass version of stylesheet;
use "grunt" to execute it and point your browser on "localhost:7000" (prerequisites: ruby, sass ("gem install sass"), grunt-cli, grunt and needed plugins ("npm install"), browser livereload extension)

##### History
v1.0.5
------
- fixed codeMirror bug (codeMirror not updating editor's content)
- fixed Roboto missing font
