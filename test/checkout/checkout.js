const expect = require('chai').expect;
const request = require('supertest');
const db = require('../../db/db');
const cartQueries = require('../../db/cartQueries');
const orderQueries = require('../../db/orderQueries');

const { assert } = require('chai');

function testCheckout(app) {

  describe("/carts/:id/checkout route and it's queries", function() {

    describe('test move cart to order components', function() {
      let testOrder;      
      let testTotal;
      const testQuantity = 5;      
      const testUserId = 2;
      const delTestOrderSqlCommand = `
        DELETE FROM orders
        WHERE user_id = ${testUserId}`;
      const delTestOrderItemsSqlCommand = `
        DELETE FROM order_items
        WHERE quantity = ${testQuantity};`
      const delTestCartSqlCommand = `
        DELETE FROM carts
        WHERE user_id = ${testUserId}`;
      const delTestCartItemsSqlCommand = `
        DELETE FROM cart_items
        WHERE quantity = ${testQuantity};`

      const testCart = {
        created: new Date("05/15/2023"),
        modified: new Date("05/15/2323"),
        user_id: testUserId
      }
      const testCartItems = [
        {
          product_id: 1,
          quantity: testQuantity,
          price_unit: 9.99
        },
        {
          product_id: 2,
          quantity: testQuantity,
          price_unit: 49.99
        },
        {
          product_id: 3,
          quantity: testQuantity,
          price_unit: 19.99
        },
      ];

      before('before test move cart to order components, remove data from prior test', async function() {        
        await db.query(delTestCartItemsSqlCommand);
        await db.query(delTestCartSqlCommand);
        await db.query(delTestOrderItemsSqlCommand);
        await db.query(delTestOrderSqlCommand);
      });

      before('before test move cart to order components, insert test cart', async function() {
        const sqlCommand = `
          INSERT INTO carts (created, modified, user_id) 
          VALUES ($1, $2, $3) 
          RETURNING *`;
        const { created, modified, user_id } = testCart;
        const rowValues = [created, modified, user_id];
        const response = await db.query(sqlCommand, rowValues);
        const returnedCart = response.rows[0];
        testCart.id = returnedCart.id;        
      });

      before('before test move cart to order components, insert test cart_items', async function() {
        const sqlCommand = `
          INSERT INTO cart_items (cart_id, product_id, quantity) 
          VALUES ($1, $2, $3) 
          RETURNING *`;
        try {
          for (let i = 0; i < testCartItems.length; i++) {
            const item = testCartItems[i];
            const {product_id, quantity } = item;
            const rowValues = [testCart.id, product_id, quantity];
            await db.query(sqlCommand, rowValues);
          }
          return testCartItems.length;
        } catch (error) {
          return error;
        }
      });

      after('after test orderQueries.insertOrdersItemsFromCartItems(), remove test data', async function() {
        await db.query(delTestCartItemsSqlCommand);
        await db.query(delTestCartSqlCommand);
        await db.query(delTestOrderItemsSqlCommand);
        await db.query(delTestOrderSqlCommand);
      });

      it('get total price for test cart', async function() {
        const price_1 = 9.99;
        const price_2 = 19.99;
        const price_3 = 49.99;
        const testPrice = (testQuantity * price_1) + (testQuantity * price_2) + (testQuantity * price_3);
        testTotal = await cartQueries.getCartTotalPrice(testCart.id);
        assert.equal(testTotal, testPrice);
      });

      it('insert 1 order from 1 cart', async function() {
        testOrder = await orderQueries.insertOrderFromCart(testCart, testTotal);
        assert.equal(testOrder.total_price, testTotal);
        assert.equal(testOrder.user_id, testCart.user_id);
      })

      it('insert orders_items rows from cart_items rows', async function() {
        const results = await orderQueries.insertOrdersItemsFromCartItems(testOrder.id, testCart.id);        
        assert.equal(results, testCartItems.length);
      });

      it('remove rows from cart_items', async function() {
        const results = await cartQueries.deleteCartItems(testCart.id);
        assert.equal(results, testCartItems.length)
      });

      it('remove row from carts', async function() {
        const results = await cartQueries.deleteCart(testCart.id); 
        assert.equal(results.status, 200);
        assert.equal(results.rowCount, 1);
      });
    });

    describe('test orderQueries.moveCartToOrder()', function() {
      let testOrder;
      const testQuantity = 5;      
      const testUserId = 2;
      const price_1 = 9.99;
      const price_2 = 19.99;
      const price_3 = 49.99;
      const testPrice = (testQuantity * price_1) + (testQuantity * price_2) + (testQuantity * price_3);
      const delTestOrderSqlCommand = `
        DELETE FROM orders
        WHERE user_id = ${testUserId}`;
      const delTestOrderItemsSqlCommand = `
        DELETE FROM order_items
        WHERE quantity = ${testQuantity};`
      const delTestCartSqlCommand = `
        DELETE FROM carts
        WHERE user_id = ${testUserId}`;
      const delTestCartItemsSqlCommand = `
        DELETE FROM cart_items
        WHERE quantity = ${testQuantity};`

      const testCart = {
        created: new Date("05/15/2023"),
        modified: new Date("05/15/2323"),
        user_id: testUserId
      }
      const testCartItems = [
        {
          product_id: 1,
          quantity: testQuantity,
          price_unit: 9.99
        },
        {
          product_id: 2,
          quantity: testQuantity,
          price_unit: 49.99
        },
        {
          product_id: 3,
          quantity: testQuantity,
          price_unit: 19.99
        },
      ];

      before('before test move cart to order components, remove data from prior test', async function() {        
        await db.query(delTestCartItemsSqlCommand);
        await db.query(delTestCartSqlCommand);
        await db.query(delTestOrderItemsSqlCommand);
        await db.query(delTestOrderSqlCommand);
      });

      before('before test move cart to order components, insert test cart', async function() {
        const sqlCommand = `
          INSERT INTO carts (created, modified, user_id) 
          VALUES ($1, $2, $3) 
          RETURNING *`;
        const { created, modified, user_id } = testCart;
        const rowValues = [created, modified, user_id];
        const response = await db.query(sqlCommand, rowValues);
        const returnedCart = response.rows[0];
        testCart.id = returnedCart.id;        
      });

      before('before test move cart to order components, insert test cart_items', async function() {
        const sqlCommand = `
          INSERT INTO cart_items (cart_id, product_id, quantity) 
          VALUES ($1, $2, $3) 
          RETURNING *`;
        try {
          for (let i = 0; i < testCartItems.length; i++) {
            const item = testCartItems[i];
            const {product_id, quantity } = item;
            const rowValues = [testCart.id, product_id, quantity];
            await db.query(sqlCommand, rowValues);
          }
          return testCartItems.length;
        } catch (error) {
          return error;
        }
      });

      after('after test move cart to order components, remove test data', async function() {
        await db.query(delTestCartItemsSqlCommand);
        await db.query(delTestCartSqlCommand);
        await db.query(delTestOrderItemsSqlCommand);
        await db.query(delTestOrderSqlCommand);
      });

      it('get test cart', async function() {
        const results = await cartQueries.getCart(testCart.id);
        assert.equal(results.status, 200);
        const getCart = results.cart;
        // now compare - use deepEqual for dates        
        assert.equal(getCart.id, testCart.id);
        assert.deepEqual(getCart.created, testCart.created);
        assert.deepEqual(getCart.modified, testCart.modified);
        assert.equal(getCart.user_id, testCart.user_id);
      })

      it('move cart to order', async function() {
        const results = await orderQueries.moveCartToOrder(testCart);
        assert.equal(results.status, 201);
        testOrder = results.order;
        assert.equal(testOrder.total_price, testPrice);
        assert.equal(testOrder.user_id, testUserId);  
      });

      it('correct number of new order items', async function() {
        const response = await request(app)
          .get(`/orders/${testOrder.id}/items`)
          .expect(200);
        assert.equal(response.body.length, testCartItems.length);
      });

      it('test cart items no longer in cart_items table', function() {
        return request(app)
          .get(`/carts/${testCart.id}/items`)
          .expect(404);
      });
  
      it('test cart no longer in carts table', function() {
        return request(app)
          .put(`/carts/${testCart.id}`)
          .send(testCart)
          .expect(404)
      });        
    });

    describe('POST /carts/:id/checkout', function() {
      let testOrder;
      const testQuantity = 5;      
      const testUserId = 2;
      const price_1 = 9.99;
      const price_2 = 19.99;
      const price_3 = 49.99;
      const testPrice = (testQuantity * price_1) + (testQuantity * price_2) + (testQuantity * price_3);
      const delTestOrderSqlCommand = `
        DELETE FROM orders
        WHERE user_id = ${testUserId}`;
      const delTestOrderItemsSqlCommand = `
        DELETE FROM order_items
        WHERE quantity = ${testQuantity};`
      const delTestCartSqlCommand = `
        DELETE FROM carts
        WHERE user_id = ${testUserId}`;
      const delTestCartItemsSqlCommand = `
        DELETE FROM cart_items
        WHERE quantity = ${testQuantity};`

      const testCart = {
        created: new Date("05/15/2023"),
        modified: new Date("05/15/2323"),
        user_id: testUserId
      }
      const testCartItems = [
        {
          product_id: 1,
          quantity: testQuantity,
          price_unit: 9.99
        },
        {
          product_id: 2,
          quantity: testQuantity,
          price_unit: 49.99
        },
        {
          product_id: 3,
          quantity: testQuantity,
          price_unit: 19.99
        },
      ];

      before('before test POST /carts/:id/checkout, remove data from prior test', async function() {        
        await db.query(delTestCartItemsSqlCommand);
        await db.query(delTestCartSqlCommand);
        await db.query(delTestOrderItemsSqlCommand);
        await db.query(delTestOrderSqlCommand);
      });

      before('before test POST /carts/:id/checkout, insert test cart', async function() {
        const sqlCommand = `
          INSERT INTO carts (created, modified, user_id) 
          VALUES ($1, $2, $3) 
          RETURNING *`;
        const { created, modified, user_id } = testCart;
        const rowValues = [created, modified, user_id];
        const response = await db.query(sqlCommand, rowValues);
        const returnedCart = response.rows[0];
        testCart.id = returnedCart.id;        
      });

      before('before test POST /carts/:id/checkout, insert test cart_items', async function() {
        const sqlCommand = `
          INSERT INTO cart_items (cart_id, product_id, quantity) 
          VALUES ($1, $2, $3) 
          RETURNING *`;
        try {
          for (let i = 0; i < testCartItems.length; i++) {
            const item = testCartItems[i];
            const {product_id, quantity } = item;
            const rowValues = [testCart.id, product_id, quantity];
            await db.query(sqlCommand, rowValues);
          }
          return testCartItems.length;
        } catch (error) {
          return error;
        }
      });

      after('after test POST /carts/:id/checkout, remove test data', async function() {
        await db.query(delTestCartItemsSqlCommand);
        await db.query(delTestCartSqlCommand);
        await db.query(delTestOrderItemsSqlCommand);
        await db.query(delTestOrderSqlCommand);
      });


      it('POST the new order from cart via checkout', async function() {
        const response = await request(app)
          .post(`/carts/${testCart.id}/checkout`)
          .send(testCart)
          .expect(201);
        testOrder = response.body;
        assert.equal(testOrder.total_price, testPrice);  
        assert.equal(testOrder.user_id, testUserId);  
      });

      it('correct number of new order items', async function() {
        const response = await request(app)
          .get(`/orders/${testOrder.id}/items`)
          .expect(200);
        assert.equal(response.body.length, testCartItems.length);
      });

      it('test cart items no longer in cart_items table', function() {
        return request(app)
          .get(`/carts/${testCart.id}/items`)
          .expect(404);
      });
  
      it('test cart no longer in carts table', function() {
        return request(app)
          .put(`/carts/${testCart.id}`)
          .send(testCart)
          .expect(404)
      });        

    });

  });
};

module.exports = testCheckout;

