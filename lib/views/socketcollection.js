"use strict";

var View = require('./view.js').View;
var SocketView = require('./socket.js').SocketView;
var Collection = require('../collection.js').Collection;
var und = require('underscore');


var SocketCollectionView = SocketView.extend({
  initializer : function(name, collection, itemView, routes) {
    this.parent(SocketView).constructor(collection, name, routes);
    
    this.itemView = itemView || this.itemView;
    if(this.itemView) {
      if(!(this.itemView.cls().inheritsFrom(View))) {
        throw "The itemView in CollectionView must be an object of type View."
      }
    }
    
    if (!this.obj.inheritsFrom(Collection)) {
      throw "CollectionViews require a collection object";
    }
  },
  
  properties : {
    
    routes : {
      create    : 'create', 
      read      : 'read', 
      add       : 'add',
      remove    : 'remove',
      destroy   : 'destroy', 
      list      : 'list', 
    },
    
    itemView : undefined,
    
    
    render : function(client, collection, attributes, items) {
      var serialized = [];
      var requestedItems = items || collection.items
      
      und.each(requestedItems, function(item) {
        var object = (this.itemView) ? this.itemView.render(client, item, attributes) : item.xport(attributes);
        if (object && !und.isEmpty(object)) {
          serialized.push(object);
        }
      }, this);
      
      return serialized;
    },
    
    
    add : function(client, data) {
      var collection = this.container.get(data.id);
      var items = collection.add(data.items);
      return this.render(client, collection, false, items);
    },
    
    remove : function(client, data) {
      var collection = this.container.get(data.id);
      var items = collection.remove(data.items);
      return this.render(client, model, false, items);
    },
  }
});

exports.SocketCollectionView = SocketCollectionView;