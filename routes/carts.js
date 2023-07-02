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
  //    created: new Date("01/28/2023"),
  //    modified: new Date("01/28/2023"), (not required, will be set = created)
  //    user_id: 1
  //  }
  
  const { created, user_id } = req.body;
  const rowValues = [created, created, user_id];
  const sqlCommand = `
    INSERT INTO carts (created, modified, user_id) 
    VALUES ($1, $2, $3) 
    RETURNING *`;
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
  //    created: new Date("01/28/2023"), (not required, not used, cannot change created date)
  //    modified: new Date("01/28/2023"),
  //    user_id: 1
  //  }
  
  const id = parseInt(req.params.id); 
  const { modified, user_id } = req.body;
  const rowValues = [modified, user_id, id];
  const sqlCommand = `
    UPDATE carts
    SET modified = $1, 
        user_id = $2
    WHERE id = $3
    RETURNING *`;
  try {
    const results = await db.query(sqlCommand, rowValues);
    if (db.validResultsAtLeast1Row(results)) {
      res.status(200).send(results.rows[0]);      
    } else {      
      res.status(404).send(`Cart not found`);
    };
  } catch (err) {
    if (err.code === '23505') {
      res.status(404).json('user_id already used');
    } else if (err.code === '23502') {
      res.status(404).json('required value missing');
    } else {
      throw Error(err);
    }    
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
    if (err.code === '23503') {
      res.status(409).send('Cannot delete - constraint error');
    } else {
      throw Error(err);
    }
  }
});

cartsRouter.param('itemId',  (req, res, next, id) => {
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

cartsRouter.get('/:id/items', async (req, res) => {

  // GET request
  // path: localhost:3000/carts/#/items
  //  where # is the id number for the cart
  // body: not used

  const sqlCommand = `
    SELECT cart_items.id, cart_id, product_id, quantity, 
	         products.name, products.model_number, products.description,
	         products.price, (quantity * products.price) AS item_total
    FROM cart_items
    INNER JOIN products ON (products.id = cart_items.product_id)
    WHERE cart_id = $1;`;
  try {
    const results = await db.query(sqlCommand, [req.cartId]); 
    if (db.validResultsAtLeast1Row(results)) {      
      res.status(200).json(results.rows);
    } else {        
      res.status(404).json('Cart items not found');
    }    
  } catch (err) {
    throw Error(err);
  }
});

cartsRouter.get('/:id/items/:itemId', async (req, res) => {

  // GET request
  // path: localhost:3000/carts/id#/items/itemId#
  //  where id# is the id number for the cart, and itemIs# is the id of the cart_item
  // body: not used

  const sqlCommand = `SELECT * FROM cart_items WHERE id = $1`;
  try {
    const results = await db.query(sqlCommand, [req.itemId]); 
    if (db.validResultsAtLeast1Row(results)) {      
      res.status(200).json(results.rows[0]);
    } else {        
      res.status(404).json('Cart item not found');
    }    
  } catch (err) {
    throw Error(err);
  }
});

cartsRouter.post('/:id/items', async (req, res) => {

  // POST request
  // path: localhost:3000/carts/#/items
  //  where id# is the id number for the cart
  // body: JSON object
  //  {
  //    product_id: 1
  //    quantity: 2
  //  }
  
  const cartId = parseInt(req.params.id); 
  const { product_id, quantity } = req.body;
  const rowValues = [cartId, product_id, quantity];
  const sqlCommand = `
    INSERT INTO cart_items (cart_id, product_id, quantity) 
    VALUES ($1, $2, $3) RETURNING *`;
  try {
    const results = await db.query(sqlCommand, rowValues);
    if (db.validResultsAtLeast1Row(results)) {      
      res.status(201).json(results.rows[0]);      
    } else {
      res.status(404).json('Cart item not inserted');
    }    
  } catch (err) {
    // console.log(`err code = ${err.code}`);
    if (err.code === '23502') {
      res.status(404).json('required value missing');
    } else if (err.code === '23503') {
      res.status(404).json('product not valid');
    } else {
      throw Error(err);
    }    
  }
});

cartsRouter.put('/:id/items/:itemId', async (req, res) => {

  // PUT request
  // path: localhost:3000/carts/id#/items/itemId#
  //  where id# is the id number for the cart, and itemId# is the id of the cart_item
  // body: JSON object
  //  {
  //    product_id: 1
  //    quantity: 2
  //  }
  
  const itemId = parseInt(req.params.itemId); 
  const { product_id, quantity } = req.body;
  const rowValues = [product_id, quantity, itemId];
  const sqlCommand = `
    UPDATE cart_items
    SET product_id = $1, 
        quantity = $2        
    WHERE id = $3
    RETURNING *`;
  try {
    const results = await db.query(sqlCommand, rowValues);
    if (db.validResultsAtLeast1Row(results)) {
      res.status(200).send(results.rows[0]);      
    } else {      
      res.status(404).send(`Cart item not found`);
    };
  } catch (err) {
    throw Error(err);
  }
});

cartsRouter.delete('/:id/items/:itemId', async (req, res) => {

  // DELETE request
  // path: localhost:3000/carts/#
  //  where # is the id number for the cart
  // body: not used
    
  const sqlCommand = `DELETE FROM cart_items WHERE id = $1`;
  try {
    const results = await db.query(sqlCommand, [req.itemId]);
    if (results.rowCount === 1) {
      res.status(200).send(`${req.itemId}`);
    } else {
      res.status(404).send(`Cart item not found`);
    }
  } catch (err) {
    if (err.code === '23503') {
      res.status(409).send('Cannot delete - constraint error');
    } else {
      throw Error(err);
    }
  }
});

cartsRouter.delete('/:id/allItems', async (req, res) => {

  // DELETE request
  // path: localhost:3000/carts/#
  //  where # is the id number for the cart
  // body: not used
    
  const sqlCommand = `DELETE FROM cart_items WHERE cart_id = $1`;
  try {
    const results = await db.query(sqlCommand, [req.cartId]);
    if (results.rowCount > 0) {
      res.status(200).send(`${req.cartId}`);
    } else {
      res.status(404).send(`Cart items not found`);
    }
  } catch (err) {
    if (err.code === '23503') {
      res.status(409).send('Cannot delete - constraint error');
    } else {
      throw Error(err);
    }
  }
});

module.exports = cartsRouter;