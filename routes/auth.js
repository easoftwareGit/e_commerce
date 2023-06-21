const express = require('express');
const authRouter = express.Router();
const bcrypt = require('bcrypt');
const passport = require("passport");
const userQuery = require('../db/userQueries');

authRouter.post('/register', async (req, res) => {

  // POST request - register user
  // path: localhost:3000/auth/register 
  // body: 
  //  {
  //    "email": "user@email.com",
  //    "password": "123ABC",
  //    "first_name": "John",
  //    "last_name": "Doe",
  //    "phone": "(800) 555-1234"
  //  }

  const { email } = req.body;  
  try {
    const oldUser = await userQuery.findUserByEmail(email);
    if (oldUser) {
      res.status(409).json({ message: 'email already in use' });
    } else {
      const newUser = await userQuery.createUser(req.body);
      if (newUser) {
        res.status(200).send(newUser);
      } else {
        res.status(500).json({ messsage: 'Could not create user'});
      }    
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

authRouter.post('/login', 
  passport.authenticate('local'), 
  (req, res) => {

  // POST request - login user
  // path: localhost:3000/auth/login
  // body: 
  //  {
  //    "email": "user@email.com",
  //    "password": "123ABC",
  //  }
  // this path uses passport LocalStrategy (see main index.js)

    res.status(200).json(req.user.id);
  }
);

module.exports = authRouter;