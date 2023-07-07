const expect = require('chai').expect;
const request = require('supertest');
const db = require('../../db/db');
const cartQuieries = require('../../db/cartQueries');

const dbTools = require('../../db/dbTools');
const { assert } = require('chai');

const setupCartItems = require('./setupCartItems');
const cartItemsCount = setupCartItems.cartItemsCount;

const {
  cartItemsTableName,
  cartsForeignKeyName,
  cartProductIdForeignKeyName
} = require('../myConsts');

function testCartItems(app) {

  describe('/cart/items routes', function() {

    describe('setup cart_items table', function() {
      it('DROP cart_items table', async function() {
        await dbTools.dropTable(cartItemsTableName);
        const doesExist = await dbTools.tableExists(cartItemsTableName);      
        expect(doesExist).to.be.false;
      });

      it('CREATE cart_items', async function() {
        await setupCartItems.createCartItemsTable();
        const doesExist = await dbTools.tableExists(cartItemsTableName);      
        expect(doesExist).to.be.true;     
      });

      it('check for carts FOREIGN KEY', async function() {        
        const doesExist = await dbTools.foreignKeyExists(cartsForeignKeyName);      
        expect(doesExist).to.be.true;
      });

      it('check for products FOREIGN KEY', async function() {        
        const doesExist = await dbTools.foreignKeyExists(cartProductIdForeignKeyName);      
        expect(doesExist).to.be.true;
      });

      it('INSERT new cart items', async function() {
        const numInserted = await setupCartItems.insertAllCartItems(); 
        expect(numInserted).to.equal(cartItemsCount);
      });      
    });

    describe('cannot DELETE cart with cart_items', function() {
      let testCartId;
      let testItemId;
      const testQuantity = 5;
      const testUserId = 2;

      const resetCartItemsSqlCommand = `DELETE FROM cart_items WHERE quantity = ${testQuantity}`;
      const resetCartsSqlCommand = `DELETE FROM carts WHERE user_id = ${testUserId}`;

      before('before DELETE, delete test cart item from prior tests', async function() {
        await db.query(resetCartItemsSqlCommand);
      });

      before('before DELETE, delete test cart from prior tests', async function() {
        await db.query(resetCartsSqlCommand);
      });

      before('insert test cart', async function() {
        const cart = {
          created: new Date("02/22/2023"),
          modified: new Date("02/22/2323"),    
          user_id: testUserId
        }
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

      before('insert test cart items', async function() {
        const items =   {
          cart_id: testCartId,
          product_id: 3,
          quantity: testQuantity
        };
        const sqlCommand = `
          INSERT INTO cart_items (cart_id, product_id, quantity) 
          VALUES ($1, $2, $3) 
          RETURNING *`;
        const { cart_id, product_id, quantity } = items;
        const rowValues = [cart_id, product_id, quantity];
        const response = await db.query(sqlCommand, rowValues);
        const testItem = response.rows[0];
        testItemId = testItem.id;
      });

      after('delete test cart item', async function() {
        await db.query(resetCartItemsSqlCommand);
      });

      after('delete test cart', async function() {        
        await db.query(resetCartsSqlCommand);
      });

      it('test cart exists before DELETE cart', async function() {
        const sqlCommand = `SELECT * FROM carts WHERE id = ${testCartId}`;
        const response = await db.query(sqlCommand);
        const doesExist = response.rows.length === 1;
        expect(doesExist).to.be.true;
      });

      it('test cart item exists before DELETE cart', async function() {
        const sqlCommand = `SELECT * FROM cart_items WHERE id = ${testItemId}`;
        const response = await db.query(sqlCommand);
        const doesExist = response.rows.length === 1;
        expect(doesExist).to.be.true;
      });

      it('try to DELETE cart that has a cart_item(s)', async function() {
        return await request(app)
          .delete(`/carts/${testCartId}`)
          .expect(409); // constraint error
      });

    });

    describe('/GET /carts/:id/items', function() {
      const getCartId = 1;
      const countForGetCart = 2;

      it('returns an array', async function() {
        const response = await request(app)
          .get(`/carts/${getCartId}/items`)
          .expect(200);
        expect(response.body).to.be.an.instanceOf(Array);
      });

      it('returns an array of all cart_items', async function() {
        const response = await request(app)
          .get(`/carts/${getCartId}/items`)
          .expect(200);
        expect(response.body.length).to.be.equal(countForGetCart);
        response.body.forEach((cart) => {
          expect(cart).to.have.ownProperty('id');
          expect(cart).to.have.ownProperty('cart_id');
          expect(cart).to.have.ownProperty('product_id');
          expect(cart).to.have.ownProperty('quantity');
          expect(cart).to.have.ownProperty('name');
          expect(cart).to.have.ownProperty('model_number');
          expect(cart).to.have.ownProperty('description');
          expect(cart).to.have.ownProperty('price');
          expect(cart).to.have.ownProperty('item_total');
        });
      });

      it('returned cart items have the correct cart id', async function() {
        const response = await request(app)
          .get(`/carts/${getCartId}/items`)
          .expect(200);
        response.body.forEach((cartItem) => {
          expect(cartItem.cart_id).to.be.equal(getCartId);
        });
      });

      it('called with a non-numeric cart ID returns a 404 error', function() {
        return request(app)
          .get('/carts/ABC/items')
          .expect(404);
      });

      it('called with a invalid cart ID returns a 404 error', function() {
        return request(app)
          .get('/carts/1234567890/items')
          .expect(404);
      });

    });

    describe('GET /carts/:id/items/:itemId', function() {
      const getCartId = 1;
      const getItemId = 2;

      it('returns a single cart_item object', async function() {
        const response = await request(app)
          .get(`/carts/${getCartId}/items/${getItemId}`)
          .expect(200);
        const item = response.body;
        expect(item).to.be.an.instanceOf(Object);
        expect(item).to.not.be.an.instanceOf(Array);
      });

      it('returns a full cart_item object', async function() {
        const response = await request(app)
          .get(`/carts/${getCartId}/items/${getItemId}`)
          .expect(200);
        const item = response.body;
        expect(item).to.have.ownProperty('id');
        expect(item).to.have.ownProperty('cart_id');
        expect(item).to.have.ownProperty('product_id');
        expect(item).to.have.ownProperty('quantity');
      });

      it('returned cart_item has the correct id', async function() {
        const response = await request(app)
          .get(`/carts/${getCartId}/items/${getItemId}`)
          .expect(200);
        const item = response.body;
        expect(item.id).to.be.an.equal(getItemId);
      });

      it('called with a non-numeric cart item ID returns a 404 error', function() {
        return request(app)
          .get(`/carts/${getCartId}/items/ABC`)
          .expect(404);
      });

      it('called with a invalid cart item ID returns a 404 error', function() {
        return request(app)
          .get(`/carts/${getCartId}/items/1234567890`)
          .expect(404);
      });
    });

    describe('POST /carts/:id/items', function() {
      const cartId = 1;
      const nonExistantId = 1234;
      const postProductId = 2
      const newItem = {    
        product_id: postProductId,
        quantity: 3
      };
      const invalidItem = {    
        product_id: nonExistantId,  
        quantity: 5
      };

      const resetSqlCommand = `
        DELETE FROM cart_items
        WHERE product_id = ${postProductId};`

      before('before first POST test', async function() {
        await db.query(resetSqlCommand);
      })

      after('after last POST test', async function() {
        await db.query(resetSqlCommand);
      });

      it('post a new cart item with valid data', async function() {
        const response = await request(app)
          .post(`/carts/${cartId}/items`)
          .send(newItem)
          .expect(201);
        const postedItem = response.body;
        assert.equal(postedItem.cart_id, cartId);
        assert.equal(postedItem.product_id, newItem.product_id);
        assert.equal(postedItem.quantity, newItem.quantity);
      });

      it('did NOT post cart item with a non-existant cart_id', async function() {      
        return await request(app)
          .post(`/carts/${nonExistantId}/items`)
          .send(invalidItem)
          .expect(400);
      });

      it('did NOT post cart item with a non-existant product_id', async function() {      
        return await request(app)
          .post(`/carts/${cartId}/items`)
          .send(invalidItem)
          .expect(400);
      });

      it('did NOT post cart item with no product_id', async function() {      
        invalidItem.product_id = null;
        return await request(app)
          .post(`/carts/${cartId}/items`)
          .send(invalidItem)
          .expect(400);
      });

      it('did NOT post cart item with no quantity', async function() {      
        invalidItem.product_id = postProductId;
        invalidItem.quantity = null;
        return await request(app)
          .post(`/carts/${cartId}/items`)
          .send(invalidItem)
          .expect(400);
      });

    });

    describe('PUT /carts/:id/items/:itemId', function() {
      const putCartId = 1;
      const putItemId = 2;
      const resetSqlCommand = `
        UPDATE cart_items
        SET cart_id = 1, product_id = 4, quantity = 2
        WHERE id = 2;`;
      const testItem = {
        product_id: 1,
        quantity: 8
      }

      describe('Valid /carts/:id/items/:itemId', function() {

        before('before 1st PUT test', async function() {
          await db.query(resetSqlCommand);
        });

        afterEach('afterEach PUT test ', async function() {      
          await db.query(resetSqlCommand);
        });

        it('updates the correct cart_item and returns it', async function() {
          let initialItem;
          let updatedItem;

          const response = await request(app)
            .get(`/carts/${putCartId}/items/${putItemId}`);
          initialItem = response.body;
          updatedItem = Object.assign({}, testItem);
          updatedItem.cart_id = putCartId;
          const response_1 = await request(app)
            .put(`/carts/${putCartId}/items/${putItemId}`)
            .send(updatedItem)
            .expect(200);
          const resturnedItem = response_1.body;
          assert.equal(resturnedItem.id, putItemId);
          assert.equal(resturnedItem.cart_id, updatedItem.cart_id);
          assert.equal(resturnedItem.product_id, updatedItem.product_id);
          assert.equal(resturnedItem.quantity, updatedItem.quantity);
        });
      });

      describe('Invalid /carts/:id/items/:itemId', function() {
        const testItem = {
          product_id: 1,
          quantity: 4
        };

        it('called with a non-numeric cart item ID returns a 404 error', function() {
          return request(app)
            .put(`/carts/${putCartId}/items/ABC`)
            .send(testItem)
            .expect(404)
        });

        it('called with an non existing cart item ID returns a 404 error', function() {
          return request(app)
            .put(`/carts/${putCartId}/items/1234567890`)
            .send(testItem)
            .expect(404)
        });

        it('did not put with a missing product_id', async function() {
          const invalidItem = Object.assign({}, testItem);
          invalidItem.product_id = 1234;
          return await request(app)
            .put(`/carts/${putCartId}`)
            .send(invalidItem)
            .expect(400)
        });

        // other tests for missing data performed in POST tests 
        it('did not put with a missing product_id', async function() {
          const invalidItem = Object.assign({}, testItem);
          invalidItem.product_id = null;
          return await request(app)
            .put(`/carts/${putCartId}`)
            .send(invalidItem)
            .expect(400)
        });
      });
    });

    describe('DELETE /carts/:id/items/:itemId', function() {
      const testCartId = 1;
      const delProductId = 2;
      const toDelItem = {
        product_id: delProductId,
        quantity: 3
      };
      let delItemId;      

      before('before DELETE /carts/:id/items/:itemId tests', async function() {
        const sqlCommand = `
          INSERT INTO cart_items (cart_id, product_id, quantity) 
          VALUES ($1, $2, $3) RETURNING *`;
        const { product_id, quantity } = toDelItem;
        const rowValues = [testCartId, product_id, quantity];
        const response = await db.query(sqlCommand, rowValues);
        const postedItem = response.rows[0];
        delItemId = postedItem.id;        
      });

      describe('Valid DELETE /carts/:id/items/:itemId', function() {

        it('deletes a cart item', async function() {
          const response = await request(app)
            .delete(`/carts/${testCartId}/items/${delItemId}`)
            .expect(200)
          const itemId = parseInt(response.text);
          expect(itemId).to.equal(delItemId);
        });
      });

      describe('Invalid DELETE /carts/:id/items/:itemId', function() {

        it('called with a non-numeric cart ID returns a 404 error', function() {
          return request(app)
            .delete(`/carts/${testCartId}/items/ABC`)          
            .expect(404)
        });

        it('called with an non existing cart ID returns a 404 error', function() {
          return request(app)
            .delete(`/carts/${testCartId}/items/1234567890`)          
            .expect(404)
        });        
      });
    });

    describe('DELETE /carts/:id/allItems', function() {
      let testCartId;
      const testUserId = 2;
      const testQuantity = 5
      const toDelCart = {
        created: new Date("05/15/2023"),
        modified: new Date("05/15/2323"),    
        user_id: testUserId
      }
      const toDelItems = [
        {
          product_id: 1,
          quantity: testQuantity
        },
        {
          product_id: 2,
          quantity: testQuantity
        },
        {
          product_id: 3,
          quantity: testQuantity
        },
      ];
      const resetCartItemsSqlCommand = `DELETE FROM cart_items WHERE quantity = ${testQuantity}`;
      const resetCartsSqlCommand = `DELETE FROM carts WHERE user_id = ${testUserId}`;

      before('before DELETE /carts/:id/allItems, remove test cart_items from prior tests', async function() {
        await db.query(resetCartItemsSqlCommand);
      });

      before('before DELETE /carts/:id/allItems, remove test cart from prior test', async function() {        
        await db.query(resetCartsSqlCommand);
      });


      before('before DELETE /carts/:id/allItems, insert test cart', async function() {
        const sqlCommand = `
          INSERT INTO carts (created, modified, user_id) 
          VALUES ($1, $2, $3) 
          RETURNING *`;
        const { created, modified, user_id } = toDelCart;
        const rowValues = [created, modified, user_id];
        const response = await db.query(sqlCommand, rowValues);
        const testCart = response.rows[0];
        testCartId = testCart.id;
      });

      before('before DELETE /carts/:id/allItems, insert test cart_items', async function() {
        const sqlCommand = `
          INSERT INTO cart_items (cart_id, product_id, quantity) 
          VALUES ($1, $2, $3) 
          RETURNING *`;
        try {
          for (let i = 0; i < toDelItems.length; i++) {
            const item = toDelItems[i];
            const { product_id, quantity } = item;
            const rowValues = [testCartId, product_id, quantity];
            await db.query(sqlCommand, rowValues);
          }
          return toDelItems.length;
        } catch (error) {
          return error;
        }      
      });

      after('after DELETE /carts/:id/allItems, remove test cart_items', async function() {        
        await db.query(resetCartItemsSqlCommand);
      });

      after('after DELETE /carts/:id/allItems, remove test cart', async function() {        
        await db.query(resetCartsSqlCommand);
      });

      describe('Valid DELETE /carts/:id/allItems', function() {

        it('deletes all cart items from a cart', async function() {
          const response = await request(app)
            .delete(`/carts/${testCartId}/allItems`)
            .expect(200);
          const itemId = parseInt(response.text);
          expect(itemId).to.equal(testCartId);
        });

        it('called with an existing cart ID, but no cart items', async function() {
          const response = await request(app)
            .delete(`/carts/${testCartId}/allItems`)
            .expect(200);
          const itemId = parseInt(response.text);
          expect(itemId).to.equal(testCartId);
        });

        it('called with a non-existing cart ID, but no cart items', async function() {
          const nonExisting = 1234567890;
          const response = await request(app)
            .delete(`/carts/${nonExisting}/allItems`)
            .expect(200);
          const itemId = parseInt(response.text);
          expect(itemId).to.equal(nonExisting);
        });

      });

      describe('Invalid DELETE /carts/:id/allItems', function() {

        it('called with a non-numeric cart ID returns a 404 error', function() {
          return request(app)
            .delete(`/carts/ABC/allItems`)        
            .expect(404)
        });

      });
    });

  });

};

module.exports = testCartItems;