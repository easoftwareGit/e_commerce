// to run test 
// >npx mocha test

// const expect = require('chai').expect;
// const request = require('supertest');
// const db = require('../db/db');

// const setupUsers = require('./setupUsers');
// const dbTools = require('../db/dbTools');

const app = require('../index');
// const { assert } = require('chai');

const testUsers = require('./users');
const testAuth = require('./auth');
const testProducts = require('./products');
const testCarts = require('./carts');

// testUsers(app);
// testAuth(app);
// testProducts(app);
testCarts(app);
