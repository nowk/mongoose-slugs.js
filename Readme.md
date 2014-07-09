# Mongoose Slugs

[![Build Status](https://travis-ci.org/nowk/mongoose-slugs.js.svg?branch=master)](https://travis-ci.org/nowk/mongoose-slugs.js)
[![Code Climate](https://codeclimate.com/github/nowk/mongoose-slugs.js.png)](https://codeclimate.com/github/nowk/mongoose-slugs.js)

Middleware to generate slugs

## Install

    npm install mongoose-slugs

## Usage

    var mongoose = require('mongoose');
    var generateSlug = require('mongoose-slugs');

    var postschema = mongoose.Schema({
      title: {type: String, required: true},
      title_slug: {type: String, required: true}
    });

    postschema
      .pre('validate', generateSlug('Post', 'title', 'title_slug'));

    var Post = mongoose.model('Post', postschema);

Gives you:

    Post.create({title: 'A blog title'}, function(err, resource) {
      // resource.title_slug => 'a-blog-title';
    });

---

You can combine multiple fields

    postschema
      .pre('validate', generateSlug('Post', ['_id', 'title'], 'title_slug'));

Gives you:

    Post.create({title: 'A blog title'}, function(err, resource) {
      // resource.title_slug => '53913c7aed8b8d23273639cd-a-blog-title';
    });

---

You can run uniqueness validation with a scope

    postschema
      .pre('validate', generateSlug('Post', ['title'], 'title_slug'), {
        scope: function() {
          return {creator: this.creator}
        }
      });

This will run the validation with that condition included. The `scope` function will be run within the context of your model `this`.

## License

MIT
