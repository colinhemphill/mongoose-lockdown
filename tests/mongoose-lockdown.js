var mocha = require('mocha');
var should = require('should');
var mongoose = require('mongoose');
var lockdown = require('..');
var Schema = mongoose.Schema;

// make database connection
mongoose.connect('mongodb://localhost');
mongoose.connection.on('error', function(err) {
  console.error('MongoDB error: ' + err.message);
  console.error('Make sure a mongoDB server is running and accessible by this application.');
});

// create an example schema
var UserSchema = new Schema({
  name: {
    type: String,
    lockdown: true
  },
  email: {
    type: String,
    lockdown: 2
  },
  username: {
    type: String,
    lockdown: true,
    lockdownReset: {
      length: 1,
      period: 'seconds'
    }
  }
}).plugin(lockdown);
var User = mongoose.model('User', UserSchema);

describe('lockdown', function() {

  it('should not allow a save to the name', function(done) {
    var user1 = new User({
      name: 'bombsheltersoftware',
      username: 'thebomb',
      email: 'colin@thebomb.com'
    });
    user1.save(function(err) {
      should.not.exist(err);
      user1.name = 'Colin';
      user1.save(function(err) {
        should.exist(err);
        return done();
      });
    });
  });

  it('should allow a save to the username because the reset time period has passed', function(done) {
    var user2 = new User({
      name: 'Colin',
      username: 'thebomb',
      email: 'colin@thebomb.com'
    });
    user2.save(function(err) {
      should.not.exist(err);
      setTimeout(function() {
        user2.username = 'bombsheltersoftware';
        user2.save(function(err) {
          should.not.exist(err);
          return done();
        });
      }, 1200);
    });
  });

  it('should allow two saves on email then prevent the third', function(done) {
    var user3 = new User({
      name: 'Colin',
      username: 'thebomb',
      email: 'colin+1@bombsheltersoftware.com'
    });
    user3.save(function(err) {
      should.not.exist(err);
      user3.email = 'colin+2@bombsheltersoftware.com';
      user3.save(function(err) {
        should.not.exist(err);
        user3.email = 'colin+3@bombsheltersoftware.com';
        user3.save(function(err) {
          should.exist(err);
          return done();
        });
      });
    });
  });

});
