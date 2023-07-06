const expect = require('chai').expect;
const request = require('supertest');
const db = require('../../db/db');
const orderQueries = require('../../db/orderQueries');
const cartQueries = require('../../db/cartQueries');

const dbTools = require('../../db/dbTools');
const { assert } = require('chai');

const setupOrderItems = require('./setupOrderItems');
const orderItemsCount = setupOrderItems.orderItemsCount;

const {
  orderItemsTableName,  
  ordersForeignKeyName, 
  ordersProductsIdForeignKeyName
} = require('../myConsts');

function testOrderItems(app) {

  describe('/orders/items routes', function() {

    describe('setup order_items table', function() {

      it('DROP order_items table', async function() {
        await dbTools.dropTable(orderItemsTableName);
        const doesExist = await dbTools.tableExists(orderItemsTableName);      
        expect(doesExist).to.be.false;
      });

      it('CREATE order_items', async function() {
        await setupOrderItems.createOrderItemsTable();
        const doesExist = await dbTools.tableExists(orderItemsTableName);      
        expect(doesExist).to.be.true;     
      });

      it('check for orders FOREIGN KEY', async function() {        
        const doesExist = await dbTools.foreignKeyExists(ordersForeignKeyName);      
        expect(doesExist).to.be.true;
      });

      it('check for products FOREIGN KEY', async function() {        
        const doesExist = await dbTools.foreignKeyExists(ordersProductsIdForeignKeyName);      
        expect(doesExist).to.be.true;
      });

      it('INSERT new order items', async function() {
        const numInserted = await setupOrderItems.insertAllOrderItems(); 
        expect(numInserted).to.equal(orderItemsCount);
      });      

    });

    describe('test orderQueries.createOrderItems()', function() {
      let testOrderId;
      let priorTestOrderId
      const testQuantity = 5;
      const testUserId = 1
      const delTestOrderSqlCommand = `
        DELETE FROM orders
        WHERE user_id = ${testUserId}`;
      const delTestOrderItemsSqlCommand = `
        DELETE FROM order_items
        WHERE quantity = ${testQuantity};`

      before('check orders leftover from prior tests', async function() {
        const sqlCommand = `SELECT * FROM orders WHERE user_id = $1`;
        const results = await db.query(sqlCommand, [testUserId]);
        if (db.validResultsAtLeast1Row(results)) {
          priorTestOrderId = results.rows[0].id;
        }
      });

      before('remove test order items from prior tests', async function() {
        await db.query(delTestOrderItemsSqlCommand);
      });

      before('remove test order from prior tests', async function() {
        await db.query(delTestOrderSqlCommand);
      });

      before('insert test order', async function() {
        const dateNow = new Date(Date.now());
        const order = {
          created: dateNow,
          modified: dateNow,    
          status: 'Created',
          total_price: 42.95,
          user_id: testUserId
        };
        const sqlCommand = `
          INSERT INTO orders (created, modified, status, total_price, user_id) 
          VALUES ($1, $2, $3, $4, $5) 
          RETURNING *`;
        const { created, modified, status, total_price, user_id } = order;
        const rowValues = [created, modified, status, total_price, user_id];
        const response = await db.query(sqlCommand, rowValues);
        const testOrder = response.rows[0];
        testOrderId = testOrder.id;        
      });

      after('after orderQueries.createOrderItems(), remove test order items', async function() {
        await db.query(delTestOrderItemsSqlCommand);
      });

      after('after orderQueries.createOrderItems(), remove test order', async function() {
        await db.query(delTestOrderSqlCommand);
      });

      it('test orderQueries.createOrderItems()', async function() {
        const testItems = [
          {            
            product_id: 1,
            quantity: testQuantity,
            price_unit: 9.99
          },
          {           
            product_id: 2,
            quantity: testQuantity,
            price_unit: 19.99
          },
          {           
            product_id: 4,
            quantity: testQuantity,
            price_unit: 3.99
          }
        ];
        try {
          const results = await orderQueries.createOrderItems(testOrderId, testItems);
          const createdItems = results.orderItems;          
          assert.equal(createdItems.length, testItems.length);
          for (let i = 0; i < testItems.length; i++) {
            const testItem = testItems[i];
            const createdItemArray = createdItems.filter(item => item.product_id === testItem.product_id);
            const createdItem = createdItemArray[0];
            assert.equal(createdItem.order_id, testOrderId);
            assert.equal(createdItem.product_id, testItem.product_id);
            assert.equal(createdItem.quantity, testItem.quantity);
            assert.equal(createdItem.price_unit, testItem.price_unit);              
          }
        } catch (err) {
          throw Error(err);
        }

      });
    })

    describe('cannot DELETE order with order_items', function() {
      let testOrderId;    

      before('insert test order', async function() {
        const order = {
          created: new Date("03/13/2023"),
          modified: new Date("03/13/2023"),    
          status: 'Created',
          total_price: 39.97,
          user_id: 5
        };
        const sqlCommand = `
          INSERT INTO orders (created, modified, status, total_price, user_id) 
          VALUES ($1, $2, $3, $4, $5) 
          RETURNING *`;
        const { created, modified, status, total_price, user_id } = order;
        const rowValues = [created, modified, status, total_price, user_id];
        const response = await db.query(sqlCommand, rowValues);
        const testOrder = response.rows[0];
        testOrderId = testOrder.id;        
      });

      before('insert test order items', async function() {
        const items = [
          {
            order_id: testOrderId,
            product_id: 1,
            quantity: 2,
            price_unit: 19.98
          },
          {
            order_id: testOrderId,
            product_id: 2,
            quantity: 1,
            price_unit: 19.99
          }
        ];  
        const sqlCommand = `
          INSERT INTO order_items (order_id, product_id, quantity, price_unit) 
          VALUES ($1, $2, $3, $4) 
          RETURNING *`;
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const { order_id, product_id, quantity, price_unit } = item;
          const rowValues = [order_id, product_id, quantity, price_unit];
          await db.query(sqlCommand, rowValues);
        }
      });

      after('delete test order items', async function() {
        const sqlCommand = `DELETE FROM order_items WHERE order_id = ${testOrderId}`;
        await db.query(sqlCommand);
      });

      after('delete test order', async function() {
        const sqlCommand = `DELETE FROM orders WHERE id = ${testOrderId}`;
        await db.query(sqlCommand);
      });

      it('test order exists before DELETE order', async function() {
        const sqlCommand = `SELECT * FROM orders WHERE id = ${testOrderId}`;
        const response = await db.query(sqlCommand);
        const doesExist = response.rows.length === 1;
        expect(doesExist).to.be.true;
      });

      it('test order items exist before DELETE order', async function() {
        const itemsCount = 2;
        const sqlCommand = `SELECT * FROM order_items WHERE order_id = ${testOrderId}`;
        const response = await db.query(sqlCommand);
        const doesExist = response.rows.length === itemsCount;
        expect(doesExist).to.be.true;
      });

      it('try to DELETE order that has order_item(s)', async function() {
        return await request(app)
          .delete(`/orders/${testOrderId}`)
          .expect(409); // constraint error
      });

    });

    describe('/GET /orders/:id/items', function() {
      const getOrderId = 1;
      const countForGetOrder = 2;

      it('returns an array', async function() {
        const response = await request(app)
          .get(`/orders/${getOrderId}/items`)
          .expect(200);
        expect(response.body).to.be.an.instanceOf(Array);
      });

      it('returns an array of all order_items', async function() {
        const response = await request(app)
          .get(`/orders/${getOrderId}/items`)
          .expect(200);
        expect(response.body.length).to.be.equal(countForGetOrder);
        response.body.forEach((order) => {
          expect(order).to.have.ownProperty('id');
          expect(order).to.have.ownProperty('order_id');
          expect(order).to.have.ownProperty('product_id');
          expect(order).to.have.ownProperty('quantity');
          expect(order).to.have.ownProperty('price_unit');
          expect(order).to.have.ownProperty('name');
          expect(order).to.have.ownProperty('model_number');
          expect(order).to.have.ownProperty('description');        
          expect(order).to.have.ownProperty('item_total');
        });
      });

      it('returned order items have the correct order id', async function() {
        const response = await request(app)
          .get(`/orders/${getOrderId}/items`)
          .expect(200);
        response.body.forEach((orderItem) => {
          expect(orderItem.order_id).to.be.equal(getOrderId);
        });
      });

      it('called with a non-numeric order ID returns a 404 error', function() {
        return request(app)
          .get('/orders/ABC/items')
          .expect(404);
      });

      it('called with a invalid order ID returns a 404 error', function() {
        return request(app)
          .get('/orders/1234567890/items')
          .expect(404);
      });

    });

    describe('GET /orders/:id/items/:itemId', function() {
      const getOrderId = 1;
      const getItemId = 2;

      it('returns a single order_item object', async function() {
        const response = await request(app)
          .get(`/orders/${getOrderId}/items/${getItemId}`)
          .expect(200);
        const item = response.body;
        expect(item).to.be.an.instanceOf(Object);
        expect(item).to.not.be.an.instanceOf(Array);
      });

      it('returns a full order_item object', async function() {
        const response = await request(app)
          .get(`/orders/${getOrderId}/items/${getItemId}`)
          .expect(200);
        const item = response.body;
        expect(item).to.have.ownProperty('id');
        expect(item).to.have.ownProperty('order_id');
        expect(item).to.have.ownProperty('product_id');
        expect(item).to.have.ownProperty('quantity');
        expect(item).to.have.ownProperty('price_unit');
      });

      it('returned order_item has the correct id', async function() {
        const response = await request(app)
          .get(`/orders/${getOrderId}/items/${getItemId}`)
          .expect(200);
        const item = response.body;
        expect(item.id).to.be.an.equal(getItemId);
      });

      it('called with a non-numeric order item ID returns a 404 error', function() {
        return request(app)
          .get(`/orders/${getOrderId}/items/ABC`)
          .expect(404);
      });

      it('called with a invalid order item ID returns a 404 error', function() {
        return request(app)
          .get(`/orders/${getOrderId}/items/1234567890`)
          .expect(404);
      });
    });

    describe('POST /orders/:id/items', function() {
      const orderId = 1;
      const nonExistantId = 1234;
      const postProductId = 2
      const newItem = {    
        product_id: postProductId,      
        quantity: 3,
        price_unit: 19.99
      };
      const invalidItem = {    
        product_id: nonExistantId,  
        quantity: 5,
        price_unit: 19.99
      };

      const resetSqlCommand = `
        DELETE FROM order_items
        WHERE product_id = ${postProductId};`

      before('before first POST test', async function() {
        await db.query(resetSqlCommand);
      })

      after('after last POST test', async function() {
        await db.query(resetSqlCommand);
      });

      it('post a new order item with valid data', async function() {
        const response = await request(app)
          .post(`/orders/${orderId}/items`)
          .send(newItem)
          .expect(201);
        const postedItem = response.body;
        assert.equal(postedItem.order_id, orderId);
        assert.equal(postedItem.product_id, newItem.product_id);
        assert.equal(postedItem.quantity, newItem.quantity);
        assert.equal(postedItem.price_unit, newItem.price_unit);
      });
    
      it('did NOT post order item with a non-existant order_id', async function() {
        return await request(app)
          .post(`/orders/${nonExistantId}/items`)
          .send(invalidItem)
          .expect(400);
      });

      it('did NOT post order item with a non-existant product_id', async function() {
        return await request(app)
          .post(`/orders/${orderId}/items`)
          .send(invalidItem)
          .expect(400);
      });

      it('did NOT post order item with no product_id', async function() {
        invalidItem.product_id = null;
        return await request(app)
          .post(`/orders/${orderId}/items`)
          .send(invalidItem)
          .expect(400);
      });

      it('did NOT post order item with no quantity', async function() {
        invalidItem.product_id = postProductId;
        invalidItem.quantity = null;
        return await request(app)
          .post(`/orders/${orderId}/items`)
          .send(invalidItem)
          .expect(400);
      });

      it('did NOT post order item with no price_unit', async function() {      
        invalidItem.quantity = 5;
        invalidItem.price_unit = null;
        return await request(app)
          .post(`/orders/${orderId}/items`)
          .send(invalidItem)
          .expect(400);
      });

    });

    describe('PUT /orders/:id/items/:itemId', function() {
      const putOrderId = 1;
      const putItemId = 2;
      const resetSqlCommand = `
        UPDATE order_items
        SET order_id = 1, product_id = 4, quantity = 1, price_unit = 3.99
        WHERE id = 2;`;
      const testItem = {
        product_id: 3,
        quantity: 8,
        price_unit: 49.99
      }

      describe('Valid /orders/:id/items/:itemId', function() {

        before('before 1st PUT test', async function() {
          await db.query(resetSqlCommand);
        });

        afterEach('afterEach PUT test ', async function() {      
          await db.query(resetSqlCommand);
        });

        it('updates the correct order_item and returns it', async function() {
          let initialItem;
          let updatedItem;

          const response = await request(app)
            .get(`/orders/${putOrderId}/items/${putItemId}`);
          initialItem = response.body;
          updatedItem = Object.assign({}, testItem);
          updatedItem.order_id = putOrderId;
          const response_1 = await request(app)
            .put(`/orders/${putOrderId}/items/${putItemId}`)
            .send(updatedItem)
            .expect(200);
          const resturnedItem = response_1.body;
          assert.equal(resturnedItem.id, putItemId);
          assert.equal(resturnedItem.order_id, updatedItem.order_id);
          assert.equal(resturnedItem.product_id, updatedItem.product_id);
          assert.equal(resturnedItem.quantity, updatedItem.quantity);
          assert.equal(resturnedItem.price_unit, updatedItem.price_unit);
        });
      });

      describe('Invalid /orders/:id/items/:itemId', function() {
        const testItem = {
          product_id: 1,
          quantity: 4,
          price_unit: 3.99
        };

        it('called with a non-numeric order item ID returns a 404 error', function() {
          return request(app)
            .put(`/orders/${putOrderId}/items/ABC`)
            .send(testItem)
            .expect(404)
        });

        it('called with an non existing order item ID returns a 404 error', function() {
          return request(app)
            .put(`/orders/${putOrderId}/items/1234567890`)
            .send(testItem)
            .expect(404)
        });

        it('did not put with a invalid product_id', async function() {
          const invalidItem = Object.assign({}, testItem);
          invalidItem.product_id = 1234;
          return await request(app)
            .put(`/orders/${putOrderId}`)
            .send(invalidItem)
            .expect(400)
        });

        // other tests for missing data performed in POST tests 
        it('did not put with a missing product_id', async function() {
          const invalidItem = Object.assign({}, testItem);
          invalidItem.product_id = null;
          return await request(app)
            .put(`/orders/${putOrderId}`)
            .send(invalidItem)
            .expect(400)
        });
      });        
    });

    describe('DELETE /orders/:id/items/:itemId', function() {
      const testOrderId = 1;
      const delProductId = 2;
      const toDelItem = {
        product_id: delProductId,
        quantity: 3,
        price_unit: 19.99
      };
      let delItemId;

      before('before DELETE /orders/:id/items/:itemId tests', async function() {
        const response = await request(app)
          .post(`/orders/${testOrderId}/items`)
          .send(toDelItem);
        const postedItem = response.body;
        delItemId = postedItem.id;
      });

      describe('Valid DELETE /orders/:id/items/:itemId', function() {

        it('deletes an order item', async function() {
          const response = await request(app)
            .delete(`/orders/${testOrderId}/items/${delItemId}`)
            .expect(200)
          const itemId = parseInt(response.text);
          expect(itemId).to.equal(delItemId);
        });
      });

      describe('Invalid DELETE /orders/:id/items/:itemId', function() {

        it('called with a non-numeric order ID returns a 404 error', function() {
          return request(app)
            .delete(`/orders/${testOrderId}/items/ABC`)          
            .expect(404)
        });

        it('called with an non existing order ID returns a 404 error', function() {
          return request(app)
            .delete(`/orders/${testOrderId}/items/1234567890`)          
            .expect(404)
        });        
      });    
    });

    describe('DELETE /orders/:id/allItems', function() {
      let testOrderId;
      const toDelOrder = {
        created: new Date("05/15/2023"),
        modified: new Date("05/15/2323"),    
        status: 'Created',
        total_price: 120.95,
        user_id: 2
      }
      const toDelItems = [
        {
          product_id: 1,
          quantity: 3,
          price_unit: 9.99
        },
        {
          product_id: 2,
          quantity: 1,
          price_unit: 49.99
        },
        {
          product_id: 3,
          quantity: 2,
          price_unit: 19.99
        },
      ];

      before('before DELETE /orders/:id/allItems, insert test order', async function() {
        const sqlCommand = `
          INSERT INTO orders (created, modified, status, total_price, user_id) 
          VALUES ($1, $2, $3, $4, $5) 
          RETURNING *`;
        const { created, modified, status, total_price, user_id } = toDelOrder;
        const rowValues = [created, modified, status, total_price, user_id];
        const response = await db.query(sqlCommand, rowValues);
        const testOrder = response.rows[0];
        testOrderId = testOrder.id;
      });

      before('before DELETE /orders/:id/allItems, insert test order_items', async function() {
        const sqlCommand = `
          INSERT INTO order_items (order_id, product_id, quantity, price_unit) 
          VALUES ($1, $2, $3, $4) 
          RETURNING *`;
        try {
          for (let i = 0; i < toDelItems.length; i++) {
            const item = toDelItems[i];
            const { product_id, quantity, price_unit } = item;
            const rowValues = [testOrderId, product_id, quantity, price_unit];
            await db.query(sqlCommand, rowValues);
          }
          return toDelItems.length;
        } catch (error) {
          return error;
        }
      });

      after('after DELETE /orders/:id/allItems, remove test order_items', async function() {
        const sqlCommand = `DELETE FROM order_items WHERE order_id = ${testOrderId}`;
        await db.query(sqlCommand);
      });

      after('after DELETE /orders/:id/allItems, remove test order', async function() {
        const sqlCommand = `DELETE FROM orders WHERE id = ${testOrderId}`;
        await db.query(sqlCommand);
      });

      describe('Valid DELETE /orders/:id/allItems', function() {

        it('deletes all order items from an order', async function() {
          const response = await request(app)
            .delete(`/orders/${testOrderId}/allItems`)
            .expect(200);
          const itemId = parseInt(response.text);
          expect(itemId).to.equal(testOrderId);
        });
      });

      describe('Invalid DELETE /orders/:id/allItems', function() {

        it('called with a non-numeric order ID returns a 404 error', function() {
          return request(app)
            .delete(`/orders/ABC/allItems`)        
            .expect(404)
        });

        it('called with an non existing order ID returns a 404 error', function() {
          return request(app)
            .delete(`/orders/1234567890/allItems`)          
            .expect(404)
        });        
      });
    });

  });

};

module.exports = testOrderItems;