/* global describe, it, before, beforeEach, after, afterEach */

require('should');

var fs = require('fs');
var jstify = require('../');
var requireFromString = require('./helpers/requirefromstring');
var wait = require('./helpers/wait');

var templatePath = __dirname + '/fixtures/index.tpl';
var brokenTemplatePath = __dirname + '/fixtures/broken.tpl';
var ignorePath = __dirname + '/fixtures/ignore.js';

describe('jstify', function() {

  var output;
  var options;
  var sourcePath;
  beforeEach(function(done) {
    fs.createReadStream(sourcePath)
      .pipe(jstify(sourcePath, options))
      .pipe(wait(function(err, str) { output = str; done(); }));
  });


  describe('default options', function() {

    before(function() {
      sourcePath = templatePath;
      options = {};
    });

    it('template should work', function() {
      var template = requireFromString(output);
      template().should.equal('<div><p>i like red bull and cat gifs</p></div>');
    });

    it('default engine should be underscore', function() {
      output.should.startWith('var _ = require(\'underscore\');');
    });

  });


  describe('lodash as engine', function() {

    before(function() {
      sourcePath = templatePath;
      options = {
        engine: 'lodash'
      };
    });

    it('template should work', function() {
      var template = requireFromString(output);
      template().should.equal('<div><p>i like red bull and cat gifs</p></div>');
    });

    it('engine should be lodash', function() {
      output.should.startWith('var _ = require(\'lodash\');');
    });

  });


  describe('no collapseWhitespace', function() {

    before(function() {
      sourcePath = templatePath;
      options = {
        minifierOpts: {
          collapseWhitespace: false
        }
      };
    });

    it('template should work', function() {
      var template = requireFromString(output);
      template().should.equal('<div>\n    <p>i like red bull and cat gifs</p>\n        </div>');
    });

  });


  describe('ignore non-template file', function() {

    before(function() {
      sourcePath = ignorePath;
      options = {};
    });

    it('file should be left intact', function(done) {
      fs.createReadStream(sourcePath)
        .pipe(wait(function(err, data) {
          output.should.equal(data);
          done();
        }));
    });

  });


  describe('minification turned off', function() {

    before(function() {
      sourcePath = brokenTemplatePath;
      options = {
        noMinify: true
      };
    });

    it('broken template should work', function() {
      var template = requireFromString(output);
      template().should.equal('<div>\n    <pi like red bull and cat gifs</p>\n        </div>\n');
    });

  });

});
