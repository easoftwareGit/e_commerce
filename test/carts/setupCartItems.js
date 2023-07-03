const db = require('../../db/db');

const { 
  cartItemsTableName,
  cartsTableName,
  cartsKeyColName,
  productsTableName,
  productsKeyColName
} = require('../myConsts');

const items = [
  {
    cart_id: 1,
    product_id: 3,
    quantity: 1
  },
  {
    cart_id: 1,
    product_id: 4,
    quantity: 2
  },
  {
    cart_id: 2,
    product_id: 1,
    quantity: 2
  },
  {
    cart_id: 3,
    product_id: 3,
    quantity: 1
  },
  {
    cart_id: 3,
    product_id: 4,
    quantity: 1
  }
];

const cartItemsCount = items.length;

async function createCartItemsTable() {
  const sqlCreateTable = `CREATE TABLE IF NOT EXISTS ${cartItemsTableName} (
    "id"          integer     PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    "cart_id"     integer     NOT NULL REFERENCES ${cartsTableName}(${cartsKeyColName}),
    "product_id"  integer     NOT NULL REFERENCES ${productsTableName}(${productsKeyColName}),
    "quantity"    integer     NOT NULL
  )`;
  try {
    return db.query(sqlCreateTable);
  } catch (error) {
    return error;
  }
};

async function insertAllCartItems() {
  const sqlCommand = `
    INSERT INTO ${cartItemsTableName} (cart_id, product_id, quantity) 
    VALUES ($1, $2, $3) 
    RETURNING *`;
  try {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const { cart_id, product_id, quantity } = item;
      const rowValues = [cart_id, product_id, quantity];
      await db.query(sqlCommand, rowValues);
    }
    return items.length;
  } catch (error) {
    return error;
  }
};

module.exports = {
  cartItemsCount,
  createCartItemsTable,  
  insertAllCartItems
};