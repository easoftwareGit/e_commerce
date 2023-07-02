const express = require('express');
const ordersRouter = express.Router();
const db = require('../db/db');

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
  //    user_id: 1
  //    status: 'Created',                (not required will be set = 'Created')
  //    total_price: 123.45,
  //    user_id: 1
  //  }
  //  note: 
  //    on a post, modified = created
  //    status = 'Created'
  
  const { created, total_price, user_id } = req.body;
  const rowValues = [created, created, 'Created', total_price, user_id];
  const sqlCommand = `
    INSERT INTO orders(created, modified, status, total_price, user_id) 
    VALUES ($1, $2, $3, $4, $5) 
    RETURNING *`;
  try {
    const results = await db.query(sqlCommand, rowValues);
    if (db.validResultsAtLeast1Row(results)) {      
      res.status(201).json(results.rows[0]);      
    } else {
      res.status(404).json('Order not inserted');
    }    
  } catch (err) {    
    if (err.code === '23502') {
      res.status(404).json('required value missing');
    } else {
      throw Error(err);
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
  //    user_id: 1
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
      res.status(404).json('required value missing');
    } else {
      throw Error(err);
    }    
  }
});

ordersRouter.delete('/:id', async (req, res) => {

  // DELETE request
  // path: localhost:3000/carts/#
  //  where # is the id number for the cart
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

module.exports = ordersRouter;