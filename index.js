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
    var lockdownSetting = fieldOptions.lockdown;
    var resetOptions = fieldOptions.lockdownReset;

    // check for invalid lockdown param
    if (lockdownSetting) {
      if (typeof lockdownSetting !== 'number') {
        if (lockdownSetting !== true && lockdownSetting !== false) {
          return pathsCallback('Mongoose lockdown error: invalid lockdown value on field \'' + fieldName + '\'.');
        }
      }
    }

    // check for invalid reset options
    if (resetOptions) {
      if (!resetOptions.length) {
        return pathsCallback('Mongoose lockdown error: no length defined for reset options on field \'' + fieldName + '\'.');
      } else if (typeof resetOptions.length !== 'number') {
        return pathsCallback('Mongoose lockdown error: invalid length defined for reset options on field \'' + fieldName + '\'.');
      } else if (!resetOptions.period) {
        return pathsCallback('Mongoose lockdown error: no period defined for reset options on field \'' + fieldName + '\'.');
      } else if (typeof resetOptions.period !== 'string') {
        return pathsCallback('Mongoose lockdown error: invalid period defined for reset options on field \'' + fieldName + '\'.');
      }
    }

    if (lockdownSetting === true) {
      lockedFields[fieldName] = {
        saves: 0,
        max: 1,
        reset: resetOptions
      };
    } else if (typeof lockdownSetting === 'number') {
      lockedFields[fieldName] = {
        saves: 0,
        max: fieldOptions.lockdown,
        reset: resetOptions
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
    var todayMoment = moment.utc();
    var today = todayMoment.toDate();
    async.forEachOf(lockedFields, function(value, fieldName, lockedFieldsCallback) {

      // check for a reset
      if (!value.lastModified) {
        value.lastModified = today;
      }
      var lastModifiedMoment = moment.utc(value.lastModified);
      var lockdownReset = value.reset;
      if (lockdownReset) {
        var resetDiff = todayMoment.diff(lastModifiedMoment, lockdownReset.period);
        if (resetDiff >= lockdownReset.length) {
          value.saves = 0;
        }
      }

      // we only care if a locked field is modified
      var fieldModified = self.isModified(fieldName);
      if (fieldModified) {
        value.saves++;
        value.lastModified = today;
        var maxSaves = value.max;
        var numberOfSaves = value.saves;
        if (numberOfSaves > maxSaves) {
          // prevent the update
        }
      }

      return lockedFieldsCallback();
    }, function(err) {
      if (err) {
        return console.error(err);
      }
      console.log(lockedFields);
      return next();
    });
  });

};

module.exports = lockdown;
