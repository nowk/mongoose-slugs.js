/* jshint node: true */

var mongoose = require('mongoose');
var extend = require("node.extend");

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

  return function generateSlug(next, done) {
    var destModified = isModifield.call(this, dest);

    if (!isModifield.call(this, sluggable) && !destModified) { // no changes, just move on
      return next();
    }

    var string;
    if (destModified) {
      string = this[dest]; // "slug" has been manually defined
    } else {
      string = sluggableString.call(this, sluggable);
    }

    this[dest] = toSlug(string);

    // allow duplication
    if (opts.allowDuplication) {
      return next();
    }

    // check uniqueness
    var self = this;
    dupCount.call(this, modelName, dest, opts.scope, function(err, count) {
      if (err) {
        return done(err);
      }
      if (count > 0) {
        if (opts.invalidateOnDuplicate) {
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
 * dupCount queries for duplication and returns err, count
 *
 * @param {String} modelName
 * @param {String} dest
 * @param {Function} scope
 * @param {Function} callback
 * @api private
 */

function dupCount(modelName, dest, scope, callback) {
  scope = scope || function() {
    return {};
  };

  var regex = new RegExp("^"+this[dest]+"(\\-\\d+)?$", 'ig');
  var cond = {_id: {$ne: this._id}};
  cond[dest] = regex;
  mongoose.models[modelName].count(extend(true, cond, scope.call(this)), callback);
}

/*
 * isModifield returns boolean based on whether the field(s) have been modified
 *
 * @param {String|Array} fieldName
 * @return {Boolean}
 */

function isModifield(fieldName) {
  // recurse for an array of fields
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

  return ~this.modifiedPaths().indexOf(fieldName);
}

/*
 * toSlug removes non-word characters and replaces with a - (hyphen)
 *
 * @param {String} str
 * @return {String}
 */

function toSlug(str) {
  return str.toLowerCase().replace(/[^\w]/g, '-');
}

/*
 * sluggableString returns the string to be slugged from one ore more fields
 *
 * @param {String|Array} fieldName
 * @return {String}
 */

function sluggableString(fieldName) {
  if ("string" === typeof fieldName) {
    fieldName = [fieldName];
  }
  var self = this;
  return fieldName.map(function(f) {
    return self[f];
  }).join(" ").trim();
}

