jstify
======

[![Build Status](https://travis-ci.org/zertosh/jstify.svg?branch=master)](https://travis-ci.org/zertosh/jstify)

`jstify` is a [Browserify](https://github.com/substack/node-browserify) transform for creating modules of pre-compiled [Underscore](https://github.com/jashkenas/underscore) templates. It allows setting the name of the `_` module in the template output for use with `lodash`. Also minifies the template's HTML using [HTMLMinifier](https://github.com/kangax/html-minifier) before compilation.

### Installation ###
With [`npm`](http://npmjs.org/) as a local development dependency:

```bash
npm install --save-dev jstify
```


### Configuration ###

`jstify` can take a configuration object with any of the following:

* `engine` _(optional)_: The value used for `var _ = require([engine]);` in the template output. The default value is `underscore`, but may be set to `lodash` for example. Set it to `lodash-micro` to only include `lodash.escape` as a runtime dependency.
* `withImports` _(optional)_: Whether to simulate Lo-Dash's [`_.templateSettings.imports`](http://lodash.com/docs#templateSettings_imports) in the compiled template. Defaults to `false`.
* `templateOpts` _(optional)_: The options to pass to `_.template`. By default this is empty, check [Underscore's template docs](http://underscorejs.org/#template) for more options.
* `minifierOpts` _(optional)_: The options to pass to [HTMLMinifer](https://github.com/kangax/html-minifier). By default, `removeComments`, `collapseWhitespace` and `conservativeCollapse` are set to `true`, everything else is `false`. See the [HTMLMinifier options docs](http://perfectionkills.com/experimenting-with-html-minifier/#options) for more info.
  * Set to `false` to disable `HTMLMinifier` (This is useful for when your template looks like broken markup and the minifier is complaining).
  * Alternatively, you can set `noMinify`.

The transform is only be applied to `.ejs`, `.tpl`, `.jst`, or `.html` files.

#### Usage of `engine=lodash-micro` ####

When file size of the compiled template is critical use `lodash-micro` configuration for `engine`. As `lodash.escape` is the only runtime dependency, this reduces the minified file size to less than 1kb. This should only be used when the template is not using any `underscore` or `lodash` functions inline like `_.each`.


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

#### Transforming with the require hook ####

For node usage:

```js
require('jstify/register')(/*opts*/);
```

`opts` are the same as with browserify usage.

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
