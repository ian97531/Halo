"use strict";

var View = require('./view.js').View;
var und = require('underscore');

var CollectionView = View.extend({
  initializer : function(name, collection, itemView) {
    this.parent(View).constructor(name);
    
    this.itemView = itemView || this.itemView;    
    this.collection = collection || this.collection;
    
    if(this.itemView) {
      if(!this.itemView instanceof View) {
        throw "The itemView in CollectionView must be an object of type View. " + this.name;
      }
    }
    
    if (!this.collection || !this.collection.inheritsFrom(Collection)) {
      throw "Collection view requires a collection class: " + this.name;
    }
    else if(!this.collection.collection) {
      throw "A collection view cannot represent a root collection " + this.name;
    }

  },
  
  properties : {
    collection : undefined,
    itemView : undefined,
    
    render : function(client, collection, options) {
      var attributes = options && options.attributes;
      var items = options && options.items;
      
      var allItems = this.collection.collection.items;
      var requestedItems = (items) ? und.intersection(allItems, items) : allItems;
      
      var serialized = {
        id : collection.id,
        items : []
      };
      
      und.each(requestedItems, function(item) {
        item = (this.itemView) ? this.itemView.render(client, item, attributes) : item.xport(attributes);
        if (item && !und.isEmpty(item)) { serialized.push(item); }
      });
      
      return serialized;
    },
  }
});

exports.CollectionView = CollectionView;