const db = require('../db/db');
const dbTools = require('../db/dbTools');
const { 
  usersTableName, 
  productsTableName, 
  cartsTableName,
  cartItemsTableName
} = require('./myConsts');

async function dropAll(app) {

  try {
    await dbTools.dropTable(cartItemsTableName);
    await dbTools.dropTable(cartsTableName);
    await dbTools.dropTable(productsTableName);
    await dbTools.dropTable(usersTableName);
  } catch (error) {
    return error
  }
};

module.exports = dropAll;