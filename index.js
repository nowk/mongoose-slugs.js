/* jshint node: true */

var mongoose = require('mongoose');

/*
 * slug generator
 *
 * @param {String} modelName
 * @param {String|Array} sluggable
 * @param {String} dest
 * @param {Object} opts
 * @return {Function}
 */

module.exports = function(modelName, sluggable, dest, opts) {
  opts = opts || {};
  var invalidateOnDuplicate = opts.invalidateOnDuplicate || false;

  return function generateSlug(next, done) {
    var sluggableModified = isModifield.call(this, sluggable);
    var destModified = isModifield.call(this, dest);

    if (!sluggableModified && !destModified) { // no changes, just move on
      return next();
    } else {
      var string = (this[dest] && destModified) ?
        this[dest] :
        this[sluggable];

      this[dest] = toSlug(string);
    }

    // check uniqueness
    var self = this;
    var regex = new RegExp("^"+this[dest]+"(\\-\\d+)?$", 'ig');
    var cond = {_id: {$ne: this._id}};
    cond[dest] = regex;

    mongoose.models[modelName]
      .count(cond, function(err, count) {
        if (err) {
          return done(err);
        }

        if (count > 0) {
          if (invalidateOnDuplicate) {
            self.invalidate(dest, 'is already taken');
          } else {
            self[dest] = self[dest]+"-"+count;
          }
        }

        next();
      });
  };
};

/*
 * field has been modified
 *
 * @param {String} fieldName
 * @return {Boolean}
 */

function isModifield(fieldName) {
  return this.modifiedPaths().indexOf(fieldName) >= 0;
}

/*
 * parse string to slug
 *
 * @param {String} str
 * @return {String}
 */

function toSlug(str) {
  return str.toLowerCase().replace(/[^\w]/g, '-');
}
