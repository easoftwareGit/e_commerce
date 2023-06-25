// to run test 
// >npx mocha test
const expect = require('chai').expect;
const request = require('supertest');
const db = require('../db/db');

const setupUsers = require('./setupUsers');
const dbTools = require('../db/dbTools');

const app = require('../index');
const { assert } = require('chai');

const testUsers = require('./users');
const testAuth = require('./auth');
const testProducts = require('./products');

// testUsers(app);
// testAuth(app);
testProducts(app);

// const userCount = setupUsers.usersCount;

// describe('/user routes', function() {
  
//   describe('setup users table', function() {

//     const usersTableName = setupUsers.tableName;

//     it('DROP users', async function() {
//       await dbTools.dropTable(usersTableName);      
//       const doesExist = await dbTools.tableExists(usersTableName);      
//       expect(doesExist).to.be.false;
//     });

//     it('CREATE users', async function() {
//       await setupUsers.createUsersTable();
//       const doesExist = await dbTools.tableExists(usersTableName);      
//       expect(doesExist).to.be.true;
//     });

//     it('CREATE INDEX for users email', async function() {
//       await setupUsers.createUserEmailIndex();      
//       const doesExist = await dbTools.indexExists(setupUsers.user_email_index_name);
//       expect(doesExist).to.be.true;
//     });

//     it('INSERT new users', async function() {
//       const numInserted = await setupUsers.insertAllUsers(); 
//       expect(numInserted).to.equal(userCount);
//     });
//   });

//   describe('GET /users', function() {

//     it('returns an array', function() {
//       return request(app)
//         .get('/users')
//         .expect(200)
//         .then((response) => {
//           expect(response.body).to.be.an.instanceOf(Array);
//         });
//     });
      
//     it('returns an array of all users', function() {
//       return request(app)
//         .get('/users')
//         .expect(200)
//         .then((response) => {          
//           expect(response.body.length).to.be.equal(userCount);
//           response.body.forEach((user) => {
//             expect(user).to.have.ownProperty('id');
//             expect(user).to.have.ownProperty('password_hash');
//             expect(user).to.have.ownProperty('first_name');
//             expect(user).to.have.ownProperty('last_name');
//             expect(user).to.have.ownProperty('phone');
//           });
//         });
//     });
//   });

//   describe('GET /users/:id', function() {
//     const getUserId = 2;

//     it('returns a single user object', function() {
//       return request(app)
//         .get(`/users/${getUserId}`)
//         .expect(200)
//         .then((response) => {
//           const user = response.body;
//           expect(user).to.be.an.instanceOf(Object);
//           expect(user).to.not.be.an.instanceOf(Array);
//         });
//     });

//     it('returns a full user object', function() {
//       return request(app)
//         .get(`/users/${getUserId}`)
//         .expect(200)
//         .then((response) => {
//           const user = response.body;
//           expect(user).to.have.ownProperty('id');
//           expect(user).to.have.ownProperty('password_hash');
//           expect(user).to.have.ownProperty('first_name');
//           expect(user).to.have.ownProperty('last_name');
//           expect(user).to.have.ownProperty('phone');
//       });
//     });

//     it('returned user has the correct id', function() {
//       return request(app)
//       .get(`/users/${getUserId}`)
//       .expect(200)
//       .then((response) => {
//         const user = response.body;
//         expect(user.id).to.be.an.equal(getUserId);
//       });
//     });

//     it('called with a non-numeric ID returns a 404 error', function() {
//       return request(app)
//         .get('/users/ABC')
//         .expect(404);
//     });

//     it('called with a invalid ID returns a 404 error', function() {
//       return request(app)
//         .get('/users/1234567890')
//         .expect(404);
//     });
//   });

//   describe('PUT /users/:id', function() {
//     const putUserId = 2;
//     const resetSqlCommand = `
//       UPDATE users 
//       SET email = 'bill@gmail.com', password_hash = 'abcdef', first_name = 'Bill', last_name = 'Smith', phone = '800-555-5555'
//       WHERE id = 2;`

//     describe('Valid /users/:id', function() {
//       before('before 1st PUT test', function() {
//         db.query(resetSqlCommand);
//       });

//       afterEach('afterEach PUT test ', function() {      
//         db.query(resetSqlCommand);
//       });

//       it('updates the correct user and returns it', async function() {
//         let initialUser;
//         let updatedUser;      
        
//         return await request(app)
//           .get(`/users/${putUserId}`)
//           .then((response) => {          
//             initialUser = response.body;
//           })
//           .then(async () => {          
//             updatedUser = Object.assign({}, initialUser, {first_name: 'Bill'});
//             return await request(app)
//               .put(`/users/${putUserId}`)
//               .send(updatedUser)
//               .expect(200)
//           })
//           .then((response) => {
//             expect(response.body).to.be.deep.equal(updatedUser);
//           })
//       });
//     });

//     describe('Invalid PUT /users/:id', function() {
//       const testUser = {        
//         "email": "bob@email.com",
//         "password_hash": "zyxwvu",
//         "first_name": "Bob",
//         "last_name": "Jones",
//         "phone": "(800) 555-2211"      
//       };

//       it('called with a non-numeric ID returns a 404 error', function() {
//         return request(app)
//           .put('/users/ABC')
//           .send(testUser)
//           .expect(404);
//       })

//       it('called with an invalid ID returns a 404 error', function() {
//         return request(app)
//           .put('/users/1234567890')
//           .send(testUser)
//           .expect(404);
//       })
//     });

//   });

//   describe('POST /user', function() {

