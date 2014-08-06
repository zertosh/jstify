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

  opts || (opts = {});

  var _ = require(opts.engine || defaultEngine);

  var engine = opts.engine || defaultEngine;
  var noMinify = !!opts.noMinify;
  var templateOpts = _.defaults({}, opts.templateOpts, templateDefaults);
  var minifierOpts = _.defaults({}, opts.minifierOpts, minifierDefaults);
  var imports = (function(imports) {
    if (engine === 'lodash' && (imports === true || typeof imports === 'undefined')) {
      imports = '_.templateSettings.imports';
    }
    return (typeof imports === 'string') ? imports : false;
  })(opts.imports);

  var buffer = '';

  function push(chunk, enc, cb) {
    buffer += chunk;
    cb();
  }

  function end(cb) {
    var raw = noMinify ? buffer : minify(buffer, minifierOpts);
    var compiled = _.template(raw, null, templateOpts).source;
    var wrapped = (function(str) {
      if (imports) {
        str.unshift('with (' + imports + ') {\n');
        str.push('\n}');
      }
      str.unshift('var _ = require(\'' + engine + '\');\n');
      return str;
    })(['module.exports = ', compiled, ';']).join('');
    this.push(wrapped);
    cb();
  }

  return through(push, end);
}

module.exports = jstify;
