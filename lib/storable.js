"use strict";

var Responder = require('./responder.js').Responder;

exports.Storable = Responder.extend({
  
  initializer : function() {
    this.parent(Responder).constructor();
    
    // If a collection was specified for this class, add this to the collection now.
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