//     const newUser = {        
//       "email": "fred@email.com",
//       "password_hash": "123456",
//       "first_name": "Fred",
//       "last_name": "Green",
//       "phone": "800 555-4321"
//     };
//     const invalidUser = {
//       "password_hash": "123456",
//       "first_name": "Fred",
//       "last_name": "Green",
//       "phone": "800 555-4567"  
//     };

//     it('post a new user with valid data', async function() {
//       return await request(app)
//         .post('/users')
//         .send(newUser)
//         .expect(201)
//         .then((response) => {
//           const postedUser = response.body;
//           assert.equal(postedUser.email, newUser.email);
//           assert.equal(postedUser.password_hash, newUser.password_hash);
//           assert.equal(postedUser.first_name, newUser.first_name);
//           assert.equal(postedUser.last_name, newUser.last_name);
//           assert.equal(postedUser.phone, newUser.phone);
//         });
//     });

//     it('did NOT post user with a duplicate email', async function() {
//       return await request(app)
//         .post('/users')
//         .send(newUser)
//         .expect(404);
//     });

//     it('did NOT post user with no email', async function() {
//       return await request(app)
//         .post('/users')
//         .send(invalidUser)
//         .expect(404);
//     });

//     // it('did NOT post user with blank email', async function() {
//     //   invalidUser.email = '';
//     //   return await request(app)
//     //     .post('/users')
//     //     .send(invalidUser)
//     //     .expect(404);
//     // });

//     it('did NOT post user with blank password_hash', async function() {
//       invalidUser.email = 'invalid@email.com';
//       invalidUser.password_hash = null;
//       return await request(app)
//         .post('/users')
//         .send(invalidUser)
//         .expect(404);
//     });

//     it('did NOT post user with blank first_name', async function() {
//       invalidUser.password_hash = '123456';
//       invalidUser.first_name = null;
//       return await request(app)
//         .post('/users')
//         .send(invalidUser)
//         .expect(404);
//     });
    
//     it('did NOT post user with blank last_name', async function() {      
//       invalidUser.first_name = 'Fred';
//       invalidUser.last_name = null;
//       return await request(app)
//         .post('/users')
//         .send(invalidUser)
//         .expect(404);
//     });

//     it('did NOT post user with blank phone', async function() {            
//       invalidUser.last_name = 'Green';
//       invalidUser.phone = null;
//       return await request(app)
//         .post('/users')
//         .send(invalidUser)
//         .expect(404);
//     });

//   });

//   describe('DELETE /user/:id', function() {
//     const delUserId = 2;

//     describe('Valid /users/:id', function() {
      
//       it('deletes a user', function() {
//         return request(app)
//           .delete(`/users/${delUserId}`)
//           .expect(200)
//           .then((response) => {
//             const userId = parseInt(response.text);
//             expect(userId).to.equal(delUserId);
//           })
//       });      
//     });

//     describe('Invalid /users/:id', function() {

//       it('called with an user id that is not in database', function() {
//         return request(app)
//           .delete('/users/1234567890')
//           .expect(404);
//       });

//       it('called with a non-numeric user id', function() {
//         return request(app)
//           .delete('/users/ABC')
//           .expect(404);
//       });
//     });
//   });

// });



// describe('/auth routes', function() {

//   // use password property, not password_hash property
//   const newUser = {        
//     "email": "greg@email.com",
//     "password": "ABC123",
//     "first_name": "Greg",
//     "last_name": "Blue",
//     "phone": "800 555-0000"
//   };
//   const duplicateUser = {        
//     "email": "fred@email.com",
//     "password": "123456",
//     "first_name": "Fred",
//     "last_name": "Green",
//     "phone": "800 555-4321"
//   };
//   const logInUser = {        
//     "email": newUser.email,
//     "password": newUser.password
//   };
//   const invalidUser = {
//     "email": 'invalid@gmail.com',
//     "password": newUser.password
//   }    

//   after('remove newly registered user', function() {
//     const sqlCommand = `DELETE FROM users WHERE id = ${newUser.id}`;
//     const results = db.query(sqlCommand);
//     console.log(`DELETEd user ${results.text}`);
//   });

//   describe('register valid new user', function() {

//     before('remove registed user that might be left over from failed tests', async function() {
//       const sqlCommand = `DELETE FROM users WHERE email = '${newUser.email}'`;
//       await db.query(sqlCommand);
//     });

//     it('registers a new user with valid data', async function() {
//       return await request(app)
//         .post('/auth/register')
//         .send(newUser)
//         .expect(200)
//         .then((response) => {
//           const regUser = response.body;
//           // do not check password_hash
//           assert.equal(regUser.email, newUser.email);          
//           assert.equal(regUser.first_name, newUser.first_name);
//           assert.equal(regUser.last_name, newUser.last_name);
//           assert.equal(regUser.phone, newUser.phone);
//           // save new user id for other test
//           newUser.id = regUser.id;
//         });
//     });
//   });

//   describe('register invalid new user', function() {

//     it('do NOT register user with duplicate email', async function() {
//       return await request(app)
//         .post('/auth/register')
//         .send(duplicateUser)
//         .expect(409);
//     });  
//   });

//   describe('login a user', function() {

//     it('log in user with matching email and password', async function() {
//       return await request(app)
//         .post('/auth/login')
//         .send(logInUser)
//         .expect(200)
//         .then((response) => {
//           const logInId = response.body;
//           assert.equal(logInId, newUser.id);
//         });
//     });

//     it('cannot login with email not in database', async function() {
//       return await request(app)
//         .post('/auth/login')
//         .send(invalidUser)
//         .expect({});
//     });
    
//     it('cannot login with invalid password', async function() {
//       invalidUser.email = newUser.email;
//       invalidUser.password = 'INVALID';
//       return await request(app)
//         .post('/auth/login')
//         .send(invalidUser)
//         .expect({});
//     });

//   });

// });
