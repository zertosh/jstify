'use strict';

var fs = require('fs');

var jstify = require('./');
var registered;

var DEFAULT_EXTENSIONS = ['.jst', '.tpl', '.html', '.ejs'];

module.exports = function(opts) {
  if (registered) return;
  if (!opts) opts = {};

  var extensions = opts.extensions || DEFAULT_EXTENSIONS;

  function compile(module, file) {
    var src = stripBOM(fs.readFileSync(file, 'utf8'));
    var transformed = jstify.transform(src, opts);
    module._compile(transformed, file);
  }

  extensions.forEach(function(ext) { require.extensions[ext] = compile; });
  registered = true;
};

function stripBOM(content) {
  return content.charCodeAt(0) === 0xFEFF ? content.slice(1) : content;
}
