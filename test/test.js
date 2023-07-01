// to run test 
// >npx mocha test

const app = require('../index');


const dropAll = require('./preTest');
const testUsers = require('./users/users');
const testAuth = require('./auth/auth');
const testProducts = require('./products/products');
const testCarts = require('./carts/carts');
const testCartItems = require('./carts/cartItems');

// dropAll(app);
// testUsers(app);
// testAuth(app);
// testProducts(app);
// testCarts(app);
testCartItems(app);
