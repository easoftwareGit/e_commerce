// to run test 
// >npx mocha test

const app = require('../index');

const dropAll = require('./preTest');
const testUsers = require('./users');
const testAuth = require('./auth');
const testProducts = require('./products');
const testCarts = require('./carts');

// dropAll(app);
testUsers(app);
testAuth(app);
testProducts(app);
testCarts(app);
