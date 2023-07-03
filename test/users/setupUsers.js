const db = require('../../db/db');

const { 
  usersTableName, 
  user_email_index_name 
} = require('../myConsts');

const users = [
  {  
    email: 'adam@email.com',
    password_hash: '123ABC',
    first_name: 'Adam',
    last_name: 'Smith',
    phone: '800 555-1212'
  },
  {      
    email: 'bill@gmail.com',
    password_hash: 'abcdef',
    first_name: 'Bill',
    last_name: 'Black',
    phone: '800 555-5555'
  },
  {
    email: 'chad@email.com',
    password_hash: 'HASHME',
    first_name: 'Chad',
    last_name: 'White',
    phone: '800 555-7890'
  },
  {
    email: 'doug@email.com',
    password_hash: 'QWERTY',
    first_name: 'Doug',
    last_name: 'Jones',
    phone: '800 555-2211'
  },
  {
    email: 'eric@email.com',
    password_hash: 'NOHASH',
    first_name: 'Eric',
    last_name: 'Johnson',
    phone: '800 555-1234'
  },
  {        
    email: "fred@email.com",
    password_hash: "123456",
    first_name: "Fred",
    last_name: "Green",
    phone: "800 555-4321"
  }
];

const userCount = users.length;

async function createUserEmailIndex() {
  const sqlCreateIndex = `CREATE UNIQUE INDEX IF NOT EXISTS ${user_email_index_name} ON ${usersTableName} (email);`;
  try {
    return await db.query(sqlCreateIndex);
  } catch (err) {
    return err;
  }
};

function createUsersTable() {
  const sqlCreateTable = `CREATE TABLE IF NOT EXISTS ${usersTableName} (
    "id"            integer     PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    "email"         varchar     NOT NULL UNIQUE,
    "password_hash" TEXT        NOT NULL,
    "first_name"    varchar     NOT NULL,
    "last_name"     varchar     NOT NULL,
    "phone"         varchar     NOT NULL
  );`
  try {
    return db.query(sqlCreateTable);
  } catch (err) {
    return err;
  }
};

async function insertAllUsers() {
  const sqlCommand = `
    INSERT INTO ${usersTableName} (email, password_hash, first_name, last_name, phone) 
    VALUES ($1, $2, $3, $4, $5) 
    RETURNING *`;
  try {
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const { email, password_hash, first_name, last_name, phone } = user;
      const rowValues = [email, password_hash, first_name, last_name, phone];      
      await db.query(sqlCommand, rowValues);
    }
    return users.length;
  } catch (error) {
    return error;
  }
}

module.exports = {
  userCount,
  createUserEmailIndex, 
  createUsersTable,   
  insertAllUsers
};