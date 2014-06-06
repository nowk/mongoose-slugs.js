# Mongoose Slugs

[![Build Status](https://travis-ci.org/nowk/mongoose-slugs.js.svg?branch=master)](https://travis-ci.org/nowk/mongoose-slugs.js)
[![Code Climate](https://codeclimate.com/github/nowk/mongoose-slugs.js.png)](https://codeclimate.com/github/nowk/mongoose-slugs.js)

Middleware to generate slugs

## Install

    npm install mongoose-slugs

## Usage

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
      // resource.slug => 'a-blog-title';
    });

## License

MIT
