'use-strict';

/* REQUIREMENTS */

var async = require('async');
var moment = require('moment');

/* PLUGIN */

var lockdown = function(schema, options) {
  var lockedFields = {};
  var paths = schema.paths;

  // get options from schema declaration
  async.forEachOf(paths, function(value, fieldName, pathsCallback) {
    var fieldOptions = value.options;
    if (fieldOptions.lockdown === true) {
      lockedFields[fieldName] = {
        saves: 0,
        max: 1
      };
    } else if (typeof fieldOptions.lockdown === 'number') {
      lockedFields[fieldName] = {
        saves: 0,
        max: fieldOptions.lockdown
      }
    }
    return pathsCallback();
  }, function(err) {
    if (err) {
      return console.error(err);
    }
    return;
  });

  // set up PRE SAVE hook
  schema.pre('save', function(next) {
    var self = this;
    async.forEachOf(lockedFields, function(value, fieldName, lockedFieldsCallback) {
      var fieldModified = self.isModified(fieldName);

      if (fieldModified) {
        lockedFields[fieldName].saves++;
      }
      var maxSaves = lockedFields[fieldName].max;
      var numberOfSaves = lockedFields[fieldName].saves;
      if (numberOfSaves > maxSaves) {
        // prevent the update
      }

      return lockedFieldsCallback();
    }, function(err) {
      if (err) {
        return console.error(err);
      }
      return next();
    });
  });

};

module.exports = lockdown;
