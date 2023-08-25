const express = require('express');
const ordersRouter = express.Router();
const db = require('../db/db');
const orderQueries = require('../db/orderQueries');

/**
 * checks id param,sets req.orderId if id param valid, else sets error
 * @param {String} - 'id'; matches the route handler path variable (:id)
 * @param {string} - id - actual value of id parameter in route path
 */

ordersRouter.param('id', (req, res, next, id) => {
  try {
    const orderId = parseInt(id);    
    if (Number.isNaN(orderId) || orderId < 1 || !Number.isInteger(orderId)) {               
      next(res.status(404).json('Invalid parameter'));
    } else {      
      req.orderId = orderId;
      next();
    }
  } catch (err) {
    next(err);
  }
});

ordersRouter.get('/', async (req, res) => {

  // GET request - get all orders
  // path: localhost:3000/orders
  // body: not used

  const sqlCommand = `SELECT * FROM orders`;
  try {
    const results = await db.query(sqlCommand); 
    if (db.validResultsAtLeast1Row(results) || results.rows.length === 0) {      
      res.status(200).json(results.rows);
    } else {        
      res.status(400).json('error getting orders');
    }    
  } catch (err) {
    throw Error(err);
  }
});

ordersRouter.get('/:id', async (req, res) => {

  // GET request - get one order by id#
  // path: localhost:3000/orders/# 
  //  where # is the id number for the order
  // body: not used

  const sqlCommand = `SELECT * FROM orders WHERE id = $1`;
  try {
    const results = await db.query(sqlCommand, [req.orderId]); 
    if (db.validResultsAtLeast1Row(results)) {      
      res.status(200).json(results.rows[0]);
    } else {        
      res.status(404).json('Order not found');
    }    
  } catch (err) {
    throw Error(err);
  }
});

ordersRouter.post('/', async (req, res) => {

  // POST request
  // path: localhost:3000/orders
  // body: JSON object
  //  {
  //    created: new Date("01/28/2023"),
  //    modified: new Date("01/28/2023"), (not required, will be set = created)
  //    status: 'Created',                (not required will be set = 'Created')
  //    total_price: 123.45,
  //    user_id: 1
  //  }
  //  note: 
  //    on a post, modified = created
  //    status = 'Created'
  
  try {
    const results = await orderQueries.createNewOrder(req.body);
    if (results.status === 201) {
      res.status(201).json(results.order);
    } else {
      res.status(results.status).json(results.message);
    }
  } catch (err) {
    if (err.message && err.message.includes('violates foreign key constraint')) {
      res.status(409).json(err.message);
    } else if (err.message && err.message.includes('invalid input syntax')) {
      res.status(400).json(err.message);
    } else {
      throw Error(err)
    }
  }
});

ordersRouter.put('/:id', async (req, res) => {

  // PUT request
  // path: localhost:3000/orders/#
  //  where # is the id number for the order
  // body: JSON object
  //  {  
  //    modified: new Date("01/28/2023"), 
  //    status: 'Created',
  //    total_price: 123.45,
  //    user_id: 1
  //  }
  //  note: created column NEVER updated in PUT route
  
  const id = parseInt(req.params.id); 
  const { modified, status, total_price, user_id } = req.body;
  const rowValues = [modified, status, total_price, user_id, id];
  const sqlCommand = `
    UPDATE orders
    SET modified = $1, 
        status = $2,
        total_price = $3,
        user_id = $4
    WHERE id = $5
    RETURNING *`;
  try {
    const results = await db.query(sqlCommand, rowValues);
    if (db.validResultsAtLeast1Row(results)) {
      res.status(200).send(results.rows[0]);      
    } else {      
      res.status(404).send(`Order not found`);
    };
  } catch (err) {
    if (err.code === '23502') {
      res.status(400).json('required value missing');
    } else if (err.code === '23503') {
      res.status(409).json(err.message);
    } else {
      throw Error(err);
    }    
  }
});

ordersRouter.delete('/:id', async (req, res) => {

  // DELETE request
  // path: localhost:3000/orders/#
  //  where # is the id number for the order
  // body: not used
  
  const sqlCommand = `DELETE FROM orders WHERE id = $1`;
  try {
    const results = await db.query(sqlCommand, [req.orderId]);
    if (results.rowCount === 1) {
      res.status(200).send(`${req.orderId}`);
    } else {
      res.status(404).send(`Order not found`);
    }
  } catch (err) {
    if (err.code === '23503') {
      res.status(409).send('Cannot delete - constraint error');
    } else {
      throw Error(err);
    }
  }
});

/**
 * checks id param,sets req.itemId if id param valid, else sets error
 * @param {String} - 'id'; matches the route handler path variable (:itemId)
 * @param {string} - id - actual value of id parameter in route path
 */

