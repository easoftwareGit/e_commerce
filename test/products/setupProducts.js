const db = require('../../db/db');

const {
  productsTableName 
} = require('../myConsts');

const products = [
  {		
    name:	'Snow Shovel Basic',
    model_number:	'100-100-01',
    description:	'Snow Shovel Basic 22 inch',
    price:	9.99
  },
  {		
    name:	'Snow Shovel Deluxe',
    model_number:	'100-101-01',
    description:	'Snow Shovel, Deluxe 24 inch',
    price:	19.99
  },
  {		
    name:	'Snow Shovel Super Deluxe (child NOT included)',
    model_number:	'100-103-01',
    description:	'Snow Shovel, Super Deluxe 26 inch',
    price:	49.99
  },
  {		
    name:	'Ice Scraper Windshield',
    model_number:	'100-201-01',
    description:	'Ice Scraper, Windshield 4 inch',
    price:	3.99
  }
];

const productCount = products.length;

async function createProductsIndex(indexName, columnName) {  
  const sqlCreateIndex = `CREATE UNIQUE INDEX IF NOT EXISTS ${indexName} ON ${productsTableName} (${columnName});`;
  try {
    return await db.query(sqlCreateIndex);
  } catch (err) {
    return err;
  }
};

function createProductsTable() {
  const sqlCreateTable = `CREATE TABLE IF NOT EXISTS ${productsTableName} (
    "id"            integer   PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    "name"          varchar   NOT NULL UNIQUE,
    "model_number"  varchar   NOT NULL UNIQUE,
    "description"   varchar   NOT NULL,
    "price"         DECIMAL   NOT NULL	
  );`;
  try {
    return db.query(sqlCreateTable);
  } catch (err) {
    return err;
  }
};

async function insertAllProducts() {
  const sqlCommand = `
    INSERT INTO ${productsTableName} (name, model_number, description, price)
    VALUES ($1, $2, $3, $4) 
    RETURNING *`;
  try {
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const { name, model_number, description, price } = product;
      const rowValues = [name, model_number, description, price];
      await db.query(sqlCommand, rowValues);      
    }
    return products.length;
  } catch (error) {
    return error;
  }
};

module.exports = {
  productCount,
  createProductsIndex,
  createProductsTable,
  insertAllProducts
}