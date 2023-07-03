const expect = require('chai').expect;
const request = require('supertest');
const db = require('../../db/db');

const dbTools = require('../../db/dbTools');
const { assert } = require('chai');

const setupOrders = require('./setupOrders');
const orderCount = setupOrders.orderCount;

const {
  ordersTableName,
  ordersUserIdForeignKeyName,
  orderItemsTableName
} = require('../myConsts');

function testOrders(app) {

  describe('/orders routes', function() {

    describe('setup orders table', function() {

      before('before DROP orders, drop order_items table', async function() {
        await dbTools.dropTable(orderItemsTableName);
      });

      it('DROP orders', async function() {
        await dbTools.dropTable(ordersTableName);
        const doesExist = await dbTools.tableExists(ordersTableName);      
        expect(doesExist).to.be.false;
      });

      it('CREATE orders', async function() {
        await setupOrders.createOrdersTable();
        const doesExist = await dbTools.tableExists(ordersTableName);      
        expect(doesExist).to.be.true;     
      });

      it('check for orders FOREIGN KEY', async function() {        
        const doesExist = await dbTools.foreignKeyExists(ordersUserIdForeignKeyName);      
        expect(doesExist).to.be.true;
      });

      it('INSERT new orders', async function() {
        const numInserted = await setupOrders.insertAllOrders(); 
        expect(numInserted).to.equal(orderCount);
      });      
    });

    describe('cannot DELETE users with an order', function() {
      let testUserId;
      let testOrderId;

      const user = {  
        'email': 'greg@email.com',
        'password_hash': '098765',
        'first_name': 'Greg',
        'last_name': 'Blue',
        'phone': '800 555-8888'
      };        

      before('make sure test user is not in table', async function() {
        const sqlCommand = `DELETE FROM users WHERE email = $1`;        
        await db.query(sqlCommand, [user.email]);
      });

      before('insert test user', async function() {
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

      before('insert test order', async function() {
        const order =   {
          "created": new Date("03/03/2323"),
          "modified": new Date("03/03/2323"),    
          "status": 'Created',
          "total_price": 13.98,
          "user_id": testUserId
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

      after('delete test order', async function() {    
        const sqlCommand = `DELETE FROM orders WHERE id = ${testOrderId}`;
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

      it('test order exists before DELETE user', async function() {
        const sqlCommand = `SELECT * FROM orders WHERE id = ${testOrderId}`;
        const response = await db.query(sqlCommand);
        const doesExist = response.rows.length === 1;
        expect(doesExist).to.be.true;
      });

      it('try to DELETE user that has an order', async function() {        
        return await request(app)
          .delete(`/users/${testUserId}`)
          .expect(409);   // constraint error
      });
    });

    describe('GET /orders/:id', function() {
      const getOrderId = 2;

      it('returns a single order object', async function() {
        const response = await request(app)
          .get(`/orders/${getOrderId}`)
          .expect(200);
        const order = response.body;
        expect(order).to.be.an.instanceOf(Object);
        expect(order).to.not.be.an.instanceOf(Array);
      });

      it('returns a full order object', async function() {
        const response = await request(app)
          .get(`/orders/${getOrderId}`)
          .expect(200);
        const order = response.body;
        expect(order).to.have.ownProperty('id');
        expect(order).to.have.ownProperty('created');
        expect(order).to.have.ownProperty('modified');
        expect(order).to.have.ownProperty('status');
        expect(order).to.have.ownProperty('total_price');
        expect(order).to.have.ownProperty('user_id');
      });

      it('returned order has the correct id', async function() {
        const response = await request(app)
          .get(`/orders/${getOrderId}`)
          .expect(200);
        const order = response.body;
        expect(order.id).to.be.an.equal(getOrderId);
      });

      it('called with a non-numeric ID returns a 404 error', function() {
        return request(app)
          .get('/orders/ABC')
          .expect(404);
      });

      it('called with a invalid ID returns a 404 error', function() {
        return request(app)
          .get('/orders/1234567890')
          .expect(404);
      });
    })

    describe('POST /orders', function() {
      const newOrder = {
        "created": new Date("06/16/2023"),         
        "total_price": 123.45,
        "user_id": 1
      };
      const invalidOrder = {
        "total_price": 123.45,
        "user_id": 5
      };
      const resetSqlCommand = `
        DELETE FROM orders
        WHERE user_id = 1;`

      before('before first POST test', async function() {
        await db.query(resetSqlCommand);
      });

      after('after last POST test', async function() {
        await db.query(resetSqlCommand);
      });
  
      it('post a new order with valid data', async function() {
        const response = await request(app)
          .post('/orders')
          .send(newOrder)
          .expect(201);
        const postedOrder = response.body;
        // convert json date strings to dates
        postedOrder.created = new Date(postedOrder.created);
        postedOrder.modified = new Date(postedOrder.modified);
        // now compare - use deepEqual for dates        
        assert.deepEqual(postedOrder.created, newOrder.created);
        assert.deepEqual(postedOrder.modified, newOrder.created); // yes compare to created
        assert.equal(postedOrder.status, 'Created');
        assert.equal(postedOrder.total_price, newOrder.total_price)
        assert.equal(postedOrder.user_id, newOrder.user_id);
      });

      it('did NOT post order with no created', async function() {
        return await request(app)
          .post('/orders')
          .send(invalidOrder)
          .expect(404);
      });

      it('did NOT post order with no total_price', async function() {
        invalidOrder.created = new Date("06/16/2323")
        invalidOrder.total_price = null;
        return await request(app)
          .post('/orders')
          .send(invalidOrder)
          .expect(404);
      });

      it('did NOT post order with no user_id', async function() {
        invalidOrder.total_price = 23.45;
        invalidOrder.user_id = null;
        return await request(app)
          .post('/orders')
          .send(invalidOrder)
          .expect(404);
      });
    });

    describe('PUT /orders/:id', function() {
      const putOrderId = 2;      
      const resetSqlCommand = `
        UPDATE orders 
        SET modified = '02/02/2323', 
            status = 'Created', 
            total_price = 57.97,
            user_id = 4
        WHERE id = 2;`;
      const testOrder = {                        
        modified: new Date('03/12/23'),
        status: 'Shipped',
        total_price: 12.34,
        user_id: 3
      };

      describe('Valid /orders/:id', function() {

        before('before 1st PUT test', async function() {
          await db.query(resetSqlCommand);
        });
  
        afterEach('afterEach PUT test ', async function() {      
          await db.query(resetSqlCommand);
        });

        it('updates the correct order and returns it', async function() {
          let initialOrder;
          let updatedOrder;      

          const response = await request(app)
            .get(`/orders/${putOrderId}`);
          initialOrder = response.body;
          updatedOrder = Object.assign({}, testOrder);
          const response_1 = await request(app)
            .put(`/orders/${putOrderId}`)
            .send(updatedOrder)
            .expect(200);
          const returnedOrder = response_1.body;
          // convert json date strings to dates
          returnedOrder.created = new Date(returnedOrder.created);
          returnedOrder.modified = new Date(returnedOrder.modified);
          initialOrder.created = new Date(initialOrder.created);
          // now compare - use deepEqual for dates
          assert.equal(returnedOrder.id, putOrderId);
          assert.deepEqual(returnedOrder.created, initialOrder.created);  // yes compare to initialOrder
          assert.deepEqual(returnedOrder.modified, updatedOrder.modified);
          assert.equal(returnedOrder.status, updatedOrder.status);
          assert.equal(returnedOrder.total_price, updatedOrder.total_price);
          assert.equal(returnedOrder.user_id, updatedOrder.user_id);
        });
      });

      describe('Invalid /orders/:id', function() {

        it('called with a non-numeric ID returns a 404 error', function() {
          return request(app)
            .put('/orders/ABC')
            .send(testOrder)
            .expect(404)
        });

        it('called with an non existing ID returns a 404 error', function() {
          return request(app)
            .put('/orders/1234567890')
            .send(testOrder)
            .expect(404)
        });        

        // other tests for missing data performed in POST tests        
        it('PUT with with no modified', function() {
          const missingDataOrder = Object.assign({}, testOrder);
          missingDataOrder.modified = null;
          return request(app)
            .put(`/orders/${putOrderId}`)
            .send(missingDataOrder)
            .expect(404)
        });

        it('PUT with with no status', function() {
          const missingDataOrder = Object.assign({}, testOrder);
          missingDataOrder.status = null;
          return request(app)
            .put(`/orders/${putOrderId}`)
            .send(missingDataOrder)
            .expect(404)
        });
      });
    });

    describe('DELETE /orders/:id', function() {
      const toDelOrder = {
        "created": new Date("04/14/2323"),
        "total_price": 23.45,
        "user_id": 1
      };
      let delOrderId;

      before('before DELETE tests', async function() {
        const response = await request(app)
          .post('/orders')
          .send(toDelOrder);
        const postedOrder = response.body;
        delOrderId = postedOrder.id;
      });

      describe('Valid DELETE /orders/:id', function() {

        it('deletes an order', async function() {
          const response = await request(app)
            .delete(`/orders/${delOrderId}`)
            .expect(200);
          const orderId = parseInt(response.text);
          expect(orderId).to.equal(delOrderId);
        });
      });

      describe('Invalid DELETE /orders/:id', function() {

        it('called with a non-numeric order id', function() {
          return request(app)
            .delete('/orders/ABC')
            .expect(404);
        });

        it('called with an order id that is not in database', function() {
          return request(app)
            .delete('/orders/1234567890')
            .expect(404);
        });
      });
    });

  });
};

module.exports = testOrders;