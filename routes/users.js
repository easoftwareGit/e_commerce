const express = require('express');
const usersRouter = express.Router();
const db = require('../db/db');

/**
 * checks id param,sets req.userId if id param valid, else sets error
 * @param {String} - 'id'; matches the route handler path variable (:id)
 * @param {string} - id - actual value of id parameter in route path
 */

usersRouter.param('id', (req, res, next, id) => {
  try {
    const userId = parseInt(id); 
    if (Number.isNaN(userId) || userId < 0 || !Number.isInteger(userId)) {    
      next(Error('Invalid parameter'));      
    }
    req.userId = userId;
    next();
  } catch (err) {
    next(err);
  }
});

usersRouter.get('/', async (req, res) => {

  // GET request - get all users
  // path: localhost:3000/users 
  // body: not used  

  const sqlCommand = `SELECT * FROM users`;  
  try {
    const results = await db.query(sqlCommand);
    if (db.validResultsAtLeast1Row(results)) {
      res.status(200).json(results.rows);      
    } else {
      res.status(200).json('No user rows');
    }    
  } catch (err) {
    throw Error(err);
  }
});

usersRouter.get('/:id', async (req, res) => {

  // GET request - get one user by id#
  // path: localhost:3000/users/# 
  //  where # is the id number for the user
  // body: not used

  const sqlCommand = `SELECT * FROM users WHERE id = $1`;
  try {
    const results = await db.query(sqlCommand, [req.userId]);      
    if (db.validResultsAtLeast1Row(results)) {      
      res.status(200).json(results.rows[0]);
    } else {        
      res.status(404).json('User not found');
    }    
  } catch (err) {
    throw Error(err);
  }
});

usersRouter.post('/', async (req, res) => {

  // POST request
  // path: localhost:3000/users
  // body: JSON object
  //  {
  //    "email": "user@email.com",
  //    "password_hash": "QWERTY!@#$%^",
  //    "first_name": "John",
  //    "last_name": "Doe",
  //    "phone": "(800) 555-1234"
  //  }
  
  const { email, password_hash, first_name, last_name, phone } = req.body;
  const rowValues = [email, password_hash, first_name, last_name, phone];
  const sqlCommand = `
    INSERT INTO users (email, password_hash, first_name, last_name, phone) 
    VALUES ($1, $2, $3, $4, $5) RETURNING *`;
  try {
    const results = await db.query(sqlCommand, rowValues);
    if (db.validResultsAtLeast1Row(results)) {
      res.status(200).json(results.rows[0]);      
    } else {
      res.status(404).json('User not added');
    }    
  } catch (err) {
    throw Error(err);
  }
});

usersRouter.put('/:id', async (req, res) => {

  // PUT request
  // path: localhost:3000/users/#
  //  where # is the id number for the user
  // body: JSON object
  //  {
  //    "email": "user@email.com",
  //    "password_hash": "123ABC",
  //    "first_name": "John",
  //    "last_name": "Doe",
  //    "phone": "(800) 555-1234"
  //  }
  
  const id = parseInt(req.params.id); 
  const { email, password_hash, first_name, last_name, phone } = req.body;
  const rowValues = [email, password_hash, first_name, last_name, phone, id];
  const sqlCommand = `
    UPDATE users
    SET email = $1, 
        password_hash = $2, 
        first_name = $3, 
        last_name = $4, 
        phone = $5
    WHERE id = $6
    RETURNING *`;
  try {
    const results = await db.query(sqlCommand, rowValues);
    if (db.validResultsAtLeast1Row(results)) {
      res.status(200).send(results.rows[0]);      
    } else {      
      res.status(404).send(`User not found`);
    };
  } catch (err) {
    throw Error(err);
  }
});

usersRouter.delete('/:id', async (req, res) => {

  // DELETE request
  // path: localhost:3000/users/#
  //  where # is the id number for the user
  // body: not used
  
  const sqlCommand = `DELETE FROM users WHERE id = $1`;
  try {
    const results = await db.query(sqlCommand, [req.userId]);
    if (results.rowCount === 1) {
      res.status(200).send(`${req.userId}`);
    } else {
      res.status(404).send(`User not found`);
    }
  } catch (err) {
    throw Error(err);
  }
});

module.exports = usersRouter;