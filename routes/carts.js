const express = require('express');
const cartsRouter = express.Router();
const db = require('../db/db');
const cartQueries = require('../db/cartQueries');
const orderQueries = require('../db/orderQueries');

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
    if (db.validResultsAtLeast1Row(results) || results.rows.length === 0) { 
      res.status(200).json(results.rows);      
    } else {
      res.status(400).json('error getting carts');
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

  try {
    const results = await cartQueries.getCart(req.cartId);
    if (results.status === 200) {
      res.status(200).json(results.cart);
    } else {
      res.status(results.status).json(results.message);
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
    if (err.code === '23505') {
      res.status(400).json('user_id already used');
    } else if (err.code === '23502') {
      res.status(400).json('required value missing');
    } else {
      throw Error(err);
    }    
  }
});

cartsRouter.post('/:id/checkout', async (req, res) => {

  // POST request
  // path: localhost:3000/carts/#/checkout
  //  where # is the id number for the cart
  // body: JSON object
  //  {
  //    id: 1
  //    created: new Date("01/28/2023"),
  //    modified: new Date("01/28/2023"), (not required, will be set = created)
  //    user_id: 1
  //  }

  try {    
    const cart = req.body;
    const results = await orderQueries.moveCartToOrder(cart);
    if (results.status === 201) {
      res.status(201).json(results.order);
    } else {
      res.status(results.status).json(results.message);
    }    
  } catch (err) {
    throw Error(err);
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
      res.status(400).json('user_id already used');
    } else if (err.code === '23502') {
      res.status(400).json('required value missing');
    } else if (err.code === '23503') {
      res.status(409).json(err.message);
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
  
  try {
    const results = await cartQueries.deleteCart(req.cartId);
    if (results) {
      if (results.status === 200) {      
        res.status(200).send(`${req.cartId}`);
      } else {
        if (results.status === 404) {
          res.status(404).send(`Cart not found`);
        } else if (results.status === 409) {
          res.status(409).send('Cannot delete - constraint error');
        } else {
          res.status(400).send('Unknown error');
        }      
      }
    } else {
      res.status(400).send('Unknown error');
    }
  } catch (err) {
    throw Error(err);
  }
});

/**
 * checks id param,sets req.itemId if id param valid, else sets error
 * @param {String} - 'id'; matches the route handler path variable (:itemId)
 * @param {string} - id - actual value of id parameter in route path
 */

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

  try {
    const results = await cartQueries.getAllItemsForCart(req.cartId);
    if (results) {
      res.status(200).json(results);
    } else {
      res.status(404).json('Cart items not found');
    }
  } catch (err) {
    throw Error(err);
  }
});

cartsRouter.get('/items/:itemId', async (req, res) => {

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
  //    cart_id: 2
  //    product_id: 1
  //    quantity: 2
  //  }
  
  // const cartId = parseInt(req.params.id); 
  const { cart_id, product_id, quantity } = req.body;
  const rowValues = [cart_id, product_id, quantity];
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
    if (err.code === '23502') {
      res.status(400).json('required value missing');
    } else if (err.code === '23503') {
      res.status(409).json(err.message);
    } else {
      throw Error(err);
    }    
  }
});

cartsRouter.put('/items/:itemId', async (req, res) => {

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
    if (err.code === '23502') {
      res.status(400).json('required value missing');
    } else if (err.code === '23503') {
      res.status(409).json(err.message);
    } else {
      throw Error(err);
    }    
  }
});

cartsRouter.delete('/items/:itemId', async (req, res) => {

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
    throw Error(err);
  }
});

cartsRouter.delete('/:id/allItems', async (req, res) => {

  // DELETE request
  // path: localhost:3000/carts/#
  //  where # is the id number for the cart
  // body: not used
    
  try {    
    const results = await cartQueries.deleteCartItems(req.cartId);
    // deleteCartItems returns # of rows deleted. 
    // 0 rows is valid, so error on null, empty strings, false, undefined
    if (!results && results !== 0) {
      res.status(404).send('Could not delete cart items');
    } else {
      res.status(200).send(`${req.cartId}`);
    }
  } catch (err) {
    throw Error(err);
  }
});

module.exports = cartsRouter;