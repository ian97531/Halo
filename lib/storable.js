"use strict";

var Responder = require('./responder.js').Responder;

exports.Storable = Responder.extend({
  
  initializer : function() {
    this.parent(Responder).constructor();
    
    // If a collection was specified for this class, add this instance
    // to that collection now.
    var cls = this.cls();
    while(cls) {
      if (cls.collection) {
        cls.collection.add(this);
        break;
      }
      cls = cls.superclass ? cls.superclass() : false;
    }
  },
  
  properties : {
    
    id : undefined,
    
    destroy: function() {
      if (!this.isDestroyed()) {
        this._destroyed = true;
        this.unbindFromAll();
        this.trigger("destroy");
      }
    },
  
    isDestroyed: function() {
      return this._destroyed;
    }
    
  },
  
  classProperties: {
    
    collection : false,
    
    /*
       Function: getCollection
       Looks for a collection object attached to the current class. If one is not
       found, it traverses the ancestor tree looking for the closest class that
       has a collection object associated with it, and returns that collection.

       Parameters:
          cls - (Optional) A class in the ancestor hierarchy to start the serach with.
          If none is provided, the search will start with the current class.

       Returns:
          A collection object if one is found, or false.
    */
    getCollection: function(cls) {
      
      if (this.collection) {
        return this.collection;
      }
      
      cls = (cls) ? this.superclass(cls) : this;

      while(cls) {
        if (cls.collection) {
          this.collection = cls.collection;
          return cls.collection;
        }
      }
      
      return false;
    }
  }
});