var mocha = require('mocha');
var should = require('should');
var mongoose = require('mongoose');
var lockdown = require('..');
var Schema = mongoose.Schema;

// make database connection
mongoose.connect('mongodb://localhost');
mongoose.connection.on('error', function(err) {
  console.error('MongoDB error: ' + err.message);
  console.error(
    'Make sure a mongoDB server is running and accessible by this application.',
  );
});

// create an example schema
var UserSchema = new Schema({
  name: {
    type: String,
    lockdown: true,
  },
  email: {
    type: String,
    lockdown: 2,
    lockdownMessage: 'TOO MANY EMAIL DUDE',
  },
  username: {
    type: String,
    lockdown: true,
    lockdownReset: {
      length: 1,
      period: 'seconds',
    },
  },
  outter: {
    inner: {
      type: String,
      lockdown: true,
    },
  },
  posts: [
    {
      title: {
        type: String,
        lockdown: true,
        lockdownDirect: true,
      },
    },
  ],
}).plugin(lockdown);
var User = mongoose.model('User', UserSchema);

describe('lockdown', function() {
  it('should not allow a save to the name', function(done) {
    var user1 = new User({
      name: 'bombsheltersoftware',
      username: 'thebomb',
      email: 'colin@thebomb.com',
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
      email: 'colin@thebomb.com',
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
      email: 'colin+1@bombsheltersoftware.com',
    });
    user3.save(function(err) {
      should.not.exist(err);
      user3.email = 'colin+2@bombsheltersoftware.com';
      user3.save(function(err) {
        should.not.exist(err);
        user3.email = 'colin+3@bombsheltersoftware.com';
        user3.save(function(err) {
          console.log(
            '\tSave prevented on email field. Should be a custom error message:',
          );
          console.error('\t' + err);
          should.exist(err);
          return done();
        });
      });
    });
  });

  it('should allow changes to posts, but not post titles', function(done) {
    var user4 = new User({
      name: 'bombsheltersoftware',
      username: 'thebomb',
      email: 'colin@thebomb.com',
      posts: [
        {
          title: 'First Post',
        },
      ],
    });
    user4.save(function(err) {
      should.not.exist(err);
      user4.posts.push({
        title: 'My Second Post',
      });
      user4.save(function(err) {
        should.not.exist(err);
        return done();
      });
    });
  });

  it('should not allow a save to an inner field', function(done) {
    var user5 = new User({
      name: 'bombsheltersoftware',
      username: 'thebomb',
      email: 'colin@thebomb.com',
      outter: {
        inner: 'i blew up before we supported `.`s in fieldname',
      },
      posts: [
        {
          title: 'First Post',
        },
      ],
    });
    user5.save(function(err) {
      should.not.exist(err);
      user5.outter.inner = 'new val';
      user5.save(function(err) {
        should.exist(err);
        return done();
      });
    });
  });
});
