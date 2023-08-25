const request = require('supertest');
const db = require('../../db/db');

const { assert } = require('chai');
const { response } = require('../..');

function testAuth(app) {

  describe('/auth routes', function() {

    // use password property, not password_hash property
    const newUser = {        
      "email": "greg@email.com",
      "password": "ABC123",
      "first_name": "Greg",
      "last_name": "Blue",
      "phone": "800 555-0000"
    };
    const duplicateUser = {        
      "email": "fred@email.com",
      "password": "123456",
      "first_name": "Fred",
      "last_name": "Green",
      "phone": "800 555-4321"
    };
    const logInUser = {        
      "email": newUser.email,
      "password": newUser.password
    };
    const invalidUser = {
      "email": 'invalid@gmail.com',
      "password": newUser.password
    }    
  
    after('remove newly registered user', function() {
      const sqlCommand = `DELETE FROM users WHERE id = ${newUser.id}`;
      const results = db.query(sqlCommand);      
    });
  
    describe('register valid new user', function() {
  
      before('remove registed user that might be left over from failed tests', async function() {
        const sqlCommand = `DELETE FROM users WHERE email = '${newUser.email}'`;
        await db.query(sqlCommand);
      });

      it('registers a new user with valid data', async function() {
        return await request(app)
          .post('/auth/register')
          .send(newUser)
          .expect(200)
          .then((response) => {
            const regUser = response.body;
            // do not check password_hash
            assert.equal(regUser.email, newUser.email);          
            assert.equal(regUser.first_name, newUser.first_name);
            assert.equal(regUser.last_name, newUser.last_name);
            assert.equal(regUser.phone, newUser.phone);
            // save new user id for other test
            newUser.id = regUser.id;
          });
      });
    });
  
    describe('register invalid new user', function() {
  
      it('do NOT register user with duplicate email', async function() {
        return await request(app)
          .post('/auth/register')
          .send(duplicateUser)
          .expect(409);
      });  
    });
  
    describe('login a user', function() {
  
      it('log in user with valid email and password', async function() {
        return await request(app)
          .post('/auth/login')
          .send(logInUser)
          .expect(302)
          .then((response) => {
            const redirect = response.text;
            assert.equal(redirect, "Found. Redirecting to /auth/profile");
          });
      });

    });

    describe('logout a user', function () {

      it('log out user', function () {
        return request(app)
          .get('/auth/logout')
          .expect(302)
          .then((response) => {
            const redirect = response.text;
            assert.equal(redirect, "Found. Redirecting to /auth/login");
          });
      });

    });

    describe('invalid login attempts', function () {

      it('cannot login with email not in database', async function () {
        return await request(app)
          .post('/auth/login')
          .send(invalidUser)
          .expect({});
      });
      
      it('cannot login with invalid password', async function() {
        invalidUser.email = newUser.email;
        invalidUser.password = 'INVALID';
        return await request(app)
          .post('/auth/login')
          .send(invalidUser)
          .expect({});
      });

    })
  
  });
  
};

module.exports = testAuth;
