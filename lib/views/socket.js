"use strict";

var View = require('./view.js').View;
var Storable = require('../storable.js').Storable;
var Collection = require('../collection.js').Collection;
var Model = require('../model.js').Model;
var und = require('underscore');

var SocketView = View.extend({
  initializer : function(obj, name, routes) {
    this.parent(View).constructor(name);
    this._clients = {};
    
    this.obj = obj || this.obj;
    this.routes = routes || this.routes;
    
    if(this.obj && this.obj.inheritsFrom(Storable) && this.obj.getCollection) {
      this.container = this.obj.getCollection();
      if(!this.container) {
        throw "Socket View requires a class with a collection defined."
      }
    }
    else {
      throw "Socket view requires an obj to be set to a Storable class."
    }
  },
  
  properties : {
    routes : undefined,
    obj : undefined,
    
    bindToClient : function(client, object) {
      client.bindOnce(object, 'change', function(event) {
        this._processEvent(client, event);
      }, this, this.name);
      
      client.bindOnce(object, 'add', function(event) {
        this._processEvent(client, event);
      }, this, this.name);
      
      client.bindOnce(object, 'remove', function(event) {
        this._processEvent(client, event);
      }, this, this.name);
      
      client.bindOnce(object, 'destroy', function(event) {
        this._processEvent(client, event);
      }, this, this.name);
    },
    
    unbindFromClient : function (client, object) {
      client.unbindOnce(object, 'change');
      client.unbindOnce(object, 'add');
      client.unbindOnce(object, 'remove');
      client.unbindOnce(object, 'destroy');
    },
    
    
    _processEvent : function(client, event) {
      var serialized = false;
      var view = false;
      
      // Check if it's the container. If so, render each object
      // in the event
      if (event.sender === this.container) {
        serialized = this.renderAll(client, event.payload);
        view = this;
      }
      
      // If not, is it and instance of the view obj or one of its sub-itemview's objs?
      else {
        view = this;
        while(view) {
          if (event.sender instanceof view.obj) {
            // We found the view that can render the object(s) in this event
            if(view.obj.inheritsFrom(Collection)) {
              serialized = view.render(client, event.sender, false, event.payload);
            }
            else if(view.obj.inheritsFrom(Model)) {
              serialized = view.render(client, event.sender, event.payload);
            }
            
            break;
          }
          view = view.itemView;
        }
      }
      
      if(view && serialized && !und.isEmpty(serialized)) {
        event.payload = serialized;
        view._forwardEventToClient(client, event);
      }
    },
    
    
    _forwardEventToClient : function(client, event) {
      var eventName = ""
      if(event.sender.id) {
        eventName = this.name + "/" + event.sender.id  + ":server" + event.name;
      }
      else {
        eventName = this.name  + ":server" + event.name;
      }
      
      if(event.payload && !und.isEmpty(event.payload)) {
        client.emit(eventName, event.payload);
      }
    },
    
    
    openRoutes : function(client) {
      if (!this._clients[client.id]) {
        this._clients[client.id] = client;
        
        if(this.routes) {
          und.each(this.routes, function(func, action) {
            var route = this.name + ":" + action;
            client.onMessage(route, this[func], this);
          }, this);
        }
        
        client.onMessage(this.name + ":disconnect", function(client, data) {
          if(data && data.id) {
            var object = this.container.get(data.id);
            this.unbindFromClient(client, object);
          }
          else {
            this.unbindFromClient(client, this.container);
          }
        }, this);
        
        client.onMessage('disconnect', function() {
          if (this._clients[client.id]) {
            delete this._clients[client.id];
            this.disconnect(client);
          }
        }, this);
      }
    },
     
    render : function() {
      return false;
    },
    
    renderAll : function(client, items) {
      var serialized = [];
      var requestedItems = (items) ? und.intersection(this.container.items, items) : this.container.items
      
      und.each(requestedItems, function(item) {
        var object = this.render(client, item);
        if (object && !und.isEmpty(object)) {
          serialized.push(object);
        }
      }, this);
      
      return serialized;
    },
    
    
    create : function(client, data) {
      var object = this.container.create(data);
      this.bindToClient(client, object);
      return this.render(client, object);
    },
    
    read : function(client, data) {
      var object = this.container.get(data.id);
      this.bindToClient(client, object)
      return this.render(client, object);
    },
    
    destroy : function(client, data) {
      var object = this.container.get(data.id);
      object.destroy();
      this.unbindFromClient(client, object);
      return data;
    },
    
    list : function(client, data) {
      this.bindToClient(client, this.container);
      return this.renderAll(client);;
    },
    
    disconnect : function() {
      
    }
  }
  
});

exports.SocketView = SocketView;