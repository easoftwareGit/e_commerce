const db = require('../db/db');
const dbTools = require('../db/dbTools');
const { 
  usersTableName, 
  productsTableName, 
  cartsTableName,
  cartItemsTable
} = require('./myConsts');

// const usersTableName = 'users';
// const productsTableName = 'products';
// const cartsTableName = 'carts';
// const cartItemsTable = 'cart_items';

async function dropAll(app) {

  try {
    await dbTools.dropTable(cartItemsTable);
    await dbTools.dropTable(cartsTableName);
    await dbTools.dropTable(productsTableName);
    await dbTools.dropTable(usersTableName);
  } catch (error) {
    return error
  }
};

module.exports = dropAll;