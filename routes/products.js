const express = require('express');
const productsRouter = express.Router();
const db = require('../db/db');

/**
 * checks id param,sets req.productId if id param valid, else sets error
 * @param {String} - 'id'; matches the route handler path variable (:id)
 * @param {string} - id - actual value of id parameter in route path
 */

productsRouter.param('id', (req, res, next, id) => {
  try {
    const productId = parseInt(id);    
    if (Number.isNaN(productId) || productId < 1 || !Number.isInteger(productId)) {               
      next(res.status(404).json('Invalid parameter'));
    } else {      
      req.productId = productId;
      next();
    }
  } catch (err) {
    next(err);
  }
});

productsRouter.get('/', async (req, res) => {

  // GET request - get all products
  // path: localhost:3000/products 
  // body: not used  

  const sqlCommand = `SELECT * FROM products`;  
  try {
    const results = await db.query(sqlCommand);
    if (db.validResultsAtLeast1Row(results)) {
      res.status(200).json(results.rows);      
    } else {
      res.status(404).json('No product rows');
    }    
  } catch (err) {
    throw Error(err);
  }
});

productsRouter.get('/:id', async (req, res) => {

  // GET request - get one product by id#
  // path: localhost:3000/products/# 
  //  where # is the id number for the product
  // body: not used

  const sqlCommand = `SELECT * FROM products WHERE id = $1`;  
  try {
    const results = await db.query(sqlCommand, [req.productId]);      
    if (db.validResultsAtLeast1Row(results)) {      
      res.status(200).json(results.rows[0]);
    } else {        
      res.status(404).json('Product not found');
    }    
  } catch (err) {
    res.status(404).json('Product not found');
  }
});

productsRouter.post('/', async (req, res) => {

  // POST request
  // path: localhost:3000/products/
  // body: JSON object
  //  {
  //    "name": "product",
  //    "model_number": "xxx-xxx-xx",
  //    "description": "This is a product",
  //    "price": 12.34
  //  }

  const { name, model_number, description, price } = req.body;
  const rowValues = [name, model_number, description, price];
  const sqlCommand = `
    INSERT INTO products (name, model_number, description, price) 
    VALUES ($1, $2, $3, $4) RETURNING *`;
  try {
    const results = await db.query(sqlCommand, rowValues);
    if (db.validResultsAtLeast1Row(results)) {      
      res.status(201).json(results.rows[0]);      
    } else {
      res.status(404).json('Product not inserted');
    }        
  } catch (err) {    
    if (err.code === '23505') {
      let errMsg
      if (err.detail.includes('(name)')) {
        errMsg = 'name already used';
      } else if (err.detail.includes('(model_number)')) {
        errMsg = 'model_number already used'
      } else {
        errMsg = 'value already used'
      }
      res.status(400).json(errMsg);
    } else if (err.code === '23502') {
      res.status(400).json('required value missing');
    } else {
      throw Error(err);
    }    
  }
});

productsRouter.put('/:id', async (req, res) => {

  // PUT request
  // path: localhost:3000/products/#
  //  where # is the id number for the product
  // body: JSON object
  //  {
  //    "name": "product",
  //    "model_number": "xxx-xxx-xx",
  //    "description": "This is a product",
  //    "price": 12.34
  //  }

  const id = parseInt(req.params.id); 
  const { name, model_number, description, price } = req.body;
  const rowValues = [name, model_number, description, price, id];
  const sqlCommand = `
    UPDATE products
    SET name = $1, 
        model_number = $2, 
        description = $3, 
        price = $4
    WHERE id = $5
    RETURNING *`;
  try {
    const results = await db.query(sqlCommand, rowValues);
    if (db.validResultsAtLeast1Row(results)) {
      res.status(200).send(results.rows[0]);      
    } else {      
      res.status(404).send(`Product not found`);
    };    
  } catch (err) {
    if (err.code === '23505') {
      let errMsg
      if (err.detail.includes('(name)')) {
        errMsg = 'name already used';
      } else if (err.detail.includes('(model_number)')) {
        errMsg = 'model_number already used'
      } else {
        errMsg = 'value already used'
      }
      res.status(400).json(errMsg);
    } else if (err.code === '23502') {
      res.status(400).json('required value missing');
    } else {
      throw Error(err);
    }    
  }
});

productsRouter.delete('/:id', async (req, res) => {

  // DELETE request
  // path: localhost:3000/products/#
  //  where # is the id number for the product
  // body: not used

  const sqlCommand = `DELETE FROM products WHERE id = $1`;
  try {
    const results = await db.query(sqlCommand, [req.productId]);
    if (results.rowCount === 1) {
      res.status(200).send(`${req.productId}`);
    } else {
      res.status(404).send(`Product not found`);
    }
  } catch (err) {
    throw Error(err);
  }
});

module.exports = productsRouter;