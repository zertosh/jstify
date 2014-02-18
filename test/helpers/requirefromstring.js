function requireFromString(functionBody) {
  // jshint -W054
  var module = {};
  (new Function('require', 'module', functionBody))(require, module);
  return module.exports;
}

module.exports = requireFromString;
