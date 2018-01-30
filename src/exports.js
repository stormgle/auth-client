"use strict"

const libs = [
  'user'
];

const exporter = {}

const modules = libs.map(lib => require(`./${lib}`));
modules.forEach(module => {
  Object.keys(module).forEach(key => {
    exporter[key] = module[key];
  })
});

/*
libs.forEach( (lib) => {
  exporter[lib] = require(`./${lib}`);
});
*/

module.exports = exporter;
