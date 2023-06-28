const express = require('express');
const cartsRouter = express.Router();
const db = require('../db/db');

/**
 * checks id param,sets req.cartId if id param valid, else sets error
 * @param {String} - 'id'; matches the route handler path variable (:id)
 * @param {string} - id - actual value of id parameter in route path
 */

cartsRouter.param('id', (req, res, next, id) => {
  try {
    const cartId = parseInt(id);    
    if (Number.isNaN(cartId) || cartId < 1 || !Number.isInteger(cartId)) {               
      next(res.status(404).json('Invalid parameter'));
    } else {      
      req.cartId = cartId;
      next();
    }
  } catch (err) {
    next(err);
  }
});

cartsRouter.get('/', async (req, res) => {

  // GET request - get all carts
  // path: localhost:3000/carts
  // body: not used  

  const sqlCommand = `SELECT * FROM carts`;  
  try {
    const results = await db.query(sqlCommand);
    if (db.validResultsAtLeast1Row(results)) {
      res.status(200).json(results.rows);      
    } else {
      res.status(200).json('No cart rows');
    }    
  } catch (err) {
    throw Error(err);
  }
});

cartsRouter.get('/:id', async (req, res) => {

  // GET request - get one cart by id#
  // path: localhost:3000/carts/# 
  //  where # is the id number for the cart
  // body: not used

  const sqlCommand = `SELECT * FROM carts WHERE id = $1`;
  try {
    const results = await db.query(sqlCommand, [req.cartId]); 
    if (db.validResultsAtLeast1Row(results)) {      
      res.status(200).json(results.rows[0]);
    } else {        
      res.status(404).json('Cart not found');
    }    
  } catch (err) {
    throw Error(err);
  }
});

cartsRouter.post('/', async (req, res) => {

  // POST request
  // path: localhost:3000/carts
  // body: JSON object
  //  {
  //    "created": new Date("01/28/2023"),
  //    "modified": new Date("01/28/2023"),
  //    "user_id": 1
  //  }
  
  const { created, modified, user_id } = req.body;
  const rowValues = [created, modified, user_id];
  const sqlCommand = `
    INSERT INTO carts (created, modified, user_id) 
    VALUES ($1, $2, $3) RETURNING *`;
  try {
    const results = await db.query(sqlCommand, rowValues);
    if (db.validResultsAtLeast1Row(results)) {      
      res.status(201).json(results.rows[0]);      
    } else {
      res.status(404).json('Cart not inserted');
    }    
  } catch (err) {
    // console.log(`err code = ${err.code}`);
    if (err.code === '23505') {
      res.status(404).json('user_id already used');
    } else if (err.code === '23502') {
      res.status(404).json('required value missing');
    } else {
      throw Error(err);
    }    
  }
});

cartsRouter.put('/:id', async (req, res) => {

  // PUT request
  // path: localhost:3000/carts/#
  //  where # is the id number for the cart
  // body: JSON object
  //  {
  //    "created": new Date("01/28/2023"),
  //    "modified": new Date("01/28/2023"),
  //    "user_id": 1
  //  }
  
  const id = parseInt(req.params.id); 
  const { created, modified, user_id } = req.body;
  const rowValues = [created, modified, user_id, id];
  const sqlCommand = `
    UPDATE carts
    SET created = $1, 
        modified = $2, 
        user_id = $3
    WHERE id = $4
    RETURNING *`;
  try {
    const results = await db.query(sqlCommand, rowValues);
    if (db.validResultsAtLeast1Row(results)) {
      res.status(200).send(results.rows[0]);      
    } else {      
      res.status(404).send(`Cart not found`);
    };
  } catch (err) {
    throw Error(err);
  }
});

cartsRouter.delete('/:id', async (req, res) => {

  // DELETE request
  // path: localhost:3000/carts/#
  //  where # is the id number for the cart
  // body: not used
  
  const sqlCommand = `DELETE FROM carts WHERE id = $1`;
  try {
    const results = await db.query(sqlCommand, [req.cartId]);
    if (results.rowCount === 1) {
      res.status(200).send(`${req.cartId}`);
    } else {
      res.status(404).send(`Cart not found`);
    }
  } catch (err) {
    throw Error(err);
  }
});

module.exports = cartsRouter;