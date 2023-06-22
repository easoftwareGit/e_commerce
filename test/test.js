// to run test 
// >npx mocha test
const expect = require('chai').expect;
const request = require('supertest');
const db = require('../db/db');

const app = require('../index');

describe('/user routes', function() {

  describe('GET /users', function() {

    it('returns an array', function() {
      return request(app)
        .get('/users')
        .expect(200)
        .then((response) => {
          expect(response.body).to.be.an.instanceOf(Array);
        });
    });
      
    it('returns an array of all users', function() {
      return request(app)
        .get('/users')
        .expect(200)
        .then((responce) => {
          const numUsers = 5;
          expect(responce.body.length).to.be.equal(numUsers);
          responce.body.forEach((user) => {
            expect(user).to.have.ownProperty('id');
            expect(user).to.have.ownProperty('password_hash');
            expect(user).to.have.ownProperty('first_name');
            expect(user).to.have.ownProperty('last_name');
            expect(user).to.have.ownProperty('phone');
          });
        });
    })
  });

  describe('GET /users/:id', function() {

    it('returns a single user object', function() {
      return request(app)
        .get('/users/2')
        .expect(200)
        .then((responce) => {
          const user = responce.body;
          expect(user).to.be.an.instanceOf(Object);
          expect(user).to.not.be.an.instanceOf(Array);
        });
    });

    it('returns a full user object', function() {
      return request(app)
        .get('/users/2')
        .expect(200)
        .then((responce) => {
          const user = responce.body;
          expect(user).to.have.ownProperty('id');
          expect(user).to.have.ownProperty('password_hash');
          expect(user).to.have.ownProperty('first_name');
          expect(user).to.have.ownProperty('last_name');
          expect(user).to.have.ownProperty('phone');
      });
    });

    it('returned user has the correct id', function() {
      return request(app)
      .get('/users/2')
      .expect(200)
      .then((responce) => {
        const user = responce.body;
        expect(user.id).to.be.an.equal(2);
      });
    });

    it('called with a non-numeric ID returns a 404 error', function() {
      return request(app)
        .get('/users/ABC')
        .expect(404);
    });

    it('called with a invalid ID returns a 404 error', function() {
      return request(app)
        .get('/users/1234567890')
        .expect(404);
    });

  });

  describe('PUT /users/:id', function() {
    const putUserId = 2;
    const resetSqlCommand = `
      UPDATE users 
      SET email = 'bill@gmail.com', password_hash = 'abcdef', first_name = 'bill', last_name = 'smith', phone = '800-555-5555'
      WHERE id = 2;`

    describe('Valid /users/:id', function() {
      before('before 1st PUT test', function() {
        db.query(resetSqlCommand);
      });

      afterEach('afterEach PUT test ', function() {      
        db.query(resetSqlCommand);
      });

      it('updates the correct user and returns it', async function() {
        let initialUser;
        let updatedUser;      
        
        return await request(app)
          .get(`/users/${putUserId}`)
          .then((responce) => {          
            initialUser = responce.body;
          })
          .then(async () => {          
            updatedUser = Object.assign({}, initialUser, {first_name: 'Bill'});
            return await request(app)
              .put(`/users/${putUserId}`)
              .send(updatedUser)
              .expect(200)
          })
          .then((response) => {
            expect(response.body).to.be.deep.equal(updatedUser);
          })
      });
    });

    describe('Invalid PUT /users/:id', function() {

      const testUser = {        
        "email": "bob@email.com",
        "password_hash": "zyxwvu",
        "first_name": "Bob",
        "last_name": "Jones",
        "phone": "(800) 555-2211"      
      }

      it('called with a non-numeric ID returns a 404 error', function() {
        return request(app)
          .put('/users/ABC')
          .send(testUser)
          .expect(404);
      })

      it('called with an invalid ID returns a 404 error', function() {
        return request(app)
          .put('/users/1234567890')
          .send(testUser)
          .expect(404);
      })
    });

  });

});