ordersRouter.param('itemId',  (req, res, next, id) => {
  try {
    const itemId = parseInt(id);    
    if (Number.isNaN(itemId) || itemId < 1 || !Number.isInteger(itemId)) { 
      next(res.status(404).json('Invalid parameter'));
    } else {            
      req.itemId = itemId;
      next();
    }
  } catch (err) {
    next(err);
  }
});

ordersRouter.get('/:id/items', async (req, res) => {

  // GET request
  // path: localhost:3000/orders/#/items
  //  where # is the id number for the order
  // body: not used

  const sqlCommand = `
    SELECT order_items.id, order_id, product_id, quantity, price_unit,
           products.name, products.model_number, products.description, 
           (price_unit * quantity) AS item_total
    FROM order_items
    INNER JOIN products ON (products.id = order_items.product_id)
    WHERE order_id = $1;`;
  try {
    const results = await db.query(sqlCommand, [req.orderId]); 
    if (db.validResultsAtLeast1Row(results)) {      
      res.status(200).json(results.rows);
    } else {        
      res.status(404).json('Order items not found');
    }    
  } catch (err) {
    throw Error(err);
  }
});

ordersRouter.get('/items/:itemId', async (req, res) => {

  // GET request
  // path: localhost:3000/orders/id#/items/itemId#
  //  where id# is the id number for the order, and itemIs# is the id of the order_item
  // body: not used

  const sqlCommand = `SELECT * FROM order_items WHERE id = $1`;
  try {
    const results = await db.query(sqlCommand, [req.itemId]); 
    if (db.validResultsAtLeast1Row(results)) {      
      res.status(200).json(results.rows[0]);
    } else {        
      res.status(404).json('Order item not found');
    }    
  } catch (err) {
    throw Error(err);
  }
});

ordersRouter.post('/:id/items', async (req, res) => {

  // POST request
  // path: localhost:3000/orders/#/items
  //  where id# is the id number for the order
  // body: JSON object
  //  {
  //    product_id: 1
  //    quantity: 2
  //    price_unit: 12.34
  //  }
    
  const orderId = parseInt(req.params.id);   
  const orderItem = req.body;
  orderItem.order_id = orderId;
  try {
    const results = await orderQueries.createOrderItem(orderItem);
    if (results.status === 201) {
      res.status(201).json(results.orderItem);
    } else {
      res.status(results.status).json(results.message);
    }
  } catch (err) {
    throw Error(err);
  }  
});

ordersRouter.put('/items/:itemId', async (req, res) => {

  // PUT request
  // path: localhost:3000/orders/id#/items/itemId#
  //  where id# is the id number for the order, and itemId# is the id of the order_item
  // body: JSON object
  //  {
  //    product_id: 1
  //    quantity: 2
  //    price_unit: 12.34
  //  }
  
  const itemId = parseInt(req.params.itemId); 
  const { product_id, quantity, price_unit } = req.body;
  const rowValues = [product_id, quantity, price_unit, itemId];
  const sqlCommand = `
    UPDATE order_items
    SET product_id = $1, 
        quantity = $2,
        price_unit = $3
    WHERE id = $4
    RETURNING *`;
  try {
    const results = await db.query(sqlCommand, rowValues);
    if (db.validResultsAtLeast1Row(results)) {
      res.status(200).send(results.rows[0]);      
    } else {      
      res.status(404).send(`Order item not found`);
    };
  } catch (err) {
    if (err.code === '23502') {
      res.status(400).json('required value missing');
    } else if (err.code === '23503') {
      res.status(409).json(err.message);
    } else {
      throw Error(err);
    }    
  }
});

ordersRouter.delete('/items/:itemId', async (req, res) => {

  // DELETE request
  // path: localhost:3000/orders/#
  //  where # is the id number for the order
  // body: not used
    
  const sqlCommand = `DELETE FROM order_items WHERE id = $1`;
  try {
    const results = await db.query(sqlCommand, [req.itemId]);
    if (results.rowCount === 1) {
      res.status(200).send(`${req.itemId}`);
    } else {
      res.status(404).send(`Order item not found`);
    }
  } catch (err) {
    if (err.code === '23503') {
      res.status(409).send('Cannot delete - constraint error');
    } else {
      throw Error(err);
    }
  }
});

ordersRouter.delete('/:id/allItems', async (req, res) => {

  // DELETE request
  // path: localhost:3000/orders/#
  //  where # is the id number for the order
  // body: not used
    
  const sqlCommand = `DELETE FROM order_items WHERE order_id = $1`;
  try {
    const results = await db.query(sqlCommand, [req.orderId]);
    if (results.rowCount > 0) {
      res.status(200).send(`${req.orderId}`);
    } else {
      res.status(404).send(`Order items not found`);
    }
  } catch (err) {
    if (err.code === '23503') {
      res.status(409).send('Cannot delete - constraint error');
    } else {
      throw Error(err);
    }
  }
});

module.exports = ordersRouter;