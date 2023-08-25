const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

require("dotenv").config();
const port = process.env.PORT;

const app = express()

app.use(cors());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.set('trust proxy', 1);

// passport and session startup - start vvvv
// const store = new session.MemoryStore();
const userQuery = require('./db/userQueries');

// configure passport LocalStrategy
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    async (username, password, done) => {
      const errMsg = 'Incorrect username or password';
      try {
        const user = await userQuery.findUserByEmail(username);
        // if did not find user
        if (!user) return done(null, false, { message: errMsg });
        // found user, try to match hashed password        
        const matchedPassword = await bcrypt.compare(password, user.password_hash);
        // if password hashes do not match
        if (!matchedPassword) return done(null, false, { message: errMsg });
        // password hashes match                   
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// passport serializeUser/deserializeUser
passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser( async (id, done) => {  
  const user = await userQuery.findUserById(id); 
  return done(null, user);
});


// session configuration
// app.use(session) BEFORE app.use(passport....)
// app.use(session({
//   secret: process.env.SESSION_SECRET || 'not_so_secret',
//   cookie: {
//     maxAge: 1000 * 60 * 60 * 24,    
//     sameSite: "none"
//   },
//   resave: false,
//   saveUninitialized: false,
//   store,
// }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'not_so_secret',
  resave: false,
  saveUninitialized: false  
}));

// passport configuration
app.use(passport.initialize());
app.use(passport.session());

// passport and session startup - end ^^^^

// routes
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');
const productsRouter = require('./routes/products');
const cartsRouter = require('./routes/carts');
const ordersRouter = require('./routes/orders');
app.use('/users', usersRouter);
app.use('/auth', authRouter);
app.use('/products', productsRouter);
app.use('/carts', cartsRouter);
app.use('/orders', ordersRouter);

// usersRouter.stack.forEach(function(r){
//   if (r.route && r.route.path) {
//     console.log(r.route.stack[0].method.toUpperCase() +  ' /users' + r.route.path);
//   }
// })

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
});

module.exports = app;