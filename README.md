[![NPM version][npm-version-image]][npm-url] [![NPM downloads][npm-downloads-image]][npm-url] [![MIT License][license-image]][license-url] [![Build Status][travis-image]][travis-url]

# mongoose-lockdown

Install via npm:

    npm install --save mongoose-lockdown

## What Does it Do?

This module is a [Mongoose](http://mongoosejs.com/) plugin that sets a limit on how many times a field can be saved. Additionally, it allows for a reset time period, after which the field may be saved again.

## Usage

Require the plugin like so:

    var lockdown = require('mongoose-lockdown');

Then attack it to a schema declaration with ``.plugin(lockdown)``.

In your schema, indicate which fields should be locked down by giving the fields a ``lockdown: maxNumberOfSaves`` option:

    username: {
      type: String,
      lockdown: 3
    }

Using ``lockdown: true`` defaults to 1 save maximum. When a document is first created and a field is declared, this counts as the first save on that field. In other words, the default ``lockdown: 1`` will prevent any further changes to a field after that field is added to a document.

## Resets

If you want to prevent changes over a period of time, but allow changes after that time period expires, add a ``lockdownReset`` option to your locked field:

    username: {
      type: String,
      lockdown: true,
      lockdownReset: {
        length: 12,
        period: 'hours'
      }
    }

In the above, ``username`` cannot be changed in a given document for a period of 12 hours. You can use ``milliseconds``, ``seconds``, ``minutes``, ``hours``, ``days``, ``months``, and ``years``.

## Examples

#### Example with Max Save and Reset

    var UserSchema = new Schema({
      name: String,
      username: {
        type: String,
        lockdown: true
      },
      email: {
        type: String,
        lockdown: 3,
        lockdownReset: {
          length: 30,
          period: 'days'
        }
      }
    }).plugin(lockdown);

    var user = new User({
      name: 'Colin',
      username: 'bombsheltersoftware',
      email: 'colin@bombsheltersoftware.com'
    });
    user.save(function(err) {
      // this will create the document, so no validation error should occur
      user.username = 'thebomb';
      user.save(function(err) {
        // this should return a validation err, since username is locked down
      });
    });

In this example, as soon as ``user`` is first created, both ``username`` and ``email`` have been saved once. Since the max saves on ``username`` is ``1``, lockdown will prevent any further changes to that field. If we attempted to change the ``email`` a couple times, the changes would go through until the number of saves reached ``3``. However, if we waited until 30 days after the most recent save, the lockdown would reset, and saves would go through again. The reset would re-initialize the field so that again, only 3 saves could be performed before a reset is needed.

## Future Development

This plugin currently only works for Mongoose ``save()``, which is not triggered during queries such as ``update()`` and ``findOneAndUpdate()``. Mongoose 4.0 added distinct hooks for these queries, so we hope to add support for locking those types of updates shortly.

## Version History

* 0.1.0 Initial release.

[license-image]: http://img.shields.io/badge/license-MIT-blue.svg?style=flat-square
[license-url]: https://github.com/hemphillcc/mongoose-lockdown/blob/master/LICENSE

[npm-version-image]: http://img.shields.io/npm/v/mongoose-lockdown.svg?style=flat-square
[npm-downloads-image]: http://img.shields.io/npm/dm/mongoose-lockdown.svg?style=flat-square
[npm-url]: https://npmjs.org/package/mongoose-lockdown

[travis-image]: http://img.shields.io/travis/hemphillcc/mongoose-lockdown.svg?style=flat-square
[travis-url]: http://travis-ci.org/hemphillcc/mongoose-lockdown