const db = require('../../db/db');

const {
  orderItemsTableName,
  ordersTableName,
  ordersKeyColName,
  productsTableName,
  productsKeyColName
} = require('../myConsts');

const items = [
  {
    order_id: 1,
    product_id: 1,
    quantity: 1,
    price_unit: 9.99
  },
  {
    order_id: 1,
    product_id: 4,
    quantity: 1,
    price_unit: 3.99
  },
  {
    order_id: 2,
    product_id: 3,
    quantity: 1,
    price_unit: 49.99
  },
  {
    order_id: 2,
    product_id: 4,
    quantity: 1,
    price_unit: 3.99
  }
];

const orderItemsCount = items.length;

async function createOrderItemsTable() {
  const sqlCreateTable = `CREATE TABLE IF NOT EXISTS ${orderItemsTableName} (
    "id"          integer     PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    "order_id"    integer     NOT NULL REFERENCES ${ordersTableName}(${ordersKeyColName}),
    "product_id"  integer     NOT NULL REFERENCES ${productsTableName}(${productsKeyColName}),
    "quantity"    integer     NOT NULL,
    "price_unit"  DECIMAL     NOT NULL	
  )`;
  try {
    return db.query(sqlCreateTable);
  } catch (error) {
    return error;
  }
}

async function insertAllOrderItems() {
  const sqlCommand = `
    INSERT INTO ${orderItemsTableName} (order_id, product_id, quantity, price_unit) 
    VALUES ($1, $2, $3, $4) 
    RETURNING *`;
  try {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const { order_id, product_id, quantity, price_unit } = item;
      const rowValues = [order_id, product_id, quantity, price_unit];
      await db.query(sqlCommand, rowValues);
    }
    return items.length;
  } catch (error) {
    return error;
  }
};

module.exports = {
  orderItemsCount,
  createOrderItemsTable,  
  insertAllOrderItems
};