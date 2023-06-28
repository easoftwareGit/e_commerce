const expect = require('chai').expect;
const request = require('supertest');
const db = require('../db/db');

const dbTools = require('../db/dbTools');
const { assert } = require('chai');

const setupProducts = require('./setupProducts');
const { response } = require('express');
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

    describe('GET /products', function() {

      it('returns an array', async function() {
        const response = await request(app)
          .get('/products')
          .expect(200);
        expect(response.body).to.be.an.instanceOf(Array);
      })

      it('returns an array of all users', async function() {
        const response = await request(app)
          .get('/products')
          .expect(200);
        expect(response.body.length).to.be.equal(productCount);
        response.body.forEach(product => {
          expect(product).to.have.ownProperty("id");
          expect(product).to.have.ownProperty("name");
          expect(product).to.have.ownProperty("model_number");
          expect(product).to.have.ownProperty("description");
          expect(product).to.have.ownProperty("price");
        });
      });
    });

    describe('GET /products/:id', function() {
      const getProductId = 2;

      it('returns a single product object', async function() {
        const response = await request(app)
          .get(`/products/${getProductId}`)
          .expect(200);
        const product = response.body;
        expect(product).to.be.an.instanceOf(Object);
        expect(product).to.not.be.an.instanceOf(Array);
      });

      it('returns a full product object', async function() {
        const response = await request(app)
          .get(`/products/${getProductId}`)
          .expect(200);
        const product = response.body;
        expect(product).to.have.ownProperty('id');
        expect(product).to.have.ownProperty('name');
        expect(product).to.have.ownProperty('model_number');
        expect(product).to.have.ownProperty('description');
        expect(product).to.have.ownProperty('price');
      });

      it('returned product has the correct id', async function() {
        const response = await request(app)
          .get(`/products/${getProductId}`)
          .expect(200);
        const product = response.body;
        expect(product.id).to.be.an.equal(getProductId);
      });

      it('called with a non-numeric ID returns a 404 error', function() {
        return request(app)
          .get('/products/ABC')
          .expect(404);
      });

      it('called with a invalid ID returns a 404 error', function() {
        return request(app)
          .get('/products/1234567890')
          .expect(404);
      });
    });

    describe('PUT /products/:id', function() {
      const putProductId = 2;
      const resetSqlCommand = `
        UPDATE products 
        SET name = 'Snow Shovel Deluxe', model_number = '100-101-01', description = 'Snow Shovel, Deluxe 24 inch', price = 19.99
        WHERE id = 2;`

      describe('Valid /products/:id', function() {
        before('before 1st PUT test', function() {
          db.query(resetSqlCommand);
        });
  
        afterEach('afterEach PUT test ', function() {      
          db.query(resetSqlCommand);
        });

        it('updates the correct product and returns it', async function() {
          let initialProduct;
          let updatedProduct;      

          const response = await request(app)
            .get(`/products/${putProductId}`);
          initialProduct = response.body;
          updatedProduct = Object.assign({}, initialProduct, { name: 'Deluxe Snow Shovel' });
          const response_1 = await request(app)
            .put(`/products/${putProductId}`)
            .send(updatedProduct)
            .expect(200);
          expect(response_1.body).to.be.deep.equal(updatedProduct);
        });
      });

      describe('Invalid PUT /products/:id', function() {
        const testProduct = {
          "name": "Child Shoveler",
          "model_number": "100-301-01",
          "description": "Child with chore to shovel snow",
          "price": 99.99
        };

        it('called with a non-numeric ID returns a 404 error', async function() {
          return await request(app)
            .put('/products/ABC')
            .send(testProduct)
            .expect(404);
        });

        it('called with an invalid ID returns a 404 error', async function() {
          return await request(app)
            .put('/products/1234567890')
            .send(testProduct)
            .expect(404);
        });
      });
    });

    describe('POST /products', function() {

      const newProduct = {
        "name": "Child Shoveler",
        "model_number": "100-301-01",
        "description": "Child with chore to shovel snow",
        "price": 99.99
      };
      const invalidProduct = {   
        "name": "Child Shoveler",     
        "model_number": "100-301-02",
        "description": "Child with chore to shovel snow",
        "price": 99.99
      };
      const resetSqlCommand = `
        DELETE FROM products         
        WHERE model_number = '100-301-01';`

      before('before first POST', async function() {
        await db.query(resetSqlCommand);
      })

      after('after last POST', async function() {
        await db.query(resetSqlCommand);
      });

      it('post a new product with valid data', async function() {
        const response = await request(app)
          .post('/products')
          .send(newProduct)
          .expect(201);
        const psotedProduct = response.body;
        assert.equal(psotedProduct.name, newProduct.name);
        assert.equal(psotedProduct.model_number, newProduct.model_number);
        assert.equal(psotedProduct.description, newProduct.description);
        assert.equal(psotedProduct.price, newProduct.price);
      });

      it('did NOT post product with a duplicate name', async function() {
        return await request(app)
          .post('/products')
          .send(invalidProduct)
          .expect(404);
      });

      it('did NOT post product with a duplicate model_number', async function() {
        invalidProduct.name = 'Parent Shoveler';
        invalidProduct.model_number = newProduct.model_number;
        return await request(app)
          .post('/products')
          .send(invalidProduct)
          .expect(404);
      });

      it('did NOT post product with no name', async function() {
        invalidProduct.name = null;
        invalidProduct.model_number = '100-301-02';
        return await request(app)
          .post('/products')
          .send(invalidProduct)
          .expect(404);
      });

      it('did NOT post product with no model_number', async function() {
        invalidProduct.name = 'Parent Shoveler';
        invalidProduct.model_number = null;
        return await request(app)
          .post('/products')
          .send(invalidProduct)
          .expect(404);
      });

      it('did NOT post product with no description', async function() {
        invalidProduct.model_number = '100-301-02';
        invalidProduct.description = null;
        return await request(app)
          .post('/products')
          .send(invalidProduct)
          .expect(404);
      });

      it('did NOT post product with no description', async function() {
        invalidProduct.description = 'Only when no kids are around';
        invalidProduct.price = null;
        return await request(app)
          .post('/products')
          .send(invalidProduct)
          .expect(404);
      });
      
    });

    describe('DELETE /products/:id', function() {

      const toDelProduct = {
        "name": "Child Shoveler",
        "model_number": "100-301-01",
        "description": "Child with chore to shovel snow",
        "price": 99.99
      };
      let delProductId;

      before('before DELETE tests', async function() {
        const sqlCommand = `
          INSERT INTO products (name, model_number, description, price) 
          VALUES ($1, $2, $3, $4) RETURNING *`;
        const rowValues = [toDelProduct.name, toDelProduct.model_number, toDelProduct.description, toDelProduct.price];
        const response = await db.query(sqlCommand, rowValues)
        const postedProduct = response.rows[0];
        delProductId = postedProduct.id;
      });

      describe('Valid deletes /product/:id', function() {

        it('deletes a product', async function() {
          const response = await request(app)
            .delete(`/products/${delProductId}`)
            .expect(200);
          const productId = parseInt(response.text);
          expect(productId).to.equal(delProductId);
        });
      });

      describe('invalid deletes /product/:id', function() {

        it('called with an product id that is not in database', function() {
          return request(app)
            .delete('/products/1234567890')
            .expect(404);
        });

        it('called with a non-numeric product id', function() {
          return request(app)
            .delete('/products/ABC')
            .expect(404);
        });
      });

    });
  });

};

module.exports = testProducts;