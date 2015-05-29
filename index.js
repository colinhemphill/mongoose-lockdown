'use-strict';

/* REQUIREMENTS */

var async = require('async');

/* PLUGIN */

var lockdown = function(schema, options) {
  var paths = schema.paths;

  async.forEachOf(paths, function(value, fieldName, callback) {
    var fieldOptions = value.options;
    if (fieldOptions.lockdown === true) {
      console.log('lockdown on ' + fieldName);
    }
    return callback();
  }, function(err) {
    if (err) console.error(err);
  });

};

module.exports = lockdown;
