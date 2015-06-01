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
    lockdown: 2
  },
  email: {
    type: String,
    lockdown: true,
    lockdownResetAfter: 2,
    lockdownResetPeriod: 'days'
  }
}).plugin(lockdown));

var user = new LockdownTest;
user.name = 'Colin';
user.username = 'bombsheltersoftware';
user.email = 'colin@bombsheltersoftware.com';
user.save();
