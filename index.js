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
  if (withImports) {
      // This is roughly what Lo-Dash does to bring in `imports`:
      // https://github.com/lodash/lodash/blob/2.4.1/lodash.js#L6672
    return (
      'var _ = require(\'' + engine + '\');\n' +
      // The template is written as an actual function first so that
      // it can take advantage of any minification. It is then turned
      // into a string because that's what `Function` takes.
      'module.exports = Function(_.keys(_.templateSettings.imports), \'return \' + ' + source + '.toString()).apply(undefined, _.values(_.templateSettings.imports));\n'
    );
  } else {
    return (
      'var _ = require(\'' + engine + '\');\n' +
      'module.exports = ' + source + ';\n'
    );
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
        compiled = compile(str, opts.minifierOpts, opts.templateOpts).source;
    } catch(e) {
        return this.emit('error', e);
    }

    var body = process(compiled, opts.engine, opts.withImports);
    this.push(body);
    next();
  }

  return through(push, end);
}

module.exports = jstify;
module.exports.compile = compile;
