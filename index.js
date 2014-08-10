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

var templateExtension = /\.(jst|tpl|html|ejs)$/;

function jstify(file, opts) {

  if (!templateExtension.test(file)) return through();

  if (!opts) opts = {};

  var _ = require(opts.engine || defaultEngine);

  var engine = opts.engine || defaultEngine;
  var noMinify = !!opts.noMinify;
  var withImports = !!opts.withImports;
  var templateOpts = _.defaults({}, opts.templateOpts, templateDefaults);
  var minifierOpts = _.defaults({}, opts.minifierOpts, minifierDefaults);

  var buffer = '';

  function push(chunk, enc, cb) {
    buffer += chunk;
    cb();
  }

  function end(cb) {
    var raw = noMinify ? buffer : minify(buffer, minifierOpts);
    var compiled = _.template(raw, null, templateOpts).source;

    var body = '';
    body += 'var _ = require(\'' + engine + '\');\n';
    body += 'module.exports = ';

    if (withImports) {
      // Write the actual function with a call to "toString" so the module
      // can take advantage of any minification or additional transforms.
      // This is roughly what Lo-Dash does to bring in `imports`:
      // https://github.com/lodash/lodash/blob/2.4.1/lodash.js#L6672
      body += 'Function(_.keys(_.templateSettings.imports), \'return \' + (' + compiled + ').toString()).apply(undefined, _.values(_.templateSettings.imports));';
    } else {
      body += compiled + ';';
    }

    this.push(body);
    cb();
  }

  return through(push, end);
}

module.exports = jstify;
