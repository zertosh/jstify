var through = require('through2');

function wait(fn) {
  var buf = '';
  function push(chunk, enc, cb) {
    buf += chunk.toString();
    cb();
  }
  function end(cb) {
    this.push(buf);
    cb();
    if(fn) fn(null, buf);
  }
  return through.obj(push, end);
}

module.exports = wait;
