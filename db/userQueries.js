const db = require('../db/db');
const bcrypt = require('bcrypt');
require("dotenv").config();

// from https://stackoverflow.com/questions/46155/how-can-i-validate-an-email-address-in-javascript
function validEmail(email) {
  var re = /\S+@\S+\.\S+/;
  return re.test(email);
};

/**
 * finds one user by searching for a matching email address
 *
 * @param {String}  email
 * @return {Object|null} Object = User's data; mull = user not found
 */
async function findUserByEmail(email) {
  if (!validEmail(email)) {
    throw Error('invalid email');
  }
  const sqlCommand = `SELECT * FROM users WHERE email = $1`;
  try {
    const results = await db.query(sqlCommand, [email]);
    if (db.validResultsAtLeast1Row(results)) {
      return results.rows[0];
    } else {
      return null;
    }
  } catch (err) {
    throw Error(err);
  }
};

/**
 * finds one user by searching for a matching id
 *
 * @param {Integer} id
 * @return {Object|null} Object = User's data; mull = user not found
 */
async function findUserById(id) {
  const sqlCommand = `SELECT * FROM users WHERE email = $1`;
  try {
    const results = await db.query(sqlCommand, [id]);
    if (db.validResultsAtLeast1Row(results)) {
      return results.rows[0];
    } else {
      return null;
    }
  } catch (err) {
    throw Error(err);
  }
}

/**
 * creates a new user record
 *
 * @param {Object} data - JSon object of user's data. NOTE: plain text password is in JSon object
 * @return {Object} JSon object of user's data. NOTE: password_hash is in returned JSon object
 */
async function createUser(data) {
  try {
    const { email, password, first_name, last_name, phone } = data;
    const saltRounds = parseInt(process.env.SALT_ROUNDS); 
    const salt = await bcrypt.genSalt(saltRounds);
    const password_hash = await bcrypt.hash(password, salt);
    const sqlCommand = `
      INSERT INTO users (email, password_hash, first_name, last_name, phone) 
      VALUES ($1, $2, $3, $4, $5) RETURNING *`;
    const rowValues = [email, password_hash, first_name, last_name, phone];
    const results = await db.query(sqlCommand, rowValues);
    if (db.validResultsAtLeast1Row(results)) {
      return results.rows[0];
    } else {
      return null;
    }
  } catch (err) {
    throw Error(err)
  }
};

module.exports = { 
  findUserByEmail, 
  findUserById,
  createUser
}
