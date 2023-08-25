const express = require('express');
const authRouter = express.Router();
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

// authRouter.post('/login', 
//   passport.authenticate('local'), 
//   (req, res) => {

//   // POST request - login user
//   // path: localhost:3000/auth/login
//   // body: 
//   //  {
//   //    "email": "user@email.com",
//   //    "password": "123ABC",
//   //  }
//   // this path uses passport LocalStrategy (see main index.js)

//     res.status(200).json(req.user.id);
//   }
// );

authRouter.post('/login', passport.authenticate('local', {
  successRedirect: `/auth/profile`,
  failureRedirect: '/auth/login',
  failureFlash: false
}));

authRouter.get('/logout', (req, res, next) => {

  // GET request - log out user
  // path: localhost:5000/auth/logout
  // body: not used
  // this path uses passport LocalStrategy (see main index.js)

  req.logout(err => {
    if (err) {
      return next(err);
    }
    res.redirect(`/auth/login`);
  })
})

// authRouter.get('/profile', loggedIn, (req, res, next) => {

//   // GET request - go to profile page (test if user is logged in)
//   // path: localhost:5000/auth/profile
//   // body: not used
//   // this path uses passport LocalStrategy (see main index.js)
//   //   and the loggedIn middleware function

//   res.status(200).send(req.user);  
// });

authRouter.get('/profile', (req, res) => {
  if (req.isAuthenticated()) {
    res.send('Welcome to your profile');
  } else {
    res.redirect('/auth/login');
  }
});

function loggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {        
    res.status(401).send('not logged in');
  }
};

authRouter.get('/is_logged_in', loggedIn, (req, res) => {
  res.status(200).send("User logged in")
});

authRouter.get('/login', (req, res) => {
  res.send('Login Page');
});

module.exports = authRouter;