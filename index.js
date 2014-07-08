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
  var allowDuplication = opts.allowDuplication || false;

  return function generateSlug(next, done) {
    var sluggableModified = isModifield.call(this, sluggable);
    var destModified = isModifield.call(this, dest);

    if (!sluggableModified && !destModified) { // no changes, just move on
      return next();
    } else {
      var string = (this[dest] && destModified) ?
        this[dest] :
        sluggableString.call(this, sluggable);

      this[dest] = toSlug(string);
    }

    if (allowDuplication) {
      return next();
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
 * @param {String|Array} fieldName
 * @return {Boolean}
 */

function isModifield(fieldName) {
  if (fieldName instanceof Array) {
    var self = this;
    var i = 0;
    var len = fieldName.length;
    for(; i<len; i++) {
      if (isModifield.call(self, fieldName[i])) {
        return true;
      }
    }
    return false;
  }

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

/*
 * return the sluggable(s)
 *
 * @param {String|Array} fieldName
 * @return {String}
 */

function sluggableString(fieldName) {
  if (fieldName instanceof Array) {
    var self = this;
    return fieldName.map(function(f) {
      return self[f];
    }).join("-");
  }

  return this[fieldName];
}

