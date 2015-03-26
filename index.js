'use strict';

var _       = require('underscore');
var through = require('through2');
var minify  = require('html-minifier').minify;

var MINIFIER_OPTS = {
  // http://perfectionkills.com/experimenting-with-html-minifier/#options
  removeComments: true,
  collapseWhitespace: true
};

var templateExtension = /\.(jst|tpl|html|ejs)$/;

function compile(str, minifierOpts_, templateOpts_) {
  var templateOpts = templateOpts_;
  var minifierOpts = (minifierOpts_ !== false) ? _.defaults({}, minifierOpts_, MINIFIER_OPTS) : false;

  var minified = minifierOpts ? minify(str, minifierOpts) : str;
  var compiled = _.template(minified, null, templateOpts);
  return compiled;
}

function process(source, engine_, withImports) {
  var engine = engine_ || 'underscore';
  var engineRequire = 'var _ = require(\'' + engine + '\');\n';

  if (engine === 'lodash-micro') {
    // Micro template option, where only lodash.escpae is required, this gives
    // a very small file size footprint compared to include underscore/lodash.
    // It requires the template to not use any lodash/underscore functions.
    engineRequire = 'var _ = {escape: require("lodash.escape")};\n';

    if (withImports) {
      throw new Error('Cannot use "withImports" together with "lodash-micro"');
    }
  }

  if (withImports) {
    // This is roughly what Lo-Dash does to bring in `imports`:
    // https://github.com/lodash/lodash/blob/2.4.1/lodash.js#L6672
    return (
      engineRequire +
      // The template is written as an actual function first so that
      // it can take advantage of any minification. It is then turned
      // into a string because that's what `Function` takes.
      'module.exports = Function(_.keys(_.templateSettings.imports), \'return \' + ' + source + '.toString()).apply(undefined, _.values(_.templateSettings.imports));\n'
    );
  } else {
    return engineRequire + 'module.exports = ' + source + ';\n';
  }
}

function jstify(file, opts) {
  if (!templateExtension.test(file)) return through();
  if (!opts) opts = {};

  var buffers = [];

  function push(chunk, enc, next) {
    buffers.push(chunk);
    next();
  }

  function end(next) {
    var str = Buffer.concat(buffers).toString();
    var compiled;

    try {
      compiled = compile(str, opts.noMinify ? false : opts.minifierOpts, opts.templateOpts).source;
      var body = process(compiled, opts.engine, opts.withImports);
      this.push(body);
    } catch(e) {
      return this.emit('error', e);
    }

    next();
  }

  return through(push, end);
}

module.exports = jstify;
module.exports.compile = compile;
