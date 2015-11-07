'use strict';

var _ = require('underscore');
var stream = require('stream');
var util = require('util');
var minify = require('html-minifier').minify;

var MINIFIER_DEFAULTS = {
  // http://perfectionkills.com/experimenting-with-html-minifier/#options
  removeComments: true,
  collapseWhitespace: true,
  conservativeCollapse: true
};

var DEFAULTS = {
  engine: 'underscore',
  withImports: false,
  templateOpts: {},
  minifierOpts: {},
  noMinify: false
};

var templateExtension = /\.(jst|tpl|html|ejs)$/;

function compile(str, minifierOpts, templateOpts) {
  var minified = minifierOpts === false ? str : minify(str, minifierOpts);
  var compiled = _.template(minified, null, templateOpts);
  return compiled;
}

function wrap(source, engine, withImports) {
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

function transform(src, opts) {
  var compiled = compile(src, opts.noMinify ? false : opts.minifierOpts, opts.templateOpts).source;
  var body = wrap(compiled, opts.engine, opts.withImports);
  return body;
}

function Jstify(opts) {
  stream.Transform.call(this);

  opts = _.defaults({}, opts, DEFAULTS);

  if (opts.minifierOpts !== false) {
    opts.minifierOpts = _.defaults({}, opts.minifierOpts, MINIFIER_DEFAULTS);
  }

  this._data = '';
  this._opts = opts;
}

util.inherits(Jstify, stream.Transform);

Jstify.prototype._transform = function (buf, enc, next) {
  this._data += buf;
  next();
};

Jstify.prototype._flush = function (next) {
  try {
    this.push(transform(this._data, this._opts));
  } catch(err) {
    this.emit('error', err);
    return;
  }
  next();
};

function jstify(file, opts) {
  if (!templateExtension.test(file)) {
    return new stream.PassThrough();
  }
  return new Jstify(opts);
}

module.exports = jstify;
module.exports.compile = compile;
module.exports.wrap = wrap;
module.exports.transform = transform;
