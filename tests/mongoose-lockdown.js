var mocha = require('mocha');
var should = require('should');
var mongoose = require('mongoose');
var lockdown = require('..');
var Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost/mongooseLockdown');
mongoose.connection.on('error', function(err) {
  console.error('MongoDB error: ' + err.message);
  console.error('Make sure a mongoDB server is running and accessible by this application')
});

var LockdownTest = new Schema({
  email: {
    type: String,
    lockdown: true
  }
}).plugin(lockdown);
