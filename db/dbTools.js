const db = require('./db');

/**
 * drops a table from the database
 *
 * @param {String} name - name of table to drop
 * @return {Object|null} Object = query results object; null = error; 
 */
function dropTable(name) {
  const sqlCommand = `DROP TABLE IF EXISTS ${name}`;  
  try {
    const results = db.query(sqlCommand);   // drop the table    
    return results;
  } catch (err) {
    return err;
  }
};

/**
 * checks if a foreign key exists in the database
 *
 * @param {String} name - foreign key name
 * @return {Boolean|null} 
 *  Boolean = true if foreign key exists, false if it does not; 
 *  null = error
 */
async function foreignKeyExists(name) {
  const sqlCommand = `
    SELECT * FROM information_schema.table_constraints 
    WHERE constraint_name = '${name}'`;
  // SELECT * FROM information_schema.table_constraints WHERE constraint_name = 'carts_user_id_fkey';
  try {
    const results = await db.query(sqlCommand); 
    return db.validResultsAtLeast1Row(results);
  } catch (err) {
    return err;
  }  
};

/**
 * checks if an index exists
 *
 * @param {String} name - name of index
 * @return {Boolean|null} 
 *  Boolean = true if index exists, false if it does not; 
 *  null = error
 */
async function indexExists(name) {
  const sqlCommand = `
    SELECT *
    FROM pg_indexes
    WHERE indexname = '${name}';`
  try {
    const results = await db.query(sqlCommand); 
    return db.validResultsAtLeast1Row(results);
  } catch (err) {
    return err;
  }
};

/**
 * checks if a table exists
 *
 * @param {String} name - name of table
 * @return {Boolean|null} 
 *  Boolean = true if table exists, false if it does not; 
 *  null = error
 */
async function tableExists(name) {
  const sqlCommand = `
    SELECT * 
    FROM pg_catalog.pg_tables 
    WHERE tablename = '${name}';`
  try {
    const results = await db.query(sqlCommand);
    return db.validResultsAtLeast1Row(results);
  } catch (err) {
    return err;
  }  
};

module.exports = { 
  dropTable,
  foreignKeyExists,
  indexExists,
  tableExists 
};
