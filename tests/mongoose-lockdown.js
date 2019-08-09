require('mocha');
const should = require('should');
const mongoose = require('mongoose');
const lockdown = require('..');
const Schema = mongoose.Schema;

// make database connection
mongoose.connect('mongodb://localhost', {
  useNewUrlParser: true,
  useMongoClient: true,
});
mongoose.connection.on('error', function(err) {
  console.error(
    'Make sure a mongoDB server is running and accessible by this application.',
  );
  throw err;
});

// create an example schema
const UserSchema = new Schema({
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

const User = mongoose.model('User', UserSchema);

describe('lockdown', function() {
  it('should not allow a save to the name', function(done) {
    const user1 = new User({
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
    const user2 = new User({
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
    const user3 = new User({
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
    let posts = [
      {
        title: 'First Post',
      },
    ];
    const user4 = new User({
      name: 'bombsheltersoftware',
      username: 'thebomb',
      email: 'colin@thebomb.com',
      posts: posts,
    });
    user4.save(function(err) {
      should.not.exist(err);
      posts = posts.concat([
        {
          title: 'My Second Post',
        },
      ]);
      user4.save(function(err) {
        should.not.exist(err);
        return done();
      });
    });
  });

  it('should not allow a save to an inner field', function(done) {
    const user5 = new User({
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
