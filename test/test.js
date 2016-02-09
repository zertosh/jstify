'use strict';

var _ = require('underscore');
var concat = require('concat-stream');
var fs = require('fs');
var path = require('path');
var test = require('tap').test;
var vm = require('vm');

function startsWith(str, prefix) {
  return str.indexOf(prefix) === 0;
}

test('jstify', function(t) {

  var jstify = require('../');

  function jstifier(sourcePath, options, callback) {
    fs.createReadStream(sourcePath)
      .pipe(jstify(sourcePath, options))
      .pipe(concat({encoding: 'string'}, callback));
  }

  function loadAsModule(source) {
    var context = {
      require: function(name) {return _;},
      module: {}
    };
    vm.runInNewContext(source, context);
    return context.module.exports;
  }

  t.test('with default options', function(t) {
    t.plan(2);
    var filename = path.resolve('test/fixtures/index.tpl');
    jstifier(filename, null, function(output) {
      var template = loadAsModule(output);
      t.equal(template(),
        '<div> <p>i like red bull and cat gifs</p> </div>',
        'should work');
      t.ok(
        startsWith(output, 'var _ = require(\'underscore\');'),
        'should have underscore as engine');
    });
  });

  t.test('with lodash as engine', function(t) {
    t.plan(2);
    var filename = path.resolve('test/fixtures/index.tpl');
    var opts = {engine: 'lodash'};
    jstifier(filename, opts, function(output) {
      var template = loadAsModule(output);
      t.equal(template(),
        '<div> <p>i like red bull and cat gifs</p> </div>',
        'should work');
      t.ok(
        startsWith(output, 'var _ = require(\'lodash\');'),
        'should have lodash as engine');
    });
  });

  t.test('with lodash-micro as engine', function(t) {
    t.plan(2);
    var filename = path.resolve('test/fixtures/index.tpl');
    var opts = {engine: 'lodash-micro'};
    jstifier(filename, opts, function(output) {
      var template = loadAsModule(output);
      t.equal(template(),
        '<div> <p>i like red bull and cat gifs</p> </div>',
        'should work');
      t.ok(
        startsWith(output, 'var _ = {escape: require("lodash.escape")};'),
        'should only require lodash.escape');
    });
  });

  t.test('with global as engine', function(t) {
    t.plan(3);
    var filename = path.resolve('test/fixtures/uses-underscore.tpl');
    var opts = {engine: 'global'};
    jstifier(filename, opts, function(output) {
      t.throws(function() {
        var ctx = {module: {}};
        vm.runInNewContext(output, ctx);
        var template = ctx.module.exports;
        template();
      }, new ReferenceError('_ is not defined'));

      t.doesNotThrow(function() {
        var ctx = {_: _, module: {}};
        vm.runInNewContext(output, ctx);
        var template = ctx.module.exports;
        t.equal(template(), '<div>123</div>');
      });
    });
  });

  t.test('ignore non-template file', function(t) {
    t.plan(1);
    var filename = path.resolve('test/fixtures/ignore.js');
    jstifier(filename, null, function(output) {
      fs.createReadStream(filename)
        .pipe(concat({encoding: 'string'}, function(data) {
          t.equal(output, data, 'should leave file intact');
        }));
    });
  });

  t.test('minification turned off', function(t) {
    t.plan(1);
    var filename = path.resolve('test/fixtures/broken.tpl');
    var opts = {minifierOpts: false};
    jstifier(filename, opts, function(output) {
      var template = loadAsModule(output);
      t.equal(template(),
        '<div>\n    <pi like red bull and cat gifs</p>\n        </div>\n',
        'should work');
    });
  });

  t.test('noMinify', function(t) {
    t.plan(1);
    var filename = path.resolve('test/fixtures/broken.tpl');
    var opts = {noMinify: true};
    jstifier(filename, opts, function(output) {
      var template = loadAsModule(output);
      t.equal(template(),
        '<div>\n    <pi like red bull and cat gifs</p>\n        </div>\n',
        'should work');
    });
  });

  t.test('withImports', function(t) {
    t.plan(1);
    var opts = {withImports: true};
    var filename = path.resolve('test/fixtures/imports.tpl');
    jstifier(filename, opts, function(output) {
      var context = {
        require: function(name) {
          return {
            templateSettings: {
              imports: {
                importedFunction: function() { return 'dogs are cool'; }
              }
            },
            keys: _.keys,
            values: _.values
          };
        },
        module: {}
      };
      vm.runInNewContext(output, context);
      var template = context.module.exports;
      t.equal(template(),
        '<div>dogs are cool</div>',
        'should work');
    });
  });

  t.test('no collapseWhitespace', function(t) {
    t.plan(1);
    var filename = path.resolve('test/fixtures/index.tpl');
    var opts = {minifierOpts: {collapseWhitespace: false}};
    jstifier(filename, opts, function(output) {
      var template = loadAsModule(output);
      t.equal(template(),
        '<div>\n\n  <p>i like red bull and cat gifs</p>\n\n  </div>',
        'should work');
    });
  });

  t.test('no conservativeCollapse', function(t) {
    t.plan(1);
    var filename = path.resolve('test/fixtures/index.tpl');
    var opts = {minifierOpts: {conservativeCollapse: false}};
    jstifier(filename, opts, function(output) {
      var template = loadAsModule(output);
      t.equal(template(),
        '<div><p>i like red bulland cat gifs</p></div>',
        'should work');
    });
  });

  t.test('compile()', function(t) {
    t.plan(1);
    var filename = path.resolve('test/fixtures/index.tpl');
    fs.createReadStream(filename)
      .pipe(concat({encoding: 'string'}, function(data) {
        var minOpts = {removeComments: true, collapseWhitespace: true, conservativeCollapse: true };
        var template = jstify.compile(data, minOpts);
        t.equal(template(),
          '<div> <p>i like red bull and cat gifs</p> </div>',
          'should work');
      }));
  });

  t.end();
});
