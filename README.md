# MaterialNote v2.0.5

WYSIWYG editor for the web, based on materialnote.js and materializeCss.
Version 2 is currently in beta...



## Editor Api

MaterialNote is based on summernote.js, so the API is still the same.
Please visit [summernote.js api guide](http://summernote.org/deep-dive/) to deep dive.


## Settings additions

Other to the standard summernote.js settings, materialNote have some extras (take a look at official summernote guide for the [summernote.js initialization options](http://summernote.org/deep-dive/#initialization-options)).

- `popover.image`: added `['responsivity', ['responsive']]` btn group containing button to handle materialize's image responsivity class.
- `popover.link`: added `openLinkNewWindow` btn to handle `target` attribute of the link directly from the popover.
- `popover.table`: added `['materializeOptions', ['borderedTable', 'stripedTable', 'highlightedTable', 'responsiveTable', 'centeredTable']]` btn group to handle materialize's table options.
- `defaultColors.text` [String]: default text color used for recent-color button at startup.
- `defaultColors.background` [String]: default background color used for recent-color button at startup.
- `followingToolbar` [Boolean]: enable/disable following toolbar.
- `otherStaticBarClass` [String]: if your app already have a fixed positioned topBar, you will need to add here its class to let materialNote able to calculate the right offset for the editor's toolbar.


## Editor colors

If you wish to change any of the editor color, you can quickly achieve the desired result by editing file **src/sass/variables.scss**, which defines all colours used by the editor as sass variables.

After making desired changes, just run `grunt build` to create a new dist in the **dist** folder.


## Multi instances

If you put more than one editor in the same page, some parts such as dropdowns will not work properly (since they use ids) unless you pass a unique `posIndex` parameter to each instance:

```
$.each($('.materialnote'), function(index, node) {
    $(node).materialnote({
        height: 300,
        posIndex: index
    });
});
```


## Contribute

Some lang strings have been added in materialNote other than the ones supplied with summernote.js; by default only english and italian lang files are kept up to date in this repo; if you can help by adding missing strings for your language, please submit a pull request (thank you);

Pull requests are welcome anyway...
