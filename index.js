var _ = require('underscore');
var through = require('through2');
var minify = require('html-minifier').minify;

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

function process(str, minifierOpts_, templateOpts_, engine_) {
  var engine = engine_ || 'underscore';
  var source = compile(str, minifierOpts_, templateOpts_).source;
  var wrapped = (
    'var _ = require(\'' + engine + '\');\n' +
    'module.exports = ' + source + ';'
  );
  return wrapped;
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
    var body = process(str, opts.minifierOpts, opts.templateOpts, opts.engine);
    this.push(body);
    next();
  }

  return through(push, end);
}

module.exports = jstify;
module.exports.compile = compile;
