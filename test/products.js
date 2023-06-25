const expect = require('chai').expect;
const request = require('supertest');
const db = require('../db/db');

const dbTools = require('../db/dbTools');
const { assert } = require('chai');

const setupProducts = require('./setupProducts');
const productCount = setupProducts.productCount;

function testProducts(app) {

  describe('/products routes', function() {

    describe('setup products table', function() {

      const productsTableName = setupProducts.tableName;

      it("DROP products", async function() {
        await dbTools.dropTable(productsTableName);
        const doesExist = await dbTools.tableExists(productsTableName);      
        expect(doesExist).to.be.false;
      });

      it('CREATE products', async function() {
        await setupProducts.createProductsTable();
        const doesExist = await dbTools.tableExists(productsTableName);      
        expect(doesExist).to.be.true;
      });

      it('CREATE INDEX for products name', async function() {
        await setupProducts.createProductsIndex(setupProducts.products_name_index_name, setupProducts.nameColName);
        const doesExist = await dbTools.indexExists(setupProducts.products_name_index_name);
        expect(doesExist).to.be.true;
      });

      it('CREATE INDEX for products model_number', async function() {
        await setupProducts.createProductsIndex(setupProducts.products_model_number_index_name, setupProducts.modelNumberColName);
        const doesExist = await dbTools.indexExists(setupProducts.products_model_number_index_name);
        expect(doesExist).to.be.true;
      });

      it('INSERT new products', async function() {
        const numInserted = await setupProducts.insertAllProducts(); 
        expect(numInserted).to.equal(productCount);
      });
    });

  });

};

module.exports = testProducts;