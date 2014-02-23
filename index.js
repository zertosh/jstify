var through = require('through2');
var minify = require('html-minifier').minify;

var defaultEngine = 'underscore';
var templateDefaults = {};
var minifierDefaults = {
  // http://perfectionkills.com/experimenting-with-html-minifier/#options
  removeCommentsFromCDATA: false,
  removeCDATASectionsFromCDATA: false,
  collapseBooleanAttributes: false,
  removeAttributeQuotes: false,
  removeRedundantAttributes: false,
  useShortDoctype: false,
  removeOptionalTags: false,
  removeEmptyElements: false,
  // jstify specific
  removeComments: true,
  collapseWhitespace: true
};

var templateExtension = /\.(jst|tpl|html)$/;

function jstify(file, opts) {

  if (!templateExtension.test(file)) return through();

  opts || (opts = {});

  var _ = require(opts.engine || defaultEngine);

  var engine = opts.engine || defaultEngine;
  var templateOpts = _.defaults({}, opts.templateOpts, templateDefaults);
  var minifierOpts = _.defaults({}, opts.minifierOpts, minifierDefaults);

  var buffer = '';

  function push(chunk, enc, cb) {
    buffer += chunk;
    cb();
  }

  function end(cb) {
    var compiled = _.template(minify(buffer, minifierOpts), null, templateOpts).source;
    var wrapped = [
      'var _ = require(\'', engine, '\');\n',
      'module.exports = ', compiled, ';'
    ].join('');
    this.push(wrapped);
    cb();
  }

  return through(push, end);
}

module.exports = jstify;
