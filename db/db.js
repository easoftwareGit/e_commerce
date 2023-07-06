const config = require('./config');
const Pool = require('pg').Pool;

const pool = new Pool(config);

/**
 * checks if the results object has valid parameter values
 *
 * @param {Object} - results from a query
 * @return {Boolean} - true: results object valid and rows array has atleast 1 row; 
 *                   - false: results object invalid or rows array length < 1
 */
const validResultsAtLeast1Row = (results) =>  {
  return (Array.isArray(results.rows) && results.rows.length > 0);
}

/**
* executes a query on the pool connected database
* @param   {String} text - sql command to execute
* @param   {Array} values - arary of values for sql command
* @return  {Object|null} - some object properties:
*                            .rows[] - data rows
*                            .rowCount 
*/ 

const query = (text, values) => {
  return pool.query(text, values); 
};

module.exports = {validResultsAtLeast1Row, query};