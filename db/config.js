require("dotenv").config();

const devConfig = {
  host: process.env.HOST,
  database: process.env.DATABASE,
  user: process.env.USER,
  password: process.env.PASSWORD,
  port: process.env.POSTGRES_PORT
}

module.exports = devConfig; 