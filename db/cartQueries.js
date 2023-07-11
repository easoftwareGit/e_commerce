const db = require('../db/db');

/**
 * returns one cart
 *
 * @param {Integer} cartId 
 * @return {Object} Object = 
 *    success: { status: 201, cart: cart data} 
 *    err: { status:404, message: error message }
 */
async function getCart(cartId) {

  const sqlCommand = `SELECT * FROM carts WHERE id = $1`;
  try {
    const results = await db.query(sqlCommand, [cartId]);
    if (db.validResultsAtLeast1Row(results)) {
      return {
        status: 200,
        cart: results.rows[0]
      }
    } else {
      return {
        status: 404,
        message: 'cart not inserted'
      } 
    }
  } catch (err) {
    throw Error(err);
  }
};

/**
 * returns all cart items for one cart
 *
 * @param {Integer} cartId - id of cart with items to find
 * @return {Array|null} Array = objects of cart data; mull = user not found
 */
async function getAllItemsForCart(cartId) {
  const sqlCommand = `
    SELECT cart_items.id, cart_id, product_id, quantity, 
          products.name, products.model_number, products.description,
          products.price, (quantity * products.price) AS item_total
    FROM cart_items
    INNER JOIN products ON (products.id = cart_items.product_id)
    WHERE cart_id = $1;`;
  try {
    const results = await db.query(sqlCommand, [cartId]);
    if (db.validResultsAtLeast1Row(results)) {
      return results.rows;
    } else {
      return null;
    }
  } catch (err) {
    throw Error(err);
  }
};

/**
 * gets the total price for all items on one cart
 *
 * @param {Integer} cartId - id of cart with items to sum
 * @return {Decimal} total price for all items in one cart
 */
async function getCartTotalPrice(cartId) {
  const sqlCommand = `
    SELECT SUM(quantity * products.price) AS price
    FROM cart_items
    INNER JOIN products ON (products.id = cart_items.product_id)
    WHERE cart_id = $1;`;
  try {
    const results = await db.query(sqlCommand, [cartId]);
    if (db.validResultsAtLeast1Row(results)) {
      const totalFloat = parseFloat(results.rows[0].price);
      const totalDecimal = Math.round((totalFloat + Number.EPSILON) * 100) / 100; 
      return totalDecimal;
    } else {
      return null;
    }    
  } catch (err) {
    throw Error(err);
  }
};

/**
 * deletes one cart row
 *
 * @param {Integer} cartId - id of cart to delete
 * @return {Object} Object = 
 *    success: { status: 201, rowCount: 1 }
 *    err: { status: error_code, rowCount: 0 }
 */
async function deleteCart(cartId) {
  const sqlCommand = `
    DELETE FROM carts
    WHERE id = $1;`;
  try {
    const results = await db.query(sqlCommand, [cartId]);
    if (results && results.rowCount === 1) {
      return {
        status: 200,
        rowCount: 1
      }
      // return results.rowCount;
    } else {
      return {
        status: 404,
        rowCount: 0
      }
      // return null;
    }
  } catch (err) {
    if (err.code === '23503') {
      return {
        status: 409,
        rowCount: 0
      }      
    } else {
      throw Error(err);
    }
  }
}

/**
 * deletes all cart items for one cart
 *
 * @param {Integer} cartId - id of cart to with items to delete
 * @return {Integer|null} Integer = # of rows deleted; null = error deleteing
 */
async function deleteCartItems(cartId) {
  const sqlCommand = `
    DELETE FROM cart_items
    WHERE cart_id = $1;`;
  try {
    const results = await db.query(sqlCommand, [cartId]);
    if (results && results.rowCount >= 0) {
      return results.rowCount;
    } else {
      return null;
    }
  } catch (err) {
    throw Error(err)
  }
};

module.exports = { 
  getCart,
  getAllItemsForCart,  
  getCartTotalPrice,  
  deleteCart, 
  deleteCartItems
}