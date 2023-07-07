// to run test 
// >npx mocha test

const app = require('../index');

const dropAll = require('./preTest');
const testUsers = require('./users/users');
const testAuth = require('./auth/auth');
const testProducts = require('./products/products');
const testCarts = require('./carts/carts');
const testCartItems = require('./carts/cartItems');
const testOrders = require('./orders/orders');
const testOrderItems = require('./orders/orderItems');
const testCheckout = require('./checkout/checkout');

dropAll(app);
testUsers(app);
testAuth(app);
testProducts(app);
testCarts(app);
testCartItems(app);
testOrders(app);
testOrderItems(app);
testCheckout(app);