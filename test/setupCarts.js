const db = require('../db/db');

const tableName = 'carts';
const fkColName = 'user_id';
const foreignKeyName = tableName + '_' + fkColName + '_fkey';
const usersTableName = 'users';
const usersKeyColName = 'id';

const carts = [
  {
    "created": new Date("01/02/2323"),
    "modified": new Date("01/02/2323"),    
    "user_id": 1
  },
  {
    "created": new Date("01/03/2023"),
    "modified": new Date("01/04/2323"),    
    "user_id": 3
  },
  {
    "created": new Date("01/05/2023"),
    "modified": new Date("01/05/2323"),    
    "user_id": 4
  }
];

const cartCount = carts.length;

async function createCartsTable() {
  const sqlCreateTable = `CREATE TABLE IF NOT EXISTS ${tableName} (
    "id"          integer     PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    "created"     DATE        NOT NULL,
    "modified"    DATE        NOT NULL CHECK (modified >= created),
    "user_id"     integer     NOT NULL UNIQUE REFERENCES ${usersTableName}(${usersKeyColName}) ON DELETE CASCADE
  );`;
  try {
    return await db.query(sqlCreateTable);
  } catch (err) {
    return err;
  }
};

async function insertAllCarts() {
  const sqlCommand = `
    INSERT INTO ${tableName} (created, modified, user_id) 
    VALUES ($1, $2, $3) 
    RETURNING *`;
  try {
    for (let i = 0; i < carts.length; i++) {
      const cart = carts[i];
      const { created, modified, user_id } = cart;
      const rowValues = [created, modified, user_id];
      await db.query(sqlCommand, rowValues);
    }
    return carts.length;
  } catch (error) {
    return error;
  }
};

module.exports = {
  tableName,
  foreignKeyName,
  cartCount,
  createCartsTable,  
  insertAllCarts
};