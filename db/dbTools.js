const db = require('./db');

function dropTable(name) {
  const sqlCommand = `DROP TABLE IF EXISTS ${name}`;  
  try {
    const results = db.query(sqlCommand);   // drop the table    
    return results;
  } catch (err) {
    return err;
  }
};

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
  indexExists,
  tableExists 
};
