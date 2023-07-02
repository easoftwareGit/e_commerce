const db = require('../../db/db');

const {
  ordersTableName,
  usersTableName,
  usersKeyColName
} = require('../myConsts');

const orders = [
  {
    "created": new Date("01/02/2023"),
    "modified": new Date("01/02/2023"),        
    "status": 'Created',
    "total_price": 13.98,
    "user_id": 3
  },
  {
    "created": new Date("02/02/2023"),
    "modified": new Date("02/02/2023"),    
    "status": 'Created',
    "total_price": 57.97,
    "user_id": 4
  }
];

const orderCount = orders.length;

async function createOrdersTable() {
  const sqlCreateTable = `CREATE TABLE IF NOT EXISTS ${ordersTableName} (
    "id"          integer     PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    "created"     DATE        NOT NULL,
    "modified"    DATE        NOT NULL CHECK (modified >= created),
    "status"      varchar     NOT NULL,
    "total_price" DECIMAL     NOT NULL,
    "user_id"     integer     NOT NULL REFERENCES ${usersTableName}(${usersKeyColName})
  );`;
  try {
    return await db.query(sqlCreateTable);
  } catch (error) {
    return error;
  };
};

async function insertAllOrders() {
  const sqlCommand = `
    INSERT INTO ${ordersTableName} (created, modified, status, total_price, user_id) 
    VALUES ($1, $2, $3, $4, $5) 
    RETURNING *`;
  try {
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      const { created, modified, status, total_price, user_id } = order;
      const rowValues = [created, modified, status, total_price, user_id];
      await db.query(sqlCommand, rowValues);
    }
    return orders.length;
  } catch (error) {
    return error;
  }
};

module.exports = {
  orderCount, 
  createOrdersTable,
  insertAllOrders
};