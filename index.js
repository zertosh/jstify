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

module.exports = Jstify;
util.inherits(Jstify, stream.Transform);

function Jstify(filename, opts) {
  if (!(this instanceof Jstify)) {
    return Jstify.configure(opts)(filename);
  }

  stream.Transform.call(this);

  this._data = '';
  this._opts = opts;
}

Jstify.prototype._transform = function (buf, enc, next) {
  this._data += buf;
  next();
};

Jstify.prototype._flush = function (next) {
  try {
    var code = Jstify.compile(this._data, this._opts);
    this.push(code);
  } catch(err) {
    this.emit('error', err);
    return;
  }
  next();
};

Jstify.EXTENSIONS = ['.jst', '.tpl', '.html', '.ejs'];

Jstify.configure = function(opts) {
  opts = _.assign({}, opts);

  var extensions = opts.extensions ?
    (opts.extensions._ || opts.extensions) :
    Jstify.EXTENSIONS;

  return function(filename) {
    if (!Jstify.canCompile(filename, extensions)) {
      return new stream.PassThrough();
    }
    return new Jstify(filename, opts);
  }
};

Jstify.canCompile = function(filename, extensions) {
  return extensions.some(function(ext) {
    return filename.indexOf(ext, filename.length - ext.length) !== -1;
  });
};

Jstify.compile = function(source, opts) {
  if (!opts) opts = {};

  if (opts.minifierOpts !== false) {
    var minifierOpts = opts.minifierOpts || MINIFIER_DEFAULTS;
    source = minify(source, minifierOpts);
  }
  source = _.template(source, null, opts.templateOpts).source;

  var engine = opts.engine || 'underscore';
  var output = '';

  if (opts.engine === 'lodash-micro') {
    if (opts.withImports) {
      throw new Error('Cannot use "withImports" together with "lodash-micro"');
    }
    // Micro template option, where only lodash.escpae is required, this gives
    // a very small file size footprint compared to include underscore/lodash.
    // It requires the template to not use any lodash/underscore functions.
    output += 'var _ = {escape: require("lodash.escape")};\n';
  } else {
    output += 'var _ = require("' + engine + '");\n'
  }

  if (opts.withImports) {
    // This is roughly what Lo-Dash does to bring in `imports`:
    // https://github.com/lodash/lodash/blob/2.4.1/lodash.js#L6672
    //
    // The template is written as an actual function first so that
    // it can take advantage of any minification. It is then turned
    // into a string because that's what `Function` takes.
    output += 'module.exports = Function(' +
      '_.keys(_.templateSettings.imports), '+
      '"return " + ' + source + '.toString()).apply(undefined, _.values(_.templateSettings.imports)' +
    ');\n';
  } else {
    output += 'module.exports = ' + source + ';\n';
  }

  return output;
};
