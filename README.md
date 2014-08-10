jstify
======

`jstify` is a [Browserify](https://github.com/substack/node-browserify) transform for creating modules of pre-compiled [Underscore](https://github.com/jashkenas/underscore) and [Lo-Dash](https://github.com/lodash/lodash) templates that also minifies the template's HTML using [HTMLMinifer](https://github.com/kangax/html-minifier) before compilation.

### Installation ###
With [`npm`](http://npmjs.org/) as a local development dependency:

```bash
npm install --save-dev jstify
```


### Configuration ###

`jstify` can take a configuration object with any of the following:

* `engine` _(optional)_: The module name of the library to use for template compilation. It will also be the value used for the `var _ = require([engine]);` in the template output. The default value is `underscore`, but may be set to `lodash`.
* `noMinify` _(optional)_: Whether to use [HTMLMinifer](https://github.com/kangax/html-minifier) or not. Defaults to `false`. This is useful for when your template looks like broken markup and the minifier is complaining.
* `withImports` _(optional)_: Whether to simulate Lo-Dash's [`_.templateSettings.imports`](http://lodash.com/docs#templateSettings_imports) in the compiled template. Defaults to `false`.
* `templateOpts` _(optional)_: The options to pass to the compilation library. By default this is empty, so check [Underscore's template docs](http://underscorejs.org/#template) or [Lo-Dash's template docs](http://lodash.com/docs#template) for their respective defaults and options.
* `minifierOpts` _(optional)_: The options to pass to [HTMLMinifer](https://github.com/kangax/html-minifier). By default, `removeComments` and `collapseWhitespace` are set to `true`, everything else is `false`. See the [HTMLMinifier options docs](http://perfectionkills.com/experimenting-with-html-minifier/#options) for more info.

The transform is only be applied to `.ejs`, `.tpl`, `.jst`, or `.html` files.

### Usage ###

In `templates/main.tpl`:
```html+erb
<p>I like <%= noun %></p>
```

In `example/main.js`:
```js
var template = require('templates/main.tpl');
$('#main').html( template({ noun: 'red bull' }) );
```

#### Transforming with the api ####

```js
var browserify = require('browserify');
var fs = require('fs');
var b = browserify('example/main.js');
b.transform('jstify')
b.bundle().pipe(fs.createWriteStream('bundle.js'));
```

Setting the `engine` to `lodash`:
```js
b.transform('jstify', { engine: 'lodash' })
```

Setting a mustache style interpolator, turning off comment removal and turning on redundant attribute removal:
```js
b.transform('jstify', {
    templateOpts: {
        interpolate: /\{\{(.+?)\}\}/g
    },
    minifierOpts: {
        removeComments: false,
        removeRedundantAttributes: true
    }
});
```

#### Transforming with the command-line ####

```bash
browserify example/main.js -t jstify > bundle.js
```

Setting the `engine` to `lodash`:
```bash
browserify example/main.js -t [ jstify --engine lodash ] > bundle.js
```

Turning off comment removal:
```bash
browserify example/main.js -t [ jstify --minifierOpts [ --collapseWhitespace 0 ] ] > bundle.js
```

_Command-line caveat: Setting options in `templateOpts` that require a `RegExp` does not work._

### Transformed Samples ###

Template source:
```html+erb
  <div>
    <p><%= "i like red bull" %></p>
      </div>


<div>
  i also like cat gifs
</div>
```

Compiled without HTML minification:
```js
var _ = require('underscore');
module.exports = function(obj){
var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};
with(obj||{}){
__p+='<div>\n    <p>'+
((__t=( "i like red bull" ))==null?'':__t)+
'</p>\n        </div>\n\n<div>\n  i also like cat gifs\n</div>';
}
return __p;
};
```

Compiled with HTML minification:
```js
var _ = require('underscore');
module.exports = function(obj){
var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};
with(obj||{}){
__p+='<div><p>'+
((__t=( "i like red bull" ))==null?'':__t)+
'</p></div><div>i also like cat gifs</div>';
}
return __p;
};
```
