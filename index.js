var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var async = require('async');
var neurongraph = require('neuron-graph');
var builder = require("neuron-builder");
var neuronjs = require('neuronjs');

function generateScripts(config) {
  return function(done) {
    var build_config = {
      cwd:config.cwd,
      pkg:config.pkg
    };
    var test_file = config.file;
    build_config.pkg.main = './' + path.relative( config.cwd, test_file);
    builder(build_config).on('warn',function(message){
      console.log(message);
    }).parse(test_file, done);
  }
}

function generateGraph(config){
  return function(done){
    neurongraph(config.pkg, {
      cwd: config.cwd,
      dependencyKeys: ["dependencies","devDependencies","asyncDependencies"],
      built_root: path.join(config.cwd, 'neurons'),
      ignore_shrink_file: true,
      stable_only: config.stable_only
    }, function(err, graph, shrinktree){
      done(err, graph);
    });
  };
}

function readTemplate(done) {
  var runner_template = path.join(__dirname, "./template.html");
  fs.readFile(runner_template, 'utf8', done);
}

function readNeuronContent(done){
    neuronjs.content(done);
}

exports.render = function(data, done){
  var options = data.options;

  async.parallel([
    readTemplate,
    generateScripts({
      cwd: options.cwd,
      pkg: options.pkg,
      file: data.js.path
    }),
    generateGraph({
      cwd: options.cwd,
      pkg: options.pkg,
      stable_only: options.stable_only == 'false' ? false : true
    }),
    readNeuronContent
  ], function(err, results) {
    if (err) {
      return done(err);
    }
    var template = results[0];
    var scripts = results[1];
    var graph = results[2];
    var neuron = results[3].toString();

    var result = _.template(template, {
      html: data.html.content,
      name: options.pkg.name,
      version: options.pkg.version,
      graph: graph,
      scripts: scripts,
      neuron: neuron,
      modpath: options.modpath,
      mochaJs: options.mochaJs,
      mochaCss: options.mochaCss
    });

    done(null, result);
  });
}