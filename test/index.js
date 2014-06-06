/* jshint node: true */

var assert = require('chai').assert;
var async = require('async');
var mongoose = require('mongoose');
var generateSlug = require('..');

describe("mongoose-slugs", function() {
  var schema;

  before(function(done) {
    mongoose.connect("mongodb://127.0.0.1:27017/mongoose_slugs_test");
    mongoose.connection.once('connected', done);
  });

  after(function(done) {
    mongoose.disconnect(done);
  });

  beforeEach(function() {
    schema = mongoose.Schema({
      name: {type: String, required: true},
      slug: {type: String, required: true}
    });
  });

  afterEach(function(done) {
    var models = Object.keys(mongoose.models);
    var i = 0;
    var len = models.length;
    models.forEach(function(m) {
      var model = mongoose.models[m];
      model.remove({}, function(err) {
        if (i<len) {
          mongoose.models = {};
          done();
        }
        i++;
      });
    });
  });


  it("creates a slug for the model field and saves to dest", function(done) {
    schema.pre('validate', generateSlug('Product', 'name', 'slug'));
    var Product = mongoose.model('Product', schema);

    Product.create({name: 'A Product name'}, function(err, resource) {
      assert.equal(resource.slug, 'a-product-name');
      done();
    });
  });

  it("increments to ensure uniqueness", function(done) {
    schema.pre('validate', generateSlug('Product', 'name', 'slug'));
    var Product = mongoose.model('Product', schema);

    async.series([
      factory(Product, {name: 'A product name'}),
      factory(Product, {name: 'A Product name'}),
      factory(Product, {name: 'A product Name'})
    ], function(err, resources) {
      var slugs = resources.map(function(r) {
        return r.slug;
      });
      assert.deepEqual(slugs, ['a-product-name', 'a-product-name-1', 'a-product-name-2']);
      done();
    });
  });

  it("can define model field and saves to dest", function(done) {
    var postschema = mongoose.Schema({
      title: {type: String, required: true},
      title_slug: {type: String, required: true}
    });
    postschema.pre('validate', generateSlug('Post', 'title', 'title_slug'));
    var Post = mongoose.model('Post', postschema);

    async.series([
      factory(Post, {title: 'A post title'}),
      factory(Post, {title: 'A post title'}),
      factory(Post, {title: 'A post title'})
    ], function(err, resources) {
      var slugs = resources.map(function(r) {
        return r.title_slug;
      });
      assert.deepEqual(slugs, ['a-post-title', 'a-post-title-1', 'a-post-title-2']);
      done();
    });
  });

  it("regenerates slugs on name changes", function(done) {
    schema.pre('validate', generateSlug('Product', 'name', 'slug'));
    var Product = mongoose.model('Product', schema);

    async.series([
      factory(Product, {name: 'A product name'}),
      factory(Product, {name: 'A Product name'})
    ], function(err, resources) {
      Product.create({name: 'Another product'}, function(err, resource) {
        assert.equal(resource.slug, 'another-product');

        resource.save(function(err, resource) {
          assert.equal(resource.slug, 'another-product');

          resource.name = 'A product name';
          resource.save(function(err, resource) {
            assert.equal(resource.slug, 'a-product-name-2');
            done();
          });
        });
      });
    });
  });

  it("predefined slugs", function(done) {
    schema.pre('validate', generateSlug('Product', 'name', 'slug'));
    var Product = mongoose.model('Product', schema);

    async.series([
      factory(Product, {name: 'A product name', slug: 'the-best-product'}),
      factory(Product, {name: 'A Product name', slug: 'another-awesome-product'})
    ], function(err, resources) {
      Product.create({name: 'Another product', slug: 'super-duper'}, function(err, resource) {
        assert.equal(resource.slug, 'super-duper');

        resource.name = 'The best product';
        resource.save(function(err, resource) {
          assert.equal(resource.slug, 'the-best-product-1');
          done();
        });
      });
    });
  });

  it("provides a validation error instead of generating uniqueness", function(done) {
    var opts = {invalidateOnDuplicate: true};
    schema.pre('validate', generateSlug('Product', 'name', 'slug', opts));
    var Product = mongoose.model('Product', schema);

    Product.create({name: 'A product name'}, function(err, resource) {
      assert(!err && resource);

      Product.create({name: 'A product name'}, function(err, resource) {
        assert(err && !resource);
        assert.equal(err.errors.slug.message, 'is already taken');
        done();
      });
    });
  });
});

/*
 * factory for async
 *
 * @param {Model} model
 * @param {Object} attrs
 * @return {Function}
 */

function factory(model, attrs) {
  return function(callback) {
    model.create(attrs, callback);
  };
}
