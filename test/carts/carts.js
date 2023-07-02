const expect = require('chai').expect;
const request = require('supertest');
const db = require('../../db/db');

const dbTools = require('../../db/dbTools');
const { assert } = require('chai');

const setupCarts = require('./setupCarts');
const cartCount = setupCarts.cartCount;

const {
  cartsTableName,
  cartsUserIdForeignKeyName,
  cartItemsTableName
} = require('../myConsts');

function testCarts(app) {

  describe('/carts routes', function() {

    describe('setup carts table', function() {

      before('before setup carts, drop cart_items', async function() {
        const doesExist = await dbTools.tableExists(cartItemsTableName); 
        if (doesExist) {
          await dbTools.dropTable(cartItemsTableName);
        }
      });

      it('DROP carts', async function() {
        await dbTools.dropTable(cartsTableName);
        const doesExist = await dbTools.tableExists(cartsTableName);      
        expect(doesExist).to.be.false;
      });

      it('CREATE carts', async function() {
        await setupCarts.createCartsTable();
        const doesExist = await dbTools.tableExists(cartsTableName);      
        expect(doesExist).to.be.true;     
      });
      
      it('check for carts FOREIGN KEY', async function() {        
        const doesExist = await dbTools.foreignKeyExists(cartsUserIdForeignKeyName);      
        expect(doesExist).to.be.true;
      });

      it('INSERT new carts', async function() {
        const numInserted = await setupCarts.insertAllCarts(); 
        expect(numInserted).to.equal(cartCount);
      });            
    });

    describe('cannot DELETE users with a cart', function() {
      let testUserId;
      let testCartId;
      
      before('insert test user', async function() {
        const user = {  
          'email': 'greg@email.com',
          'password_hash': '098765',
          'first_name': 'Greg',
          'last_name': 'Blue',
          'phone': '800 555-8888'
        };        
        const sqlCommand = `
          INSERT INTO users (email, password_hash, first_name, last_name, phone) 
          VALUES ($1, $2, $3, $4, $5) 
          RETURNING *`;
        const { email, password_hash, first_name, last_name, phone } = user;
        const rowValues = [email, password_hash, first_name, last_name, phone];      
        const response = await db.query(sqlCommand, rowValues);
        const testUser = response.rows[0];
        testUserId = testUser.id;
      });

      before('insert test cart', async function() {
        const cart = {
          "created": new Date("06/26/2323"),
          "modified": new Date("06/26/2323"),    
          "user_id": testUserId
        };
        const sqlCommand = `
          INSERT INTO carts (created, modified, user_id) 
          VALUES ($1, $2, $3) 
          RETURNING *`;
        const { created, modified, user_id } = cart;
        const rowValues = [created, modified, user_id];
        const response = await db.query(sqlCommand, rowValues);
        const testCart = response.rows[0];
        testCartId = testCart.id;
      });

      after('delete test cart', async function() {    
        const sqlCommand = `DELETE FROM carts WHERE id = ${testCartId}`;    
        await db.query(sqlCommand);
      });

      after('delete test user', async function() {
        const sqlCommand = `DELETE FROM users WHERE id = ${testUserId}`;
        await db.query(sqlCommand);
      });

      it('test user exists before DELETE user', async function() {
        const sqlCommand = `SELECT * FROM users WHERE id = ${testUserId}`;
        const response = await db.query(sqlCommand);
        const doesExist = response.rows.length === 1;
        expect(doesExist).to.be.true;
      });

      it('test cart exists before DELETE user', async function() {
        const sqlCommand = `SELECT * FROM carts WHERE id = ${testCartId}`;
        const response = await db.query(sqlCommand);
        const doesExist = response.rows.length === 1;
        expect(doesExist).to.be.true;
      });

      it('try to DELETE user that has a cart', async function() {        
        return await request(app)
          .delete(`/users/${testUserId}`)
          .expect(409);   // constraint error
      });
    });

    describe('GET /carts', function() {

      it('returns an array', async function() {
        const response = await request(app)
          .get('/carts')
          .expect(200);
        expect(response.body).to.be.an.instanceOf(Array);
      });

      it('returns an array of all carts', async function() {
        const response = await request(app)
          .get('/carts')
          .expect(200);
        expect(response.body.length).to.be.equal(cartCount);
        response.body.forEach((cart) => {
          expect(cart).to.have.ownProperty('id');
          expect(cart).to.have.ownProperty('created');
          expect(cart).to.have.ownProperty('modified');
          expect(cart).to.have.ownProperty('user_id');
        });
      });
    });

    describe('GET /carts/:id', function() {
      const getCartId = 2;

      it('returns a single cart object', async function() {
        const response = await request(app)
          .get(`/carts/${getCartId}`)
          .expect(200);
        const cart = response.body;
        expect(cart).to.be.an.instanceOf(Object);
        expect(cart).to.not.be.an.instanceOf(Array);
      });

      it('returns a full cart object', async function() {
        const response = await request(app)
          .get(`/carts/${getCartId}`)
          .expect(200);
        const cart = response.body;
        expect(cart).to.have.ownProperty('id');
        expect(cart).to.have.ownProperty('created');
        expect(cart).to.have.ownProperty('modified');
        expect(cart).to.have.ownProperty('user_id');
      });

      it('returned cart has the correct id', async function() {
        const response = await request(app)
          .get(`/carts/${getCartId}`)
          .expect(200);
        const cart = response.body;
        expect(cart.id).to.be.an.equal(getCartId);
      });

      it('called with a non-numeric ID returns a 404 error', function() {
        return request(app)
          .get('/carts/ABC')
          .expect(404);
      });

      it('called with a invalid ID returns a 404 error', function() {
        return request(app)
          .get('/carts/1234567890')
          .expect(404);
      });
    });

    describe('POST /carts', function() {
      const newCart = {
        "created": new Date("05/29/2323"),
        "modified": new Date("05/29/2323"),    
        "user_id": 5
      };
      const invalidCart = {
        "modified": new Date("05/29/2323"),    
        "user_id": 5
      };
      const resetSqlCommand = `
        DELETE FROM orders
        WHERE user_id = 5;`

      before('before first POST test', async function() {
        await db.query(resetSqlCommand);
      });

      after('after last POST test', async function() {
        await db.query(resetSqlCommand);
      });
  
      it('post a new cart with valid data', async function() {
        const response = await request(app)
          .post('/carts')
          .send(newCart)
          .expect(201);
        const postedCart = response.body;
        // convert json date strings to dates
        postedCart.created = new Date(postedCart.created);
        postedCart.modified = new Date(postedCart.modified);
        // now compare - use deepEqual for dates
        assert.deepEqual(postedCart.created, newCart.created);
        assert.deepEqual(postedCart.modified, newCart.modified);
        assert.equal(postedCart.user_id, newCart.user_id);
      });

      it('did NOT post cart with a duplicate user_id', async function() {
        return await request(app)
          .post('/carts')
          .send(newCart)
          .expect(404);
      });

      it('did NOT post cart with no created', async function() {
        return await request(app)
          .post('/carts')
          .send(invalidCart)
          .expect(404);
      });

      it('did NOT post cart with no user_id', async function() {        
        invalidCart.modified = invalidCart.created;
        invalidCart.user_id = null;
        return await request(app)
          .post('/carts')
          .send(invalidCart)
          .expect(404);
      });
    });

    describe('PUT /carts/:id', function() {
      const putCartId = 2;      
      const resetSqlCommand = `
        UPDATE carts 
        SET created = '01/03/2023', modified = '01/04/2023'
        WHERE id = 2;`;
      // in testCart: make sure to set created to correct date in carts table
      const testCart = {                
        created: new Date('01/03/23'),
        modified: new Date('05/26/23'),
        user_id: 3
      };
  
      describe('Valid /carts/:id', function() {

        before('before 1st PUT test', async function() {
          await db.query(resetSqlCommand);
        });
  
        afterEach('afterEach PUT test ', async function() {      
          await db.query(resetSqlCommand);
        });

        it('updates the correct cart and returns it', async function() {
          let initialCart;
          let updatedCart;      

          const response = await request(app)
            .get(`/carts/${putCartId}`);
          initialCart = response.body;
          updatedCart = Object.assign({}, testCart);
          const response_1 = await request(app)
            .put(`/carts/${putCartId}`)
            .send(updatedCart)
            .expect(200);
          const returnedCart = response_1.body;
          // convert json date strings to dates
          returnedCart.created = new Date(returnedCart.created);
          returnedCart.modified = new Date(returnedCart.modified);
          // now compare - use deepEqual for dates
          assert.equal(returnedCart.id, putCartId);          
          assert.deepEqual(returnedCart.created, updatedCart.created);
          assert.deepEqual(returnedCart.modified, updatedCart.modified);
          assert.equal(returnedCart.user_id, updatedCart.user_id);
        });
      });
      
      describe('Invalid /carts/:id', function() {
  
        it('called with a non-numeric ID returns a 404 error', function() {
          return request(app)
            .put('/carts/ABC')
            .send(testCart)
            .expect(404)
        });

        it('called with an non existing ID returns a 404 error', function() {
          return request(app)
            .put('/carts/1234567890')
            .send(testCart)
            .expect(404)
        });        

        it('did not PUT duplicate user-id value', function() {          
          const putDuplicateUserId = 4;
          const duplicateCart = Object.assign({}, testCart);
          duplicateCart.user_id = putDuplicateUserId;
          return request(app)
            .put(`/carts/${putCartId}`)
            .send(duplicateCart)
            .expect(404)
        });

        // other tests for missing data performed in POST tests        
        it('did not PUT with with no modified date', function() {
          const missingDataCart = Object.assign({}, testCart);
          missingDataCart.modified = null;
          return request(app)
            .put(`/carts/${putCartId}`)
            .send(missingDataCart)
            .expect(404)
        });
      });
    });
    
    describe('DELETE /carts/:id', function() {
      const testUserId = 6; // +1 from userId from POST test 
      const toDelCart = {
        "created": new Date("06/26/2323"),
        "modified": new Date("06/26/2323"),    
        "user_id": testUserId
      };
      let delCartId;

      before('before DELETE tests', async function() {
        const response = await request(app)
          .post('/carts')
          .send(toDelCart);
        const postedCart = response.body;
        delCartId = postedCart.id;
      });

      describe('Valid DELETE /carts/:id', function() {

        it('deletes a cart', async function() {
          const response = await request(app)
            .delete(`/carts/${delCartId}`)
            .expect(200);
          const cartId = parseInt(response.text);
          expect(cartId).to.equal(delCartId);
        });
      });

      describe('Invalid DELETE /carts/:id', function() {

        it('called with a non-numeric cart id', function() {
          return request(app)
            .delete('/carts/ABC')
            .expect(404);
        });

        it('called with a carts id that is not in database', function() {
          return request(app)
            .delete('/carts/1234567890')
            .expect(404);
        });
      });
    });

  });

};

module.exports = testCarts;