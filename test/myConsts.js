const usersTableName = 'users';
const user_email_index_name = 'users_email_idx';
const usersKeyColName = 'id';

const productsTableName = 'products';
const nameColName = 'name';
const modelNumberColName = 'model_number';
const products_name_index_name = 'products_name_idx';
const products_model_number_index_name = 'products_model_number_idx';
const productsKeyColName = 'id';

const cartsTableName = 'carts';
const userIdfkColName = 'user_id';
const cartsUserIdForeignKeyName = cartsTableName + '_' + userIdfkColName + '_fkey';
const cartsKeyColName = 'id';

const cartItemsTableName = 'cart_items';
const cartIdFkColName = 'cart_id';
const cartsForeignKeyName = cartItemsTableName + '_' + cartIdFkColName + '_fkey';
const productsFkColName = 'product_id';
const cartProductIdForeignKeyName = cartItemsTableName + '_' + productsFkColName + '_fkey';

const ordersTableName = 'orders';
const ordersUserIdForeignKeyName = ordersTableName + '_' + userIdfkColName + '_fkey';
const ordersKeyColName = 'id';

const orderItemsTableName = 'order_items';
const orderIdFkColName = 'order_id';
const ordersForeignKeyName = orderItemsTableName + '_' + orderIdFkColName + '_fkey';
const ordersProductsIdForeignKeyName = orderItemsTableName + '_' + productsFkColName + '_fkey';

module.exports = {
  usersTableName,
  user_email_index_name,
  usersKeyColName,
  productsTableName,
  nameColName,
  products_name_index_name,
  modelNumberColName,
  products_model_number_index_name,
  productsKeyColName,
  cartsTableName,
  userIdfkColName,
  cartsUserIdForeignKeyName,
  cartsKeyColName,
  cartItemsTableName,
  cartsForeignKeyName,
  productsFkColName,
  cartProductIdForeignKeyName,
  ordersTableName,
  ordersUserIdForeignKeyName,
  ordersKeyColName,
  orderItemsTableName,
  orderIdFkColName,
  ordersForeignKeyName,
  ordersProductsIdForeignKeyName
};