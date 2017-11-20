'use-strict';

/* REQUIREMENTS */

var async = require('async');
var moment = require('moment');
var clone = require('clone');
// uuid must be shared among all module instances, so hard-code it:
var uuid = 'ee0fedeb-e9b3-4690-8134-812f6d5ead28';

/* PLUGIN */

var lockedFields = {};
var pluginOptions;

var lockdown = function(schema, options) {
  var paths = schema.paths;
  pluginOptions = options ? options : {};

  if (!paths.lockdown) {
    schema.add({
      lockdown: {
        type: Object,
        select: false
      }
    });
  }

  // get options from schema declaration
  async.forEachOf(paths, function(value, fieldName, pathsCallback) {
    var fieldOptions = value.options;
    var lockdownSetting = fieldOptions.lockdown;
    var resetOptions = fieldOptions.lockdownReset;
    var errorMessage = fieldOptions.lockdownMessage;

    // check for invalid lockdown param
    if (lockdownSetting !== undefined) {
      if (typeof lockdownSetting == 'number') {
        if (lockdownSetting <= 0) {
          return pathsCallback('Mongoose lockdown error: lockdown value on field \'' + fieldName + '\' must be greater than 0.');
        }
      } else {
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
      lockedFields[fieldName.replace('.', uuid)] = {
        saves: 0,
        max: 1,
        reset: resetOptions,
        errorMessage: errorMessage
      };
    } else if (typeof lockdownSetting === 'number') {
      lockedFields[fieldName.replace('.', uuid)] = {
        saves: 0,
        max: lockdownSetting,
        reset: resetOptions,
        errorMessage: errorMessage
      }
    }
    return pathsCallback();
  }, function(err) {
    if (err) {
      return console.error(err);
    }
  });

  // set up PRE SAVE hook
  schema.pre('save', function(next) {
    var self = this;
    var todayMoment = moment.utc();
    var today = todayMoment.toDate();

    if (!self.lockdown) {
      self.lockdown = clone(lockedFields);
    }
    console.log(self.lockdown)

    async.forEachOf(self.lockdown, function(value, fieldName, lockedFieldsCallback) {
      fieldName = fieldName.replace(uuid, '.');

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

      // update lockdown values
      // we only care if a locked field is modified
      if (!self.isModified(fieldName)) return lockedFieldsCallback();
      value.saves++;
      value.lastModified = today;

      // if the doc is new, don't need to check for lockdown
      if (self.isNew) return lockedFieldsCallback();

      var maxSaves = value.max;
      var numberOfSaves = value.saves;
      if (numberOfSaves > maxSaves) {
        // prevent the update
        return preventUpdate(self, value, fieldName, next);
      }

      return lockedFieldsCallback();
    }, function(err) {
      if (err) {
        return next(new Error(err));
      }
    });
    next();
  });

};

module.exports = lockdown;

/* HELPERS */

function preventUpdate(self, value, fieldName, next) {
  var message;
  if (value.errorMessage) {
    message = value.errorMessage;
  } else if (pluginOptions.errorMessage) {
    message = pluginOptions.errorMessage;
  } else {
    message = 'Error: \'' + fieldName + '\' has been locked.';
  }
  self.invalidate(fieldName, message);
  return next(new Error(message));
}
