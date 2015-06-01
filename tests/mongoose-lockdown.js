var mocha = require('mocha');
var should = require('should');
var mongoose = require('mongoose');
var lockdown = require('..');
var Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost');
mongoose.connection.on('error', function(err) {
  console.error('MongoDB error: ' + err.message);
  console.error('Make sure a mongoDB server is running and accessible by this application')
});

var LockdownTest = mongoose.model('LockdownTest', new Schema({
  name: String,
  username: {
    type: String,
    lockdown: true
  },
  email: {
    type: String,
    lockdown: 5,
    lockdownReset: {
      length: 1,
      period: 'seconds'
    }
  }
}).plugin(lockdown));

var user = new LockdownTest;
user.name = 'Colin';
user.username = 'bombsheltersoftware';
user.email = 'colin@bombshelter.com';
user.save(function(err) {
  if (err) {
    console.error('Error on save 1.');
    console.error(err);
  }
});

setTimeout(function() {
  user.username = 'thebomb';
  user.email = 'colin@bombsheltersoftware.com';
  user.save(function(err) {
    if (err) {
      console.error('Error on save 2.');
      console.error(err);
    }
  });
}, 1200);
