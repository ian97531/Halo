"use strict";

var Storable = require('./storable').Storable;
var und = require('underscore');

function randomString(length) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&";
  length = length || 20;
    
  for( var i=0; i < length; i++ ) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

exports.Collection = Storable.extend({  
  initializer: function(models, options) {
    
    if (models && !(models instanceof Array) && !options) {
      options = models;
      models = undefined;
    }
    
    this.parent(Storable).constructor();
    this.contains = (options && options.contains) ? options.contains : this.contains;
    this.url = (options && options.url) ? options.url : this.url;
    
    if(!this.contains || !this.contains.inheritsFrom(Storable)) {
      throw "Collections must specify a subclass of Storable to contain.";
    }
    
    this._changes = {};
    this.items = models || [];
    
    if (options && options.items) {
      this.add(options.items);
    }
  },
  
  properties: {
    
    length: 0,
    url: undefined,
    contains: undefined,
    comparator: undefined,
            
    create: function(attributes, options) {
      
      var item = new this.contains(attributes, options);
      
      // If this is the model's collection, it'll get added to the
      // collection automatically. Otherwise, we need to add it.
      if (this.contains.getCollection() !== this) {
        this.push(item);
      }
      
      return item;
      
    },
    
    add: function(items) {
      var eventItems = [];
      items = (items instanceof Array) ? items : [items];
      items.forEach(function(item) { 
        if (item instanceof this.contains) {
          this.items.push(item);
        }
        // If this is an object literal, use it to instantiate a model
        else {
          item = this.create(item);
        }
        
        eventItems.push(item);
        this._repeatEvents(item);
        
        // If this collection is the primary collection for this type of model,
        // then we're responsible for giving it an id.
        var primaryCollection = this.contains.getCollection();
        if (this === primaryCollection) {
          item.id = und.uniqueId() + randomString(20);
          
          if(item.attributes) {
            item.attributes[item.keyAttribute] = item.id;
          }
          
        }
                
      }, this);
      this.length = this.items.length;
      this.sort();
      this.trigger("add", eventItems);
      
      return eventItems;
    },
    
    remove: function(items) {
      var removeItems = [];
      items = (items instanceof Array) ? items : [items];
      
      und.each(items, function(item) {
        if(!(item instanceof this.contains)) {
          item = this.get(item.id);
        }
        
        removeItems.push(item);
        this._stopRepeatingEvents(item);
      }, this);
      
      this.items = und.difference(this.items, removeItems);
      this.length = this.items.length;
      this.trigger("remove", removeItems);
      
      return removeItems;
    },
    
    push: function(item) {
      if (item instanceof this.contains) {
        this.items.push(item);
        this.sort();
        this.length = this.items.length;
        this.trigger("add", [item]);
        this._repeatEvents(item);
      }
      else {
        throw "Attempting to push an object of an incorrect type onto collection";
      }
    },
    
    pop: function() {
      var item = this.items.pop();
      this.length = this.items.length;
      this.trigger("remove", [item]);
      this._stopRepeatingEvents(item);
      return item;
    },
    
    shift: function() {
      var item = this.items.shift();
      this.length = this.items.length;
      this.trigger("remove", [item]);
      this._stopRepeatingEvents(item);
      return item;
    },
    
    unshift: function(item) {
      if (item instanceof this.contains) {
        this.items.unshift(item);
        this.sort();
        this.length = this.items.length;
        this.trigger("add", [item]);
        this._repeatEvents(item);
      }
      else {
        throw "Attempting to unshift an object of an incorrect type onto a collection";
      }
    },
    
    xport : function(attributes, items) {
      var requestedItems = (items) ? und.intersection(this.items, items) : this.items;
      
      var serialized = [];
      und.each(requestedItems, function(item) {
        serialized.push(item.xport(attributes));
      });
      
      return serialized;
    },
    
    get: function(id) {
      return und.find(this.items, function(model) {
        return (model.id === id) ? model : false;
      });
    },
    
    at: function(index) {
      return this.items[index];
    },
    
    sort: function() {
      if (this.comparator) {
        this.items = this.items.sort(this.comparator);
      }
    },
    
    forEach : function(iterator, context) {
      return und.each(this.items, iterator, context);
    },
    
    find : function(iterator, context) {
      return und.find(this.items, iterator, context);
    },
    
    filter : function(iterator, context) {
      return und.filter(this.items, iterator, context);
    },
    
    min : function(iterator, context) {
      return und.min(this.items, iterator, context);
    },
    
    max : function(iterator, context) {
      return und.max(this.items, iterator, context);
    },
    
    groupBy : function(iterator, context) {
      return und.groupBy(this.items, iterator, context);
    },
    
    shuffle : function() {
      this.items = und.shuffle(this.items);
    },
    
    all : function(iterator, context) {
      return und.all(this.items, iterator, context);
    },
    
    first : function(num) {
      return und.first(this.items, num);
    },
    
    initial : function(num) {
      return und.initial(this.items, num);
    },
    
    rest : function(num) {
      return und.rest(this.items, num);
    },
    
    last : function(num) {
      return und.last(this.items, num);
    },
    
    without : function() {
      return und.without(arguments);
    },
    
    indexOf : function(item) {
      var sorted = (this.comparator) ? true : false;
      return und.indexOf(this.items, item, sorted);
    },
    
    isEmpty : function() {
      return (this.items.length === 0);
    },
    
    lastIndexOf : function(item) {
      return und.lastIndexOf(this.items, item);
    },
    
    items : function() {
      return this.items;
    },
    
    _collectionItemDestroy : function(event) {
      this.remove(event.sender);
    },
    
    
    _repeatEvents : function(item) {
      this.bindTo(item, 'destroy', this._collectionItemDestroy, this);
      this.bindTo(item, 'all', this.repeat, this);
    },
    
    _stopRepeatingEvents : function(item) {
      this.unbindFrom(item, 'destroy', this._collectionItemDestroy, this);
      this.unbindFrom(item, 'all', this.repeat, this);
    }
  }
});

