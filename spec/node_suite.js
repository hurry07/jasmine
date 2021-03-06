var fs = require('fs');
var util = require('util');
var path = require('path');

// boot code for jasmine
var jasmineRequire = require('../lib/jasmine-core/jasmine.js');
var jasmine = jasmineRequire.core(jasmineRequire);

var consoleFns = require('../src/console/console.js');
extend(jasmineRequire, consoleFns);
jasmineRequire.console(jasmineRequire, jasmine);

var env = jasmine.getEnv();

var jasmineInterface = {
  describe: function(description, specDefinitions) {
    return env.describe(description, specDefinitions);
  },

  xdescribe: function(description, specDefinitions) {
    return env.xdescribe(description, specDefinitions);
  },

  it: function(desc, func) {
    return env.it(desc, func);
  },

  xit: function(desc, func) {
    return env.xit(desc, func);
  },

  beforeEach: function(beforeEachFunction) {
    return env.beforeEach(beforeEachFunction);
  },

  afterEach: function(afterEachFunction) {
    return env.afterEach(afterEachFunction);
  },

  expect: function(actual) {
    return env.expect(actual);
  },

  addMatchers: function(matchers) {
    return env.addMatchers(matchers);
  },

  spyOn: function(obj, methodName) {
    return env.spyOn(obj, methodName);
  },

  clock: env.clock,
  setTimeout: env.clock.setTimeout,
  clearTimeout: env.clock.clearTimeout,
  setInterval: env.clock.setInterval,
  clearInterval: env.clock.clearInterval,

  jsApiReporter: new jasmine.JsApiReporter(jasmine)
};

extend(global, jasmineInterface);

function extend(destination, source) {
  for (var property in source) destination[property] = source[property];
  return destination;
}

// Jasmine "runner"
function executeSpecs(specs, done, isVerbose, showColors) {
  global.jasmine = jasmine;

  for (var i = 0; i < specs.length; i++) {
    var filename = specs[i];
    require(filename.replace(/\.\w+$/, ""));
  }

  var env = jasmine.getEnv();
  var consoleReporter = new jasmine.ConsoleReporter({
    print: util.print,
    onComplete: done,
    showColors: showColors
  });

  env.addReporter(consoleReporter);
  env.execute();
}

function getFiles(dir, matcher) {
    specs = [];

  if (fs.statSync(dir).isFile() && dir.match(matcher)) {
    specs.push(dir);
  } else {
    var files = fs.readdirSync(dir);
    for (var i = 0, len = files.length; i < len; ++i) {
      var filename = dir + '/' + files[i];
      if (fs.statSync(filename).isFile() && filename.match(matcher)) {
        specs.push(filename);
      } else if (fs.statSync(filename).isDirectory()) {
        var subfiles = getSpecFiles(filename);
        subfiles.forEach(function(result) {
          specs.push(result);
        });
      }
    }
  }
  return specs;
}

function getSpecFiles(dir) {
  return getFiles(dir, new RegExp("Spec.js$"));
}

var j$require = (function() {
  var exported = {},
    j$req;

  global.getJasmineRequireObj = getJasmineRequireObj;

  j$req = require(__dirname + "/../src/core/requireCore.js");
  extend(j$req, require(__dirname + "/../src/console/requireConsole.js"));

  var srcFiles = getFiles(__dirname + "/../src/core");
  srcFiles.push(__dirname + "/../src/version.js");
  srcFiles.push(__dirname + "/../src/console/ConsoleReporter.js");

  for (var i=0; i < srcFiles.length; i++) {
    require(srcFiles[i]);
  }
  extend(j$req, exported);

  delete global.getJasmineRequireObj;

  return j$req;

  function getJasmineRequireObj() {
    return exported;
  }
}());

var j$ = j$require.core(j$require);
j$require.console(j$require, j$);

//var specs = getSpecFiles(__dirname + '/smoke', new RegExp("test.js$"));
var consoleSpecs = getSpecFiles(__dirname + "/console"),
  coreSpecs = getSpecFiles(__dirname + "/core"),
  specs = [];

specs = specs.concat(consoleSpecs);
specs = specs.concat(coreSpecs);

// options from command line
var isVerbose = false;
var showColors = true;
process.argv.forEach(function(arg) {
  switch (arg) {
    case '--color':
      showColors = true;
      break;
    case '--noColor':
      showColors = false;
      break;
    case '--verbose':
      isVerbose = true;
      break;
  }
});

executeSpecs(specs, function(passed) {
  if (passed) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}, isVerbose, showColors);
