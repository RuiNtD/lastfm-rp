const { series } = require("gulp");
const { exec } = require("child_process");
const del = require("delete");

function clean() {
  return del("dist/**");
}
exports.clean = clean;

function build() {
  return exec("sperm build");
}
exports.build = build;

exports.default = series(clean, build);